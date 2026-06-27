import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { resolveTicker, getCompanyData, getCompanyNews } from "./yahooFinance.js";

// Initialize LLM dynamically based on available API Keys
function getLLM(temperature = 0) {
  if (process.env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature,
    });
  } else if (process.env.GEMINI_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-1.5-flash",
      temperature,
    });
  } else {
    throw new Error("No LLM API keys found. Please set OPENAI_API_KEY or GEMINI_API_KEY in your .env file.");
  }
}

// 1. Define the LangGraph State Annotation
const GraphState = Annotation.Root({
  companyQuery: Annotation(),
  tickerInfo: Annotation(),
  financialData: Annotation(),
  newsArticles: Annotation(),
  sentimentScore: Annotation(),
  sentimentSummary: Annotation(),
  investmentVerdict: Annotation(),
  investmentReasoning: Annotation(),
  steps: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// 2. Define the Nodes

// Node 1: Resolve Ticker symbol from query
async function resolveTickerNode(state) {
  const query = state.companyQuery;
  const tickerInfo = await resolveTicker(query);
  return {
    tickerInfo,
    steps: [`Resolved company "${query}" to ticker symbol: ${tickerInfo.symbol} (${tickerInfo.name})`],
  };
}

// Node 2: Fetch financials and news from Yahoo Finance
async function fetchDataNode(state) {
  const ticker = state.tickerInfo.symbol;
  const name = state.tickerInfo.name;

  const [financialData, newsArticles] = await Promise.all([
    getCompanyData(ticker),
    getCompanyNews(ticker, name),
  ]);

  return {
    financialData,
    newsArticles,
    steps: [
      `Fetched key financial metrics and stats for ${ticker}.`,
      `Retrieved ${newsArticles.length} recent news articles for analysis.`
    ],
  };
}

// Node 3: Analyze recent news and calculate sentiment
async function analyzeSentimentNode(state) {
  const news = state.newsArticles;
  const ticker = state.tickerInfo.symbol;

  if (!news || news.length === 0) {
    return {
      sentimentScore: 50,
      sentimentSummary: "No recent news found. Market sentiment is neutral.",
      steps: ["Analyzed market sentiment: Neutral (No news)."],
    };
  }

  const llm = getLLM(0);
  const newsContent = news.map((n, i) => `[${i + 1}] Title: ${n.title}\nPublisher: ${n.publisher}\n`).join("\n");

  const prompt = `You are a financial analyst analyzing market sentiment for stock ${ticker}.
Review the following recent headlines:
${newsContent}

Perform a sentiment analysis:
1. Provide a single aggregate sentiment score between 0 and 100 (where 0 is extremely bearish/negative, 50 is neutral, and 100 is extremely bullish/positive).
2. Write a 2-3 sentence summary explaining the score based on the headlines.

Return your response strictly in the following JSON format:
{
  "score": number,
  "summary": "string description"
}`;

  try {
    const response = await llm.invoke([
      { role: "system", content: "You are an expert financial analysis assistant." },
      { role: "user", content: prompt }
    ]);
    
    // Parse response
    let text = response.content;
    // Extract JSON block if LLM formats as markdown code block
    if (text.includes("```")) {
      text = text.split("```")[1];
      if (text.startsWith("json")) {
        text = text.substring(4);
      }
    }
    const result = JSON.parse(text.trim());
    
    return {
      sentimentScore: result.score,
      sentimentSummary: result.summary,
      steps: [`Completed news sentiment analysis: Score of ${result.score}/100.`],
    };
  } catch (error) {
    console.error("Error in sentiment analysis node:", error);
    return {
      sentimentScore: 55,
      sentimentSummary: "Failed to parse LLM sentiment. Defaulting to slightly bullish overall market sentiment.",
      steps: ["Sentiment analysis encountered a parsing error. Used neutral fallback."],
    };
  }
}

// Node 4: Evaluate Financials + Sentiment and make final Investment Verdict
async function investmentVerdictNode(state) {
  const ticker = state.tickerInfo.symbol;
  const name = state.tickerInfo.name;
  const financials = state.financialData;
  const sentimentScore = state.sentimentScore;
  const sentimentSummary = state.sentimentSummary;

  const llm = getLLM(0.1);

  const prompt = `You are a Senior Investment Officer. You must evaluate the company ${name} (Ticker: ${ticker}) and make a final decision: "INVEST" or "PASS".

Here is the data collected:

### Financial Metrics:
- Current Price: $${financials.price || "N/A"}
- Market Cap: $${financials.marketCap ? (financials.marketCap / 1e9).toFixed(2) + "B" : "N/A"}
- Trailing P/E: ${financials.peRatio || "N/A"}
- Forward P/E: ${financials.forwardPe || "N/A"}
- PEG Ratio: ${financials.pegRatio || "N/A"}
- Debt-to-Equity: ${financials.debtToEquity || "N/A"}
- Return on Equity (ROE): ${financials.returnOnEquity || "N/A"}
- Profit Margin: ${financials.profitMargin || "N/A"}
- Operating Margin: ${financials.operatingMargins || "N/A"}
- Revenue Growth: ${financials.revenueGrowth || "N/A"}
- Recommendation Key: ${financials.recommendation || "N/A"}

### Market News Sentiment:
- Score: ${sentimentScore}/100
- Summary: ${sentimentSummary}

### Task:
Evaluate this company thoroughly:
1. Make a definitive decision: either "INVEST" (strong financials, reasonable valuation, positive growth prospects, favorable news/sentiment) or "PASS" (high valuation, excessive debt, slowing growth, severe risks, or bearish sentiment). Do not sit on the fence.
2. Provide a detailed reasoning breakdown. Structure it with 3-5 distinct bullet points explaining your decision.
3. List the top key risks for this company.

Return your response strictly in the following JSON format:
{
  "decision": "INVEST" | "PASS",
  "reasoning": [
    "Point 1 explaining financial strengths/weaknesses...",
    "Point 2 explaining valuation analysis...",
    "Point 3 explaining news sentiment context...",
    "Point 4 explaining industry positioning..."
  ],
  "risks": [
    "Risk factor 1...",
    "Risk factor 2..."
  ]
}`;

  try {
    const response = await llm.invoke([
      { role: "system", content: "You are an elite hedge fund portfolio manager." },
      { role: "user", content: prompt }
    ]);

    let text = response.content;
    if (text.includes("```")) {
      text = text.split("```")[1];
      if (text.startsWith("json")) {
        text = text.substring(4);
      }
    }
    const result = JSON.parse(text.trim());

    return {
      investmentVerdict: result.decision,
      investmentReasoning: {
        points: result.reasoning,
        risks: result.risks
      },
      steps: [`Hedge fund workflow finalized. Recommendation generated: ${result.decision}.`],
    };
  } catch (error) {
    console.error("Error in investment verdict node:", error);
    return {
      investmentVerdict: "PASS",
      investmentReasoning: {
        points: ["Failed to generate structured reasoning due to an LLM error."],
        risks: ["Hedge fund engine error."]
      },
      steps: ["Failed to finalize verdict node cleanly."],
    };
  }
}

// 3. Compile the State Graph
const workflow = new StateGraph(GraphState)
  .addNode("resolveTicker", resolveTickerNode)
  .addNode("fetchData", fetchDataNode)
  .addNode("analyzeSentiment", analyzeSentimentNode)
  .addNode("investmentVerdict", investmentVerdictNode)
  
  // Set up execution order
  .addEdge("__start__", "resolveTicker")
  .addEdge("resolveTicker", "fetchData")
  .addEdge("fetchData", "analyzeSentiment")
  .addEdge("analyzeSentiment", "investmentVerdict")
  .addEdge("investmentVerdict", "__end__");

export const compiledGraph = workflow.compile();
