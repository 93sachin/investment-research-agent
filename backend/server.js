import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import yahooFinance from 'yahoo-finance2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, 'cache.json');

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

const yahooFinanceTool = tool(
  async ({ symbol }) => {
    try {
      const quote = await yahooFinance.quote(symbol);
      let summary = {};
      try {
        summary = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile", "defaultKeyStatistics", "financialData", "summaryDetail"] });
      } catch(e) {}
      
      const profile = summary.assetProfile || {};
      const stats = summary.defaultKeyStatistics || {};
      const financials = summary.financialData || {};
      const details = summary.summaryDetail || {};

      const formatMarketCap = (mc) => {
        if (!mc) return 'N/A';
        if (mc >= 1e12) return (mc / 1e12).toFixed(2) + 'T';
        if (mc >= 1e9) return (mc / 1e9).toFixed(2) + 'B';
        if (mc >= 1e6) return (mc / 1e6).toFixed(2) + 'M';
        return mc.toString();
      };

      const trailingPE = details.trailingPE ? details.trailingPE.toFixed(2) : 'N/A';
      const forwardPE = details.forwardPE ? details.forwardPE.toFixed(2) : 'N/A';
      const pegRatio = stats.pegRatio ? stats.pegRatio.toFixed(2) : 'N/A';
      const debtToEquity = financials.debtToEquity ? financials.debtToEquity.toFixed(0) + '%' : 'N/A';
      const profitMargin = financials.profitMargins ? (financials.profitMargins * 100).toFixed(2) + '%' : 'N/A';
      const roe = financials.returnOnEquity ? (financials.returnOnEquity * 100).toFixed(2) + '%' : 'N/A';
      const companyDesc = profile.longBusinessSummary ? profile.longBusinessSummary.substring(0, 400) + '...' : 'N/A';

      return `Price: $${quote.regularMarketPrice}, Change: ${quote.regularMarketChangePercent ? quote.regularMarketChangePercent.toFixed(2) : 0}%, Market Cap: $${formatMarketCap(quote.marketCap)}, Sector: ${profile.sector || 'Unknown'}, Industry: ${profile.industry || 'Unknown'}\n` +
             `Valuation: Trailing P/E: ${trailingPE}, Forward P/E: ${forwardPE}, PEG Ratio: ${pegRatio}, Debt to Equity: ${debtToEquity}, Profit Margin: ${profitMargin}, ROE: ${roe}\n` +
             `Description: ${companyDesc}`;
    } catch (e) {
      return `Error fetching stock data: ${e.message}`;
    }
  },
  {
    name: "yahoo_finance",
    description: "Get real-time stock prices, percent change, market cap, advanced financial ratios, and company description for a given ticker symbol.",
    schema: z.object({
      symbol: z.string().describe("The stock ticker symbol (e.g., TSLA, AAPL)."),
    }),
  }
);

const tools = [
  new TavilySearchResults({ maxResults: 3 }),
  yahooFinanceTool
];

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: 'llama-3.3-70b-versatile',
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a senior AI Investment Research Agent. Your job is to research a company and provide an investment verdict.
You must use the provided tools to perform distinct queries:
1. Recent news, developments, risks, and competitors (using Tavily search). Also gauge the public sentiment from these news articles.
2. Real-time stock data, valuation ratios, market cap, sector, industry, and description (using Yahoo Finance tool)

After gathering all this information, you must provide a final verdict in JSON format matching this exact structure:
{{
  "companyName": "The actual company name",
  "ticker": "The stock ticker symbol",
  "sector": "Sector name",
  "industry": "Industry name",
  "sharePrice": 150.25,
  "priceChange": -1.25,
  "marketCap": "2.8T",
  "verdict": "INVEST" or "PASS",
  "summary": "A brief 1-2 sentence executive summary of the company's current position and investment thesis.",
  "reasoningPoints": ["Strong reasoning point 1", "Strong reasoning point 2", "Strong reasoning point 3"],
  "riskPoints": ["Risk factor 1", "Risk factor 2"],
  "valuation": {{
    "trailingPE": "32.00",
    "forwardPE": "29.00",
    "pegRatio": "1.25",
    "debtToEquity": "90%",
    "profitMargin": "21.50%",
    "roe": "18.42%"
  }},
  "companyDescription": "A brief simulated profile of the company...",
  "sentiment": {{
    "score": 55,
    "text": "Slightly bullish overall market sentiment..."
  }}
}}
Ensure your final response is ONLY the raw JSON string and does not contain markdown formatting like \`\`\`json. The sharePrice and priceChange should be numbers. All valuation values should be strings. Sentiment score is 0-100.`],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"]
]);

const agent = createToolCallingAgent({
  llm: model,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

async function readCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function writeCache(cache) {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

app.get('/api/research', async (req, res) => {
  const { company } = req.query;
  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const cache = await readCache();
    const cacheKey = company.toLowerCase().trim();
    const cachedData = cache[cacheKey];

    if (cachedData && (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000)) {
      sendEvent('log', { message: 'Found recent research in cache. Loading instantly...' });
      sendEvent('result', cachedData.result);
      return res.end();
    }

    sendEvent('log', { message: `Starting comprehensive research for ${company}...` });

    const eventStream = await agentExecutor.streamEvents(
      { input: `Research the company: ${company}. Do 3-4 searches and use Yahoo finance. Output only JSON verdict.` },
      { version: "v2" }
    );

    let finalOutput = "";

    for await (const event of eventStream) {
      if (event.event === "on_tool_start") {
        sendEvent('log', { message: `Using tool [${event.name}] with input: ${JSON.stringify(event.data.input)}` });
      } else if (event.event === "on_tool_end") {
        sendEvent('log', { message: `Finished tool [${event.name}]. Digesting information...` });
      } else if (event.event === "on_chain_end" && event.name === "AgentExecutor") {
        if (event.data.output) {
          finalOutput = event.data.output.output || event.data.output.returnValues?.output || event.data.output;
        }
      }
    }

    sendEvent('log', { message: `Formulating final verdict...` });

    if (typeof finalOutput !== 'string') {
      finalOutput = JSON.stringify(finalOutput || "");
    }

    const jsonMatch = finalOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from the agent response.");
    }
    const jsonResult = JSON.parse(jsonMatch[0]);

    cache[cacheKey] = {
      timestamp: Date.now(),
      result: jsonResult
    };
    await writeCache(cache);

    sendEvent('result', jsonResult);
    res.end();
  } catch (error) {
    console.error("Research Error:", error);
    sendEvent('error', { message: error.message || 'An error occurred during research' });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
