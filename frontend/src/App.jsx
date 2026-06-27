import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Building2, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign, MessageSquareText, Activity } from 'lucide-react';

function App() {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const eventSourceRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const runSearchForCompany = (comp) => {
    if (!comp.trim()) return;
    setCompany(comp);
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`https://investment-research-agent-kmxl.onrender.com/api/research?company=${encodeURIComponent(comp.trim())}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('log', (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data.message]);
    });

    eventSource.addEventListener('result', (event) => {
      const data = JSON.parse(event.data);
      setResult(data);
      setLoading(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      let errorMsg = 'An error occurred during research or stream disconnected.';
      if (event.data) {
         try {
           const data = JSON.parse(event.data);
           if (data.message) errorMsg = data.message;
         } catch(e) {}
      }
      setError(errorMsg);
      setLoading(false);
      eventSource.close();
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearchForCompany(company);
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-left">
          <h1>Fortress AI Investment Research Agent</h1>
          <p className="subtitle">Input any public company. Our agent resolves the ticker, fetches real-time financial statements, analyzes market news sentiment, and makes an automated investment decision.</p>
        </div>
        <a href="#" className="github-btn">GitHub Repo</a>
      </header>

      <div className="search-section">
        <div className="search-header">
           <Search size={16} className="search-icon-small"/> INITIATE COMPANY RESEARCH
        </div>
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Apple"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="search-button" disabled={loading || !company.trim()}>
            {loading ? 'Running...' : <><Activity size={18} style={{ marginRight: '8px' }} /> Run Research</>}
          </button>
        </form>
        <div className="quick-select">
          <span className="qs-label">Quick Select:</span>
          {['Apple', 'Tesla', 'NVIDIA', 'Microsoft', 'Amazon', 'Reliance Industries'].map(c => (
            <button key={c} type="button" className="qs-btn" onClick={() => runSearchForCompany(c)} disabled={loading}>{c}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="dashboard">
          {/* Top Card */}
          <div className="top-card">
            <div className="company-info-group">
              <div className="company-logo">
                <Building2 size={28} className="logo-icon" />
              </div>
              <div className="company-details">
                <div className="company-title-row">
                  <h2 className="company-name">{result.companyName}</h2>
                  <span className="ticker-badge">{result.ticker}</span>
                </div>
                <div className="company-sector">
                  {result.sector} • {result.industry}
                </div>
              </div>
            </div>

            <div className="financial-metrics">
              <div className="metric">
                <div className="metric-label">SHARE PRICE</div>
                <div className="metric-value">${result.sharePrice?.toFixed(2)}</div>
              </div>
              <div className="metric">
                <div className="metric-label">PRICE CHANGE</div>
                <div className={`metric-value ${result.priceChange >= 0 ? 'positive' : 'negative'}`}>
                  {result.priceChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  {result.priceChange ? Math.abs(result.priceChange).toFixed(2) : 0}%
                </div>
              </div>
              <div className="metric">
                <div className="metric-label">MARKET CAP</div>
                <div className="metric-value">{result.marketCap}</div>
              </div>
            </div>
          </div>

          {/* Bottom Card (Decision) */}
          <div className="bottom-card">
            <div className="research-header">
              <span className="research-label">RESEARCH VERDICT</span>
              <span className="consensus-label">| Consensus: {result.verdict === 'INVEST' ? 'BUY' : 'SELL'}</span>
            </div>
            
            <div className="decision-row">
              <div className="decision-text">
                <h2>Agent Decision:</h2>
                <div className={`verdict-badge ${result.verdict === 'INVEST' ? 'invest' : 'pass'}`}>
                  {result.verdict}
                </div>
              </div>
              <div className={`decision-icon ${result.verdict === 'INVEST' ? 'icon-invest' : 'icon-pass'}`}>
                {result.verdict === 'INVEST' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
              </div>
            </div>

            {result.summary && (
              <div className="executive-summary-section">
                <p>{result.summary}</p>
              </div>
            )}

            <div className="analysis-section">
              <h3 className="section-title">ANALYSIS REASONING:</h3>
              <ul className="reasoning-list">
                {result.reasoningPoints?.map((point, index) => (
                  <li key={index}>
                    <CheckCircle2 size={20} className="check-icon" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="risk-section">
              <h3 className="section-title risk-title">
                <AlertCircle size={18} /> RISK ASSESSMENT / HEADWINDS:
              </h3>
              <ul className="risk-list">
                {result.riskPoints?.map((risk, index) => (
                  <li key={index}>
                    <div className="red-dot"></div>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Advanced Metrics Grid */}
          <div className="advanced-metrics-grid">
            <div className="valuation-card">
              <h3 className="section-title"><DollarSign size={18} className="cyan-icon" /> Core Valuation & Ratios</h3>
              <div className="ratios-grid">
                <div className="ratio-box">
                  <span className="ratio-label">Trailing P/E</span>
                  <span className="ratio-value">{result.valuation?.trailingPE || 'N/A'}</span>
                </div>
                <div className="ratio-box">
                  <span className="ratio-label">Forward P/E</span>
                  <span className="ratio-value">{result.valuation?.forwardPE || 'N/A'}</span>
                </div>
                <div className="ratio-box">
                  <span className="ratio-label">PEG Ratio</span>
                  <span className="ratio-value">{result.valuation?.pegRatio || 'N/A'}</span>
                </div>
                <div className="ratio-box">
                  <span className="ratio-label">Debt to Equity</span>
                  <span className="ratio-value">{result.valuation?.debtToEquity || 'N/A'}</span>
                </div>
                <div className="ratio-box">
                  <span className="ratio-label">Profit Margin</span>
                  <span className="ratio-value">{result.valuation?.profitMargin || 'N/A'}</span>
                </div>
                <div className="ratio-box">
                  <span className="ratio-label">ROE</span>
                  <span className="ratio-value">{result.valuation?.roe || 'N/A'}</span>
                </div>
              </div>
              <div className="company-description">
                <h4 className="desc-title">Company Description</h4>
                <p>{result.companyDescription}</p>
              </div>
            </div>

            <div className="sentiment-card">
              <h3 className="section-title"><MessageSquareText size={18} className="cyan-icon" /> Sentiment Analysis</h3>
              <div className="sentiment-content">
                <div className="sentiment-score">{result.sentiment?.score}%</div>
                <div className="sentiment-label">SENTIMENT INDEX</div>
                <div className="sentiment-textBox">
                  <p>{result.sentiment?.text}</p>
                </div>
                <div className="sentiment-scale">Score scale: Bearish (0) - Neutral (50) - Bullish (100)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="trace-card">
        <h3 className="section-title"><Activity size={18} className="cyan-icon" /> LangGraph Execution Trace</h3>
        <div className="log-messages" ref={logContainerRef}>
          {logs.length === 0 && <span className="empty-log">Awaiting execution...</span>}
          {logs.map((log, i) => (
            <div key={i} className="log-entry"><span className="log-index">[{i + 1}]</span> {log}</div>
          ))}
          {loading && <div className="log-cursor">_</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
