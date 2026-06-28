import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LOGO_ICON from "./assests/logo-icon.png";

const T = {
  bg: "#0c0d11", bgCard: "#13141a", bgRaised: "#1a1c24",
  border: "#22242e", borderH: "#323546",
  t1: "#edeef2", t2: "#b0b4c4", tm: "#7a7f96", td: "#44475a",
  blue: "#4f6ef7", violet: "#8b5cf6", green: "#10b77f", amber: "#f59e0b", pink: "#ec4899",
  r: "10px", r2: "14px",
  shCard: "0 2px 8px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.035)",
  shHover: "0 8px 28px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.05)",
};

const MODELS = [
  {
    id: "XGBoost", tag: "BEST MODEL", color: "#4f6ef7", dimColor: "rgba(79,110,247,.12)",
    mape: "2.63%", r2: "0.996", rmse: "61.4", mae: "44.2",
    desc: "Gradient-boosted decision trees fine-tuned through 200 Bayesian optimisation trials across 5 walk-forward validation folds. Delivers the highest predictive accuracy across all performance metrics, making it the primary production-grade forecasting engine.",
    details: [
      { label: "Estimators",    val: "540" },
      { label: "Max Depth",     val: "6" },
      { label: "Learning Rate", val: "0.042" },
      { label: "Optimiser",     val: "Optuna · 200 trials" },
      { label: "Subsample",     val: "0.82" },
      { label: "Col Sample",    val: "0.74" },
    ],
    barPct: 96,
  },
  {
    id: "Ensemble", tag: "PRODUCTION", color: "#8b5cf6", dimColor: "rgba(139,92,246,.12)",
    mape: "2.63%", r2: "0.996", rmse: "61.2", mae: "43.9",
    desc: "A commercially deployed linear combination of XGBoost, Random Forest, and LSTM, with weights optimised via SLSQP constrained minimisation. Blending multiple model signals reduces forecast variance and improves robustness across market regimes.",
    details: [
      { label: "XGBoost Weight", val: "~0.52" },
      { label: "RF Weight",      val: "~0.31" },
      { label: "LSTM Weight",    val: "~0.17" },
      { label: "Optimiser",      val: "Scipy SLSQP" },
      { label: "Objective",      val: "Minimise Validation MAE" },
      { label: "Constraint",     val: "Σw = 1, w ≥ 0" },
    ],
    barPct: 97,
  },
  {
    id: "Random Forest", tag: "IN ENSEMBLE", color: "#10b77f", dimColor: "rgba(16,183,127,.12)",
    mape: "2.86%", r2: "0.996", rmse: "65.1", mae: "48.3",
    desc: "A bagged ensemble of decision trees with randomised feature subsampling, tuned through 30-iteration randomised search. Contributes meaningful diversification to the production ensemble through independent variance reduction.",
    details: [
      { label: "Estimators",   val: "400" },
      { label: "Max Features", val: "sqrt" },
      { label: "Min Samples",  val: "2" },
      { label: "Tuner",        val: "RandomizedSearchCV" },
      { label: "Iterations",   val: "30" },
      { label: "OOB Score",    val: "Enabled" },
    ],
    barPct: 88,
  },
  {
    id: "LSTM", tag: "IN ENSEMBLE", color: "#f59e0b", dimColor: "rgba(245,158,11,.12)",
    mape: "4.23%", r2: "0.992", rmse: "88.6", mae: "71.4",
    desc: "A Long Short-Term Memory deep recurrent network trained on 12-week rolling sequences. Captures non-linear temporal dependencies and cyclical market dynamics that tree-based models may miss, adding complementary signal to the ensemble.",
    details: [
      { label: "Sequence Length", val: "12 Weeks" },
      { label: "Hidden Units",    val: "128 → 64" },
      { label: "Dropout",         val: "0.2" },
      { label: "Epochs",          val: "200 (Early Stop)" },
      { label: "Batch Size",      val: "32" },
      { label: "Optimiser",       val: "Adam, lr=1e-3" },
    ],
    barPct: 74,
  },
  {
    id: "SARIMAX", tag: "BENCHMARK", color: "#44475a", dimColor: "rgba(68,71,90,.15)",
    mape: "—", r2: "−0.84", rmse: "—", mae: "—",
    desc: "Seasonal ARIMA with exogenous macroeconomic variables, retained as a statistical benchmark to contextualise machine learning performance gains. Its negative R² confirms that a simple linear time-series approach is insufficient for modern freight rate forecasting.",
    details: [
      { label: "Order",       val: "p=1, d=1, q=1" },
      { label: "Seasonal",    val: "P=1, D=1, Q=1, s=52" },
      { label: "Exogenous",   val: "PMI, Brent, CNY" },
      { label: "Status",      val: "Benchmark Only" },
      { label: "In Ensemble", val: "Excluded" },
      { label: "R²",          val: "−0.84 (Below Mean)" },
    ],
    barPct: 0,
  },
];

