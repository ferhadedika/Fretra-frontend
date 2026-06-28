import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LOGO_ICON = "/src/assests/logo-icon.png";

const T = {
  bg: "#0c0d11", bgCard: "#13141a", bgRaised: "#1a1c24",
  border: "#22242e", borderH: "#323546",
  t1: "#edeef2", t2: "#b0b4c4", tm: "#7a7f96", td: "#44475a",
  blue: "#4f6ef7", violet: "#8b5cf6", green: "#10b77f", amber: "#f59e0b", pink: "#ec4899", teal: "#06b6d4",
  r: "10px", r2: "14px",
  shCard: "0 2px 8px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.035)",
  shHover: "0 8px 28px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.05)",
};

const STEPS = [
  {
    num: "01", color: "#4f6ef7", title: "Market Data Ingestion",
    sub: "SCFI + Global Macro Sources",
    desc: "Weekly Shanghai Containerized Freight Index readings are loaded from the validated Supabase dataset — covering a decade of market history from 2015 to 2025. External macroeconomic features including Global PMI, Brent Crude, CNY/USD, and the Trade Volume Index are fetched and merged by ISO week to ensure precise temporal alignment.",
    bullets: [
      "10+ years of SCFI data (2015–2025) — a commercially representative history",
      "Brent Crude Oil, Global Manufacturing PMI, CNY/USD rate, Trade Volume Index",
      "ISO week spine alignment — eliminates date-shift errors across data sources",
      "Validated against published SCFI index reports for data integrity",
    ],
    code: `df = load_scfi_from_supabase()
macro = fetch_macro_features(["PMI","Brent","CNY","TradeVol"])
df = df.merge(macro, on="iso_week", how="left")`,
    tag: "Supabase · pandas",
  },
  {
    num: "02", color: "#8b5cf6", title: "Market Signal Engineering",
    sub: "62 Signals Constructed Across 5 Categories",
    desc: "62 market signals are engineered across five intelligence categories: autoregressive price lags (1–8 weeks), rolling statistical measures, z-score normalised macroeconomic indicators with cross-market interaction terms, COVID-era structural break variables, and cyclical calendar encodings for seasonal pattern detection.",
    bullets: [
      "scfi_lag_1 through scfi_lag_8 — consistently the top SHAP attribution drivers",
      "Brent×PMI, Brent×CNY, Trade Volume×PMI cross-market interaction signals",
      "52-week Z-score regime classification plus distance from cycle high and low",
      "Sine/cosine week-of-year encoding for robust seasonal pattern capture",
    ],
    code: `features = build_lag_features(df, lags=range(1,9))
features = add_rolling_stats(features, windows=[4,8])
features = add_macro_interactions(features)
features = add_covid_dummies(features)`,
    tag: "scikit-learn · numpy",
  },
  {
    num: "03", color: "#ec4899", title: "Validation Protocol",
    sub: "5-Fold Expanding Walk-Forward Cross-Validation",
    desc: "Rigorous expanding-window walk-forward cross-validation across 5 sequential folds — the industry standard for time-series model validation. The training window expands with each fold, ensuring no future data contaminates any training period. All models are evaluated on a 1-step-ahead anchor to eliminate multi-step error compounding.",
    bullets: [
      "Expanding window: training set grows incrementally with each fold",
      "1-step anchor evaluation — prevents cumulative forecast error compounding",
      "Fold 1: ~200 training weeks / Fold 5: ~400 training weeks",
      "SARIMAX statistically eliminated at this stage (R² = −0.84 vs. mean prediction)",
    ],
    code: `for train_idx, val_idx in expanding_cv(df, n_folds=5):
    X_train, X_val = X[train_idx], X[val_idx]
    model.fit(X_train, y_train)
    preds = model.predict(X_val)  # 1-step anchor`,
    tag: "5 folds · zero leakage",
  },
  {
    num: "04", color: "#f59e0b", title: "Model Training & Optimisation",
    sub: "XGBoost · Random Forest · LSTM",
    desc: "Three production-grade models are trained in parallel across each validation fold. XGBoost is tuned through 200 Bayesian optimisation trials via Optuna. Random Forest is refined with 30-iteration randomised hyperparameter search. LSTM is trained on 12-week rolling sequences with early stopping. SARIMAX is retained as a statistical benchmark for performance contextualisation.",
    bullets: [
      "XGBoost: 200 Optuna Bayesian trials — optimal at 540 estimators, depth 6",
      "Random Forest: 30-iteration RandomizedSearchCV across key hyperparameters",
      "LSTM: 12-week input sequence, 128→64 hidden units, dropout 0.2, early stopping",
      "SARIMAX: trained as a statistical benchmark — excluded from production ensemble",
    ],
    code: `# XGBoost — Bayesian hyperparameter optimisation
study = optuna.create_study(direction="minimize")
study.optimize(xgb_objective, n_trials=200)
xgb = XGBRegressor(**study.best_params)

# LSTM — sequence model with early stopping
model = build_lstm(seq_len=12, units=[128,64])
model.fit(..., callbacks=[EarlyStopping(patience=20)])`,
    tag: "Optuna · TensorFlow",
  },
  {
    num: "05", color: "#10b77f", title: "Ensemble Weight Optimisation",
    sub: "Constrained SLSQP Weight Solver",
    desc: "Model weights for XGBoost, Random Forest, and LSTM are jointly optimised using scipy's SLSQP constrained minimisation solver to minimise validation MAE. All weights are constrained to be non-negative and must sum to exactly 1.0 — producing a commercially robust blended forecast that outperforms any single model in isolation.",
    bullets: [
      "scipy.optimize.minimize with SLSQP method — convex constrained optimisation",
      "Objective function: minimise ensemble-weighted validation mean absolute error",
      "Hard constraint: w_xgb + w_rf + w_lstm = 1.0, all weights ≥ 0",
      "Typical production weights: ~52% XGBoost / ~31% Random Forest / ~17% LSTM",
    ],
    code: `def ensemble_mae(weights):
    w_xgb, w_rf, w_lstm = weights
    pred = w_xgb*p_xgb + w_rf*p_rf + w_lstm*p_lstm
    return mean_absolute_error(y_val, pred)

result = minimize(ensemble_mae, x0=[.33,.33,.34],
    method="SLSQP",
    constraints={"type":"eq","fun": lambda w: sum(w)-1},
    bounds=[(0,1)]*3)`,
    tag: "scipy SLSQP",
  },
  {
    num: "06", color: "#06b6d4", title: "Forecast Explainability",
    sub: "SHAP Attribution — Per-Prediction Driver Narratives",
    desc: "TreeExplainer computes exact SHAP attribution values for the XGBoost model on every forecast output. The dashboard surfaces the top 5 bullish and bearish market drivers as a plain-language commercial narrative alongside waterfall decomposition and global importance charts — giving decision-makers full transparency into what is driving each rate forecast.",
    bullets: [
      "shap.TreeExplainer on XGBoost — computationally exact attribution values",
      "Waterfall chart: per-prediction signal contribution breakdown",
      "Bar chart: global mean |SHAP| importance across all historical forecasts",
      "Automated bullish/bearish driver narrative generated for every forecast period",
    ],
    code: `explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_forecast)

top_positive = get_top_drivers(shap_values, n=5, sign="+")
top_negative = get_top_drivers(shap_values, n=5, sign="-")
narrative = build_narrative(top_positive, top_negative)`,
    tag: "SHAP · TreeExplainer",
  },
  {
    num: "07", color: "#4f6ef7", title: "Forecast Delivery API",
    sub: "FastAPI · 12-Week Live Output",
    desc: "The trained production ensemble is serialised and served via a FastAPI backend. On request, it generates a 12-week multi-step forecast using recursive prediction, returned as structured JSON alongside SHAP attribution values, model-level performance breakdowns, and live baseline benchmark comparisons.",
    bullets: [
      "GET /api/forecast → 12-week ensemble forecast with confidence context",
      "GET /api/shap → SHAP attribution values for the latest forecast period",
      "GET /api/metrics → Cross-validation performance metrics for all models",
      "Supabase for live historical data · Firebase Authentication for access control",
    ],
    code: `@app.get("/api/forecast")
async def get_forecast():
    last_week = supabase.fetch_latest()
    forecasts = []
    for step in range(1, 13):
        pred = ensemble.predict(last_week)
        forecasts.append({"week": step, "value": pred})
        last_week = update_features(last_week, pred)
    return {"forecast": forecasts, "weights": ensemble.weights}`,
    tag: "FastAPI · Supabase",
  },
];

