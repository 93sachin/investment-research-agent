# AI Investment Research Agent

A full-stack AI application that researches a public company and
generates a structured investment research report with an **INVEST** or
**PASS** verdict.

**Live Demo:** https://investment-research-agent-dtzt.vercel.app/\
**GitHub Repository:**
https://github.com/93sachin/investment-research-agent

> **Disclaimer:** This project is for educational and research purposes
> only. AI-generated research can be incomplete or inaccurate and is not
> personalized financial advice.

## Overview

The application combines web search, financial data, and an LLM-powered
agent to analyze a company. The frontend displays the research result,
financial metrics, sentiment, reasoning, risk factors, and streaming
progress logs.

## Features

-   AI-assisted company research using a LangChain.js agent.
-   Web search through Tavily.
-   Financial data retrieval using `yahoo-finance2`.
-   Groq-hosted `openai/gpt-oss-20b` model integration.
-   Server-Sent Events (SSE) to stream research logs and the final
    result.
-   Structured research output with an INVEST or PASS verdict.
-   JSON file cache for repeated research requests (24-hour cache
    policy, as configured in the project).
-   React dashboard with company search, financial metrics, sentiment,
    reasoning, and risk assessment.

## Tech Stack

  Area               Technologies
  ------------------ -------------------------------
  Frontend           React, Vite
  Backend            Node.js, Express
  AI orchestration   LangChain.js
  LLM                Groq --- `openai/gpt-oss-20b`
  Web search         Tavily Search
  Financial data     `yahoo-finance2`
  Streaming          Server-Sent Events (SSE)
  Cache              JSON file (`cache.json`)
  Frontend hosting   Vercel
  Backend hosting    Render

## How It Works

1.  The user enters a company name in the frontend.
2.  The frontend sends a request to the backend research endpoint.
3.  The backend checks the research cache.
4.  If fresh cached data is available, it can return the cached result;
    otherwise, the agent gathers information using Tavily and Yahoo
    Finance tools.
5.  The LangChain agent uses the configured Groq model to analyze the
    gathered information.
6.  The backend streams progress logs and the final structured result
    through SSE.
7.  The frontend displays the report and its metrics, sentiment,
    reasoning, and risks.

## Architecture

``` text
User
  |
  v
React + Vite frontend (Vercel)
  |
  | GET /api/research?company=NVIDIA (SSE)
  v
Express backend (Render)
  |
  +--> LangChain AgentExecutor --> Groq LLM
  |
  +--> Tavily Search
  |
  +--> Yahoo Finance tool
  |
  v
Structured research result + progress events
  |
  v
React research dashboard
```

## Run Locally

### Prerequisites

-   Node.js and npm
-   A Groq API key
-   A Tavily API key

### 1. Clone the repository

``` bash
git clone https://github.com/93sachin/investment-research-agent.git
cd investment-research-agent
```

### 2. Configure environment variables

Create a `.env` file in the repository root, using `.env.example` as a
reference. Add your own API keys:

``` env
PORT=5005
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Get keys from: - [Groq Console](https://console.groq.com/) -
[Tavily](https://tavily.com/)

Do not commit `.env` or share your API keys publicly.

### 3. Install dependencies

From the repository root, run:

``` bash
npm install
```

The root package setup installs the backend and frontend dependencies.

### 4. Start the application

From the repository root, run:

``` bash
npm start
```

The root start script runs the backend and frontend concurrently: -
Backend: `http://localhost:5005` - Frontend: the local URL printed by
Vite, usually `http://localhost:5173`

Keep the terminal running while using the local application. Press
`Ctrl+C` to stop the processes.

### Alternative: Start each service separately

**Terminal 1 --- backend**

``` bash
cd backend
npm install
npm start
```

**Terminal 2 --- frontend**

``` bash
cd frontend
npm install
npm run dev
```

For local development, the frontend defaults to `http://localhost:5005`
if `VITE_API_URL` is not set.

## API

### Research a company

``` http
GET /api/research?company=NVIDIA
```

Local example:

``` text
http://localhost:5005/api/research?company=NVIDIA
```

The endpoint uses Server-Sent Events. The frontend listens for progress
events and a final result event.

## Deployment

The application is deployed as two services:

-   **Frontend (Vercel):**
    https://investment-research-agent-dtzt.vercel.app/
-   **Backend (Render):**
    https://investment-research-agent-kmxl.onrender.com

The frontend uses the `VITE_API_URL` environment variable to select the
backend base URL. In Vercel, set:

``` text
VITE_API_URL=https://investment-research-agent-kmxl.onrender.com
```

Select the appropriate Vercel environment (Production, and Preview if
needed), save the variable, and redeploy the frontend so the new value
is included in the build.

The backend requires its API credentials to be configured in the hosting
provider's environment settings. Do not put Groq or Tavily secrets in
frontend environment variables. Variables prefixed with `VITE_` are
exposed to client-side code and should contain only public
configuration, such as the backend URL.

A free Render instance may sleep after inactivity, so the first request
after a period of inactivity can be slower.

## Engineering Decisions and Trade-offs

### Model selection

The project uses Groq-hosted `openai/gpt-oss-20b` for inference. The
model was changed from an earlier Llama model when that model was no
longer available for the account; the tool-calling flow was retained.

### Server-Sent Events

SSE lets the frontend display progress while research is running, rather
than waiting without feedback for the complete response.

### Caching

The JSON file cache reduces repeated research calls and can help limit
external API and LLM usage. A file-based cache may not be durable across
hosting restarts or shared across multiple backend instances.

### Research tools

Tavily provides web-search results, while `yahoo-finance2` provides
financial data. Combining qualitative web information and quantitative
metrics gives the agent more context for its report.

## Example Research Scenarios

The project has been tested with company queries such as NVIDIA, Apple,
and Microsoft. Generated verdicts depend on the data available and the
model's analysis at the time; example verdicts should not be treated as
current or guaranteed investment recommendations.

## Future Improvements

-   Replace the JSON cache with a persistent database or Redis.
-   Consider LangGraph for more advanced routing and human approval
    workflows.
-   Add historical price charts and financial trend visualizations.
-   Add automated tests for the research endpoint, tool failures, and
    result validation.
-   Improve resilience with timeouts, retries, and clearer API error
    handling.
-   Display source links and data timestamps alongside research
    conclusions.

## License

No license is specified in this README. Add a license file if you want
to define how others may use, modify, and distribute this project.