const CV_FOLDS = [
  { fold: 1, train: "2015–2020", val: "2021 Q1",     xgb: "0.991", rf: "0.989", lstm: "0.981" },
  { fold: 2, train: "2015–2021", val: "2021 Q2–Q3",  xgb: "0.994", rf: "0.993", lstm: "0.988" },
  { fold: 3, train: "2015–2022", val: "2022–2023",   xgb: "0.997", rf: "0.996", lstm: "0.993" },
  { fold: 4, train: "2015–2023", val: "2023–2024",   xgb: "0.998", rf: "0.997", lstm: "0.994" },
  { fold: 5, train: "2015–2024", val: "2024–2025",   xgb: "0.996", rf: "0.996", lstm: "0.992" },
];

const Card = ({ children, style, accent }) => {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: T.bgCard, border: `1px solid ${h ? T.borderH : T.border}`,
        borderRadius: T.r2, boxShadow: h ? T.shHover : T.shCard,
        position: "relative", overflow: "hidden",
        transition: "all .18s", transform: h ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      <div style={{ position:"absolute", top:0, left:10, right:10, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)", pointerEvents:"none" }}/>
      {accent && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accent }}/>}
      {children}
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:T.td, marginBottom:10 }}>{children}</div>
);

const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:38, fontWeight:800, color:T.t1, lineHeight:1.05, letterSpacing:-.3, margin:"0 0 10px", ...style }}>{children}</h2>
);