const Card = ({ children, style, accent }) => {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background:T.bgCard, border:`1px solid ${h ? T.borderH : T.border}`, borderRadius:T.r2, boxShadow: h ? T.shHover : T.shCard, position:"relative", overflow:"hidden", transition:"all .18s", ...style }}>
      <div style={{ position:"absolute", top:0, left:10, right:10, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)", pointerEvents:"none" }}/>
      {accent && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accent }}/>}
      {children}
    </div>
  );
};

export default function PipelinePage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'Barlow','Inter',sans-serif" }}>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, height:58, display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", padding:"0 40px", background:"rgba(12,13,17,.95)", borderBottom:`1px solid ${T.border}`, backdropFilter:"blur(16px)" }}>
        <div onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", justifySelf:"start" }}>
          <img
            src={LOGO_ICON}
            alt="Fretra"
            style={{ height:42, width:"auto", objectFit:"contain", filter:"drop-shadow(0 0 10px rgba(79,110,247,.45))" }}
            onError={e => e.target.style.display="none"}
          />
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:17, letterSpacing:2, textTransform:"uppercase", color:T.t1, lineHeight:1 }}>FRETRA</div>
            <div style={{ fontSize:8.5, fontWeight:600, letterSpacing:2.5, color:T.td, textTransform:"uppercase", lineHeight:1 }}>SCFI Rate Forecasting Engine</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:2, justifySelf:"center" }}>
          {[["Models","/models"],["Features","/features"],["Pipeline","/pipeline"],["About","/about"]].map(([l,p]) => (
            <button key={l} onClick={() => navigate(p)} style={{ background: l==="Pipeline" ? T.bgRaised : "none", border: l==="Pipeline" ? `1px solid ${T.borderH}` : "1px solid transparent", padding:"6px 14px", borderRadius:T.r, color: l==="Pipeline" ? T.t1 : T.tm, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
        <button onClick={() => navigate("/login")} style={{ background:T.blue, border:"none", borderRadius:T.r, color:"#fff", fontWeight:700, fontSize:13, padding:"8px 20px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(79,110,247,.3)", justifySelf:"end" }}>Launch App →</button>
      </nav>

      {/* HERO */}
      <section style={{ padding:"72px 48px 56px", maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(6,182,212,.1)", border:"1px solid rgba(6,182,212,.28)", borderRadius:999, padding:"5px 16px", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#22d3ee", marginBottom:20 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:T.teal, display:"inline-block", animation:"pulse 2s infinite" }}/>
          Analytical Intelligence Pipeline
        </div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:800, lineHeight:1.05, margin:"0 0 16px", letterSpacing:-.5 }}>
          From raw market data<br/>
          <span style={{ background:"linear-gradient(90deg,#06b6d4,#4f6ef7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>to actionable 12-week forecasts.</span>
        </h1>
        <p style={{ fontSize:15.5, color:T.tm, maxWidth:600, lineHeight:1.75, margin:0 }}>
          A seven-stage production pipeline — market data ingestion, signal engineering, validation protocol, model training, ensemble optimisation, forecast explainability, and live API delivery. Every stage is designed for commercial reliability and decision-maker transparency.
        </p>
      </section>

      {/* VISUAL FLOW */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 52px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:0, overflowX:"auto", paddingBottom:8 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display:"flex", alignItems:"center", flex:"1 0 auto" }}>
              <button onClick={() => setActive(i)} style={{
                background: active===i ? s.color+"18" : T.bgCard,
                border: `1px solid ${active===i ? s.color+"55" : T.border}`,
                borderRadius:T.r, padding:"14px 12px", cursor:"pointer",
                textAlign:"center", minWidth:120, flex:1, fontFamily:"inherit",
                boxShadow: active===i ? `0 0 16px ${s.color}22,${T.shCard}` : T.shCard,
                transition:"all .18s", position:"relative", overflow:"hidden",
              }}>
                {active===i && <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:s.color }}/>}
                <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, margin:"0 auto 8px", boxShadow:`0 0 ${active===i ? 10 : 4}px ${s.color}${active===i ? "cc" : "66"}`, transition:"box-shadow .2s" }}/>
                <div style={{ fontSize:9, fontWeight:700, color: active===i ? s.color : T.td, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>STAGE {s.num}</div>
                <div style={{ fontSize:11.5, fontWeight:700, color: active===i ? T.t1 : T.tm, lineHeight:1.3 }}>{s.title}</div>
              </button>
              {i < STEPS.length-1 && (
                <div style={{ height:1, width:16, background:T.border, flexShrink:0, position:"relative" }}>
                  <div style={{ position:"absolute", right:-4, top:-4, width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderLeft:`7px solid ${T.borderH}` }}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* STEP DETAIL */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 72px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* left: description */}
          <Card accent={`linear-gradient(90deg,${step.color},${step.color}44)`} style={{ padding:"28px 32px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:`${step.color}18`, border:`1px solid ${step.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:step.color }}>{step.num}</div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:step.color, marginBottom:3 }}>{step.sub}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800, color:T.t1 }}>{step.title}</div>
              </div>
            </div>
            <p style={{ fontSize:14, color:T.t2, lineHeight:1.8, marginBottom:22 }}>{step.desc}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {step.bullets.map(b => (
                <div key={b} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <span style={{ color:step.color, fontSize:14, marginTop:1, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:13.5, color:T.t2, lineHeight:1.55 }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, display:"inline-flex", alignItems:"center", gap:6, background:`${step.color}12`, border:`1px solid ${step.color}30`, borderRadius:6, padding:"4px 12px" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:step.color, display:"inline-block" }}/>
              <span style={{ fontSize:11, fontWeight:700, color:step.color, letterSpacing:.5 }}>{step.tag}</span>
            </div>
          </Card>

          {/* right: code block */}
          <div style={{ background:"#090a0f", border:`1px solid ${T.border}`, borderRadius:T.r2, overflow:"hidden", boxShadow:T.shCard }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderBottom:`1px solid ${T.border}`, background:T.bgCard }}>
              <div style={{ display:"flex", gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#ef4444" }}/>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#f59e0b" }}/>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#10b77f" }}/>
              </div>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:T.td }}>Python · Stage {step.num}</span>
              <div style={{ width:60 }}/>
            </div>
            <pre style={{ padding:"22px 24px", margin:0, fontSize:12.5, lineHeight:1.75, color:"#c4cee0", fontFamily:"'JetBrains Mono','Fira Code',monospace", overflowX:"auto", whiteSpace:"pre-wrap" }}>
              {step.code
                .replace(/(def |class |for |if |return |import |from |async )/g, '##KW##$1##/KW##')
                .split('##KW##')
                .map((part, i) => {
                  if (part.startsWith('/KW##')) return null;
                  if (i > 0 && part.includes('##/KW##')) {
                    const [kw, rest] = part.split('##/KW##');
                    return <span key={i}><span style={{ color:"#8b5cf6" }}>{kw}</span>{rest}</span>;
                  }
                  return <span key={i}>{part}</span>;
                })
              }
            </pre>
          </div>
        </div>

        {/* nav buttons */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:16 }}>
          <button onClick={() => setActive(Math.max(0, active-1))} disabled={active===0} style={{ background: active===0 ? T.bgRaised : T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.r, padding:"9px 20px", color: active===0 ? T.td : T.t2, fontSize:13, fontWeight:600, cursor: active===0 ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: active===0 ? .5 : 1 }}>
            ← Previous stage
          </button>
          <div style={{ fontSize:12, color:T.td, display:"flex", alignItems:"center", gap:8 }}>
            {STEPS.map((_,i) => (
              <div key={i} onClick={() => setActive(i)} style={{ width: active===i ? 18 : 6, height:6, borderRadius:3, background: active===i ? step.color : T.border, cursor:"pointer", transition:"all .2s" }}/>
            ))}
          </div>
          <button onClick={() => setActive(Math.min(STEPS.length-1, active+1))} disabled={active===STEPS.length-1} style={{ background: active===STEPS.length-1 ? T.bgRaised : T.blue, border:"none", borderRadius:T.r, padding:"9px 20px", color:"#fff", fontSize:13, fontWeight:600, cursor: active===STEPS.length-1 ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: active===STEPS.length-1 ? .5 : 1, boxShadow: active===STEPS.length-1 ? "none" : "0 4px 14px rgba(79,110,247,.3)" }}>
            Next stage →
          </button>
        </div>
      </section>

      {/* ALL STAGES OVERVIEW */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 96px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:T.td }}>Complete Pipeline at a Glance</div>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.border},transparent)` }}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {STEPS.map((s,i) => (
            <Card key={s.num} style={{ padding:"16px 18px", cursor:"pointer", border:`1px solid ${active===i ? s.color+"44" : T.border}` }} accent={active===i ? `linear-gradient(90deg,${s.color},${s.color}44)` : undefined}>
              <button onClick={() => setActive(i)} style={{ background:"none", border:"none", padding:0, width:"100%", textAlign:"left", cursor:"pointer", fontFamily:"inherit" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color: active===i ? s.color : T.td }}>{s.num}</div>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, boxShadow:`0 0 6px ${s.color}88` }}/>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color: active===i ? T.t1 : T.t2, marginBottom:3 }}>{s.title}</div>
                <div style={{ fontSize:11, color:T.td }}>{s.sub}</div>
              </button>
            </Card>
          ))}
        </div>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}