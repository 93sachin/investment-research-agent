"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Newspaper,
  FileJson,
  RefreshCw,
  Building2,
  DollarSign,
  Percent,
  AlertOctagon,
  HelpCircle
} from "lucide-react";

// Quick tags for the user
const QUICK_TAGS = ["Apple", "Tesla", "NVIDIA", "Microsoft", "Amazon", "Reliance Industries"];

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  // Custom simulator for real-time agent thought logs
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Spinning up LangGraph agent workflow...",
    "Resolving company name to market ticker symbol...",
    "Querying Yahoo Finance for real-time stock quotes...",
    "Retrieving balance sheet, profitability ratios, and metrics...",
    "Scraping recent market news and headlines...",
    "Running LLM-based sentiment analysis on news articles...",
    "Analyzing financials and sentiment to compile final verdict...",
    "Finalizing research thesis..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1800);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleResearch = async (query) => {
    const searchVal = query || companyName;
    if (!searchVal.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: searchVal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to analyze company.");
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError({
        title: err.message === "API Key Missing" ? "API Key Configuration Required" : "Analysis Failed",
        message: err.message || "An unexpected error occurred. Please check console logs."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag) => {
    setCompanyName(tag);
    handleResearch(tag);
  };

  const formatCurrency = (val) => {
    if (!val) return "N/A";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Header */}
      <header className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold font-mono">Autonomous Analyst V1.0</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Fortress AI Investment Research Agent
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Input any public company. Our agent resolves the ticker, fetches real-time financial statements, analyzes market news sentiment, and makes an automated investment decision.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            GitHub Repo
          </a>
        </div>
      </header>

      {/* Main Panel */}
      <div className="flex-grow flex flex-col gap-8">
        
        {/* Search Control Card */}
        <section className="glass-panel p-6 rounded-2xl glow-cyan relative overflow-hidden">
          <div className="scan-line opacity-10"></div>
          
          <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-cyan-400" /> Initiate Company Research
          </h2>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apple, Tesla, Reliance, Microsoft..."
                disabled={loading}
                className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
                onKeyDown={(e) => e.key === "Enter" && handleResearch()}
              />
            </div>
            <button
              onClick={() => handleResearch()}
              disabled={loading || !companyName.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-cyan-500 shadow-lg shadow-cyan-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Activity className="h-5 w-5" /> Run Research
                </>
              )}
            </button>
          </div>

          {/* Quick Tags */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500 mr-1">Quick Select:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                disabled={loading}
                className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition disabled:opacity-50"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Loading / Progress State */}
        {loading && (
          <section className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center py-16 animate-fade-in relative overflow-hidden">
            <div className="h-16 w-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Target Asset</h3>
            <p className="text-slate-400 text-sm max-w-md mb-8">
              The agent is conducting deep financial research and running natural language heuristics. Please hold...
            </p>
            
            {/* Step Visualizer */}
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 text-left font-mono text-xs text-slate-400">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-cyan-400">AGENT LOGS:</span>
                <span className="text-slate-500 animate-pulse">Running Graph...</span>
              </div>
              <div className="space-y-2">
                {loadingSteps.map((step, idx) => {
                  const isActive = idx === loadingStep;
                  const isDone = idx < loadingStep;
                  return (
                    <div key={idx} className={`flex items-start gap-2 transition-all ${isActive ? "text-cyan-400 font-semibold" : isDone ? "text-slate-500" : "text-slate-700"}`}>
                      <span>{isDone ? "[✓]" : isActive ? "[▶]" : "[ ]"}</span>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Error / Key Setup Warning */}
        {error && (
          <section className="bg-rose-950/20 border border-rose-800/80 p-6 rounded-2xl flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-rose-300">{error.title}</h3>
              <p className="text-slate-300 text-sm mt-1 mb-4">{error.message}</p>
              {error.title.includes("API Key") && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">To resolve this:</p>
                  <p>1. Open your project root folder.</p>
                  <p>2. Create a file named <span className="text-cyan-400">.env.local</span>.</p>
                  <p>3. Add your key: <span className="text-cyan-400">OPENAI_API_KEY=sk-proj-xxxx...</span> or <span className="text-cyan-400">GEMINI_API_KEY=xxxx...</span></p>
                  <p>4. Restart your next.js server and try again.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Results Dashboard */}
        {result && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Top overview widget */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <Building2 className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-white">{result.companyName}</h3>
                    <span className="text-xs bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">
                      {result.ticker}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{result.researchData.sector} • {result.researchData.industry}</p>
                </div>
              </div>

              <div className="flex gap-6 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0 w-full md:w-auto">
                <div className="flex-1 md:flex-initial">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Share Price</p>
                  <p className="text-xl font-mono font-bold text-white">
                    ${result.researchData.price ? result.researchData.price.toFixed(2) : "N/A"}
                  </p>
                </div>
                <div className="flex-1 md:flex-initial">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Price Change</p>
                  <span className={`text-sm font-semibold flex items-center gap-1 ${result.researchData.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {result.researchData.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {result.researchData.changePercent ? `${result.researchData.changePercent.toFixed(2)}%` : "0.00%"}
                  </span>
                </div>
                <div className="flex-1 md:flex-initial">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Market Cap</p>
                  <p className="text-xl font-mono font-bold text-white">
                    {formatCurrency(result.researchData.marketCap)}
                  </p>
                </div>
              </div>
            </div>

            {/* Verdict Card */}
            <div className={`glass-panel p-8 rounded-2xl relative overflow-hidden border-t-4 shadow-xl ${
              result.decision === "INVEST" 
                ? "border-t-emerald-500 glow-emerald" 
                : "border-t-rose-500 glow-rose"
            }`}>
              <div className="scan-line opacity-[0.03]"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 uppercase tracking-widest text-xs font-mono font-bold">Research Verdict</span>
                    <span className="text-slate-600 font-mono text-xs">|</span>
                    <span className="text-slate-400 text-xs font-mono">Consensus: {result.researchData.recommendation?.toUpperCase()}</span>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white flex items-center gap-3">
                    Agent Decision: 
                    <span className={result.decision === "INVEST" ? "text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-800/40" : "text-rose-400 bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-800/40"}>
                      {result.decision}
                    </span>
                  </h3>
                </div>
                <div>
                  {result.decision === "INVEST" ? (
                    <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                  ) : (
                    <XCircle className="h-16 w-16 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Thesis Reasoning Bullet Points */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold tracking-wider uppercase text-slate-300 mb-3 font-mono">
                    Analysis Reasoning:
                  </h4>
                  <ul className="space-y-3.5">
                    {result.reasoning.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {result.decision === "INVEST" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks Section */}
                {result.risks && result.risks.length > 0 && (
                  <div className="pt-4 border-t border-slate-800/60">
                    <h4 className="text-sm font-semibold tracking-wider uppercase text-rose-400 mb-3 font-mono flex items-center gap-1.5">
                      <AlertOctagon className="h-4 w-4" /> Risk Assessment / Headwinds:
                    </h4>
                    <ul className="space-y-2">
                      {result.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0"></span>
                          <span className="text-slate-400 text-xs leading-relaxed">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Grid & Sentiment Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Financial Metrics Card */}
              <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-cyan-400" /> Core Valuation & Ratios
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Trailing P/E</p>
                    <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                      {result.researchData.peRatio ? result.researchData.peRatio.toFixed(2) : "N/A"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Forward P/E</p>
                    <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                      {result.researchData.forwardPe ? result.researchData.forwardPe.toFixed(2) : "N/A"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">PEG Ratio</p>
                    <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                      {result.researchData.pegRatio || "N/A"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Debt-to-Equity</p>
                    <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                      {result.researchData.debtToEquity ? `${result.researchData.debtToEquity}%` : "N/A"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">Profit Margin</p>
                    <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                      {result.researchData.profitMargin || "N/A"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500">ROE</p>
                    <p className="text-lg font-mono font-bold text-slate-200 mt-0.5">
                      {result.researchData.returnOnEquity || "N/A"}
                    </p>
                  </div>

                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Company Description</p>
                  <p className="text-xs text-slate-400 leading-relaxed text-justify line-clamp-3">
                    {result.researchData.description}
                  </p>
                </div>
              </div>

              {/* Sentiment Card */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2 mb-4">
                    <Newspaper className="h-4 w-4 text-cyan-400" /> Sentiment Analysis
                  </h3>

                  {/* Sentiment Radial Meter */}
                  <div className="text-center py-4 flex flex-col items-center">
                    <div className="relative flex items-center justify-center">
                      {/* Metric text */}
                      <span className="text-4xl font-extrabold font-mono text-cyan-400">
                        {result.sentiment.score}%
                      </span>
                    </div>
                    <span className="text-xs uppercase tracking-wider text-slate-500 mt-2 font-mono">
                      Sentiment Index
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs text-justify leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                    {result.sentiment.summary}
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 font-mono mt-4 text-right">
                  Score scale: Bearish (0) - Neutral (50) - Bullish (100)
                </div>
              </div>

            </div>

            {/* Agent Heuristic Step Tracker */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" /> LangGraph Execution Trace
              </h3>
              <div className="font-mono text-[11px] text-slate-400 space-y-2 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-cyan-500">[{idx + 1}]</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON Debug View */}
            <details className="group border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
              <summary className="cursor-pointer select-none px-5 py-3 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-between font-mono bg-slate-900/40">
                <span className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-slate-400" /> VIEW RAW ANALYSIS OUTPUT
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 group-open:hidden">
                  EXPAND
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 hidden group-open:inline">
                  COLLAPSE
                </span>
              </summary>
              <div className="p-4 border-t border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </details>

          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="mt-16 text-center border-t border-slate-800/80 pt-6">
        <p className="text-slate-600 text-[11px] font-mono">
          Fortress AI Investment Research Agent • LangGraph.js • Next.js App Router • Vercel Ready
        </p>
      </footer>
    </main>
  );
}