export default function ModelsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("XGBoost");
  const model = MODELS.find(m => m.id === active);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'Barlow','Inter',sans-serif" }}>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, height:58, display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", padding:"0 40px", background:"rgba(12,13,17,.95)", borderBottom:`1px solid ${T.border}`, backdropFilter:"blur(16px)", boxShadow:"0 1px 0 rgba(255,255,255,.04)" }}>
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
            <button key={l} onClick={() => navigate(p)} style={{ background: l==="Models" ? T.bgRaised : "none", border: l==="Models" ? `1px solid ${T.borderH}` : "1px solid transparent", padding:"6px 14px", borderRadius:T.r, color: l==="Models" ? T.t1 : T.tm, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:".15s" }}>{l}</button>
          ))}
        </div>
        <button onClick={() => navigate("/login")} style={{ background:T.blue, border:"none", borderRadius:T.r, color:"#fff", fontWeight:700, fontSize:13, padding:"8px 20px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(79,110,247,.3)", justifySelf:"end" }}>
          Launch App →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ padding:"72px 48px 56px", maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(79,110,247,.1)", border:"1px solid rgba(79,110,247,.28)", borderRadius:999, padding:"5px 16px", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#6f9af8", marginBottom:20 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:T.blue, display:"inline-block", animation:"pulse 2s infinite" }}/>
          Forecasting Architecture
        </div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:800, lineHeight:1.05, margin:"0 0 16px", letterSpacing:-.5 }}>
          Five validated models.<br/>
          <span style={{ background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>One production-grade ensemble.</span>
        </h1>
        <p style={{ fontSize:15.5, color:T.tm, maxWidth:580, lineHeight:1.75, margin:0 }}>
          Every model is trained and evaluated through rigorous expanding walk-forward cross-validation across five sequential folds — eliminating data leakage and ensuring all performance metrics reflect true out-of-sample commercial viability.
        </p>
      </section>

      {/* MODEL SELECTOR + DETAIL */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 72px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16 }}>

          {/* Sidebar selector */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {MODELS.map(m => (
              <button key={m.id} onClick={() => setActive(m.id)} style={{
                background: active===m.id ? T.bgCard : "none",
                border: `1px solid ${active===m.id ? m.color+"55" : T.border}`,
                borderRadius:T.r, padding:"12px 14px", cursor:"pointer",
                fontFamily:"inherit", textAlign:"left", transition:".15s",
                boxShadow: active===m.id ? `0 0 0 1px ${m.color}22, ${T.shCard}` : "none",
              }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color: active===m.id ? m.color : T.td, marginBottom:4 }}>{m.tag}</div>
                <div style={{ fontSize:14, fontWeight:700, color: active===m.id ? T.t1 : T.tm }}>{m.id}</div>
                {active===m.id && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:11, color:T.tm, display:"flex", justifyContent:"space-between" }}>
                      <span>R²</span><span style={{ color:T.t1, fontWeight:600 }}>{m.r2}</span>
                    </div>
                    <div style={{ height:3, background:T.border, borderRadius:2, marginTop:6, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${m.barPct}%`, background:`linear-gradient(90deg,${m.color},${m.color}88)`, borderRadius:2, transition:"width .4s" }}/>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <Card accent={`linear-gradient(90deg,${model.color},${model.color}44)`} style={{ padding:"28px 32px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:model.color, marginBottom:6 }}>{model.tag}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:800, color:T.t1 }}>{model.id}</div>
              </div>
              {/* metric pills */}
              <div style={{ display:"flex", gap:10 }}>
                {[["MAPE",model.mape,T.green],["R²",model.r2,model.color],["RMSE",model.rmse,T.amber],["MAE",model.mae,T.violet]].map(([lbl,val,c]) => (
                  <div key={lbl} style={{ background:T.bgRaised, border:`1px solid ${T.border}`, borderRadius:T.r, padding:"10px 16px", textAlign:"center", minWidth:72 }}>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:T.td, marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:c }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* desc */}
            <p style={{ fontSize:14, color:T.t2, lineHeight:1.75, marginBottom:24, maxWidth:600 }}>{model.desc}</p>

            {/* performance bar */}
            <div style={{ marginBottom:28 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:11, color:T.tm, fontWeight:600 }}>Relative Performance vs. Statistical Baseline</span>
                <span style={{ fontSize:11, color:model.color, fontWeight:700 }}>{model.barPct}%</span>
              </div>
              <div style={{ height:6, background:T.bgRaised, borderRadius:3, overflow:"hidden", border:`1px solid ${T.border}` }}>
                <div style={{ height:"100%", width:`${model.barPct}%`, background:`linear-gradient(90deg,${model.color},${model.color}88)`, borderRadius:3, boxShadow:`0 0 12px ${model.color}55`, transition:"width .5s" }}/>
              </div>
            </div>

            {/* hyperparams grid */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:T.td, marginBottom:12 }}>Model Configuration</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {model.details.map(({ label, val }) => (
                  <div key={label} style={{ background:T.bgRaised, border:`1px solid ${T.border}`, borderRadius:T.r, padding:"12px 14px" }}>
                    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:T.td, marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:T.t2, fontFamily:"'Barlow Condensed',sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 72px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <SectionLabel>Performance Benchmarking</SectionLabel>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.border},transparent)` }}/>
        </div>
        <Card style={{ overflow:"visible" }} accent={`linear-gradient(90deg,${T.blue}44,transparent)`}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {["Model","Classification","MAPE ↓","R² ↑","RMSE ↓","MAE ↓","Deployment"].map((h,i) => (
                  <th key={h} style={{ padding:"12px 18px", textAlign:i===0?"left":"center", fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:T.td }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map(m => (
                <tr key={m.id} onClick={() => setActive(m.id)} style={{ borderBottom:`1px solid ${T.bgRaised}`, cursor:"pointer", background: active===m.id ? `${m.color}08` : "transparent", transition:".12s" }}>
                  <td style={{ padding:"12px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:m.color, boxShadow:`0 0 6px ${m.color}88`, flexShrink:0 }}/>
                      <span style={{ fontWeight:700, color:T.t1 }}>{m.id}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 18px", textAlign:"center", color:T.tm, fontSize:12 }}>{m.tag}</td>
                  <td style={{ padding:"12px 18px", textAlign:"center", fontWeight:700, color: m.id==="SARIMAX" ? T.td : T.green, fontFamily:"'Barlow Condensed',sans-serif", fontSize:16 }}>{m.mape}</td>
                  <td style={{ padding:"12px 18px", textAlign:"center", fontWeight:700, color: m.id==="SARIMAX" ? "#ef4444" : m.color, fontFamily:"'Barlow Condensed',sans-serif", fontSize:16 }}>{m.r2}</td>
                  <td style={{ padding:"12px 18px", textAlign:"center", color:T.t2, fontFamily:"'Barlow Condensed',sans-serif", fontSize:15 }}>{m.rmse}</td>
                  <td style={{ padding:"12px 18px", textAlign:"center", color:T.t2, fontFamily:"'Barlow Condensed',sans-serif", fontSize:15 }}>{m.mae}</td>
                  <td style={{ padding:"12px 18px", textAlign:"center" }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:5, background: m.id==="SARIMAX" ? T.bgRaised : `${m.color}18`, color: m.id==="SARIMAX" ? T.td : m.color, border:`1px solid ${m.id==="SARIMAX" ? T.border : m.color+"44"}` }}>
                      {m.id==="SARIMAX" ? "Benchmark" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* CV FOLDS TABLE */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 96px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <SectionLabel>Validation Integrity — R² by Training Fold</SectionLabel>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.border},transparent)` }}/>
        </div>
        <p style={{ fontSize:13, color:T.tm, marginBottom:20, lineHeight:1.6 }}>
          Expanding walk-forward cross-validation ensures each fold trains exclusively on historical data and is evaluated on a future period it has never seen — a rigorous standard that mirrors real commercial deployment conditions.
        </p>
        <Card>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {["Fold","Training Window","Validation Period","XGBoost R²","Random Forest R²","LSTM R²"].map((h,i) => (
                  <th key={h} style={{ padding:"12px 18px", textAlign:i<3?"left":"center", fontSize:9.5, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:T.td }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CV_FOLDS.map(row => (
                <tr key={row.fold} style={{ borderBottom:`1px solid ${T.bgRaised}` }}>
                  <td style={{ padding:"11px 18px", fontWeight:700, color:T.blue, fontFamily:"'Barlow Condensed',sans-serif" }}>#{row.fold}</td>
                  <td style={{ padding:"11px 18px", color:T.tm, fontSize:12 }}>{row.train}</td>
                  <td style={{ padding:"11px 18px", color:T.tm, fontSize:12 }}>{row.val}</td>
                  <td style={{ padding:"11px 18px", textAlign:"center", fontWeight:700, color:T.blue, fontFamily:"'Barlow Condensed',sans-serif", fontSize:15 }}>{row.xgb}</td>
                  <td style={{ padding:"11px 18px", textAlign:"center", fontWeight:700, color:T.green, fontFamily:"'Barlow Condensed',sans-serif", fontSize:15 }}>{row.rf}</td>
                  <td style={{ padding:"11px 18px", textAlign:"center", fontWeight:700, color:T.amber, fontFamily:"'Barlow Condensed',sans-serif", fontSize:15 }}>{row.lstm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}