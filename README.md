# AI Investment Research Agent

## Overview
This is a full-stack AI application that autonomously researches a company and provides an investment verdict (INVEST ✅ or PASS ❌). It uses a LangChain.js agent to search the web for recent news, financial performance, competitor info, and risk factors, before aggregating everything into a structured JSON verdict.

## How to run
1. Clone the repository
2. Make sure you have Node.js installed
3. Rename `.env.example` to `.env` in the root directory and add your API keys:
   - `GROQ_API_KEY`: Get from [console.groq.com](https://console.groq.com)
   - `TAVILY_API_KEY`: Get from [tavily.com](https://tavily.com)
4. Run `npm install` in the root directory to install all dependencies for both frontend and backend.
5. Run `npm start` to start both the backend Express server (port 5000) and the frontend Vite server concurrently.

## How it works
- **Frontend**: A React application built with Vite that provides a clean, modern UI for entering a company name. It uses the native `EventSource` API to consume Server-Sent Events (SSE) and display a real-time terminal log of the agent's thoughts.
- **Backend**: A Node.js/Express server exposing a `GET /api/research` streaming endpoint. It features a lightweight JSON file cache (`cache.json`) to serve recent queries instantly.
- **AI Agent**: Utilizes LangChain.js `AgentExecutor` with Groq's `llama-3.3-70b-versatile` model. The agent uses `TavilySearchResults` (for news/competitors) and a custom `yahoo_finance` tool (for real-time stock prices and P/E ratios). The final output is constrained to a specific JSON schema.

## Key decisions & trade-offs
- **Model Choice**: Groq's Llama-3.3 70B model provides extremely fast inference times, which is critical when running an agentic loop with multiple tool calls.
- **Streaming (SSE)**: Instead of blocking the HTTP request for 20 seconds, I implemented Server-Sent Events using LangChain's `.streamEvents()`. This vastly improves UX by showing the user exactly what the agent is researching in real-time.
- **Caching**: Implemented a local `cache.json` to store research for 24 hours. This saves LLM tokens and API calls for repeated searches.
- **Tooling**: Tavily Search is optimized for LLM RAG tasks, while the custom `yahoo-finance2` tool ensures the agent has hard, real-time financial metrics to base its verdict on.

## Example runs (3 companies)
1. **Nvidia**: INVEST ✅. High confidence due to near-monopoly in AI chips and massive revenue growth, though risks include high valuation and potential export restrictions.
2. **Peloton**: PASS ❌. Low confidence in turnaround due to continued cash burn, executive turnover, and shifting consumer behavior post-pandemic.
3. **Apple**: INVEST ✅. Solid core business supplemented by sticky services revenue and massive cash reserves, despite slowing hardware cycles.

## What I would improve with more time
1. Move from a local `cache.json` to a robust database like PostgreSQL or Redis for persistent storage across deployments.
2. Upgrade the LangChain `AgentExecutor` to LangGraph for more complex, cyclical routing and human-in-the-loop approvals.
3. Add a time-series charting library (like Recharts) to the frontend to visualize the Yahoo Finance historical data.
