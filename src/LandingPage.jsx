import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LOGO_FULL from "./assests/logo-full.png";
import LOGO_ICON from "./assests/logo-icon.png";



const STATS = [
  { value: "10",    suffix: "+", label: "Years of SCFI Historical Data" },
  { value: "2.63",  suffix: "%", label: "Best Forecast Accuracy (MAPE)" },
  { value: "12",    suffix: "W", label: "Forward Forecast Horizon" },
  { value: "0.996", suffix: "",  label: "XGBoost Model Precision (R²)" },
];

const MODELS = [
  { id: "XGBoost",       mape: "2.63%", r2: "0.996", color: "#4f6ef7", violet: "rgba(79,110,247,.15)",  desc: "Optuna-tuned · 540 estimators", best: true },
  { id: "Ensemble",      mape: "2.63%", r2: "0.996", color: "#8b5cf6", violet: "rgba(139,92,246,.15)", desc: "Scipy-optimised weights" },
  { id: "LSTM",          mape: "4.23%", r2: "0.992", color: "#10b77f", violet: "rgba(16,183,127,.15)", desc: "Deep recurrent network" },
  { id: "Random Forest", mape: "2.86%", r2: "0.996", color: "#f59e0b", violet: "rgba(245,158,11,.15)",  desc: "30-iter randomised search" },
];

const FEATURES = [
  { icon: null, svgPath: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", title: "Predictive Forecast Engine", desc: "Four production-grade models — XGBoost, Random Forest, LSTM, and SARIMAX — validated through rigorous walk-forward cross-validation with zero data leakage." },
  { icon: null, svgPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", title: "Real-Time Baseline Benchmarking", desc: "Naïve, moving average, exponentially weighted, and seasonal baseline models computed live from Supabase for instant performance comparison." },
  { icon: null, svgPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Transparent Forecast Drivers", desc: "SHAP interpretability at every prediction level — understand exactly which market signals are driving each freight rate forecast before committing to a decision." },
  { icon: null, svgPath: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z M9 4v3 M15 4v3", title: "A Decade of Market Intelligence", desc: "Historical Shanghai Containerized Freight Index data from 2015, enriched with Brent crude oil, Global PMI, CNY/USD exchange rates, and international trade volume." },
  { icon: null, svgPath: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", title: "Automated Hyperparameter Optimisation", desc: "100-trial Bayesian search via Optuna, tuned across all cross-validation folds, delivering peak out-of-sample performance without manual intervention." },
  { icon: null, svgPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", title: "Purpose-Built for Container Freight", desc: "Engineered specifically for the Shanghai Containerized Freight Index — the industry's most widely referenced benchmark for global container shipping rates." },
];

const PIPELINE = [
  { label: "SCFI Market Data",     sub: "Weekly index ingestion", color: "#4f6ef7" },
  { label: "Feature Engineering",  sub: "62 market signals",      color: "#8b5cf6" },
  { label: "Validation Protocol",  sub: "Walk-forward CV",        color: "#ec4899" },
  { label: "Model Training",       sub: "XGB / RF / LSTM",        color: "#f59e0b" },
  { label: "Ensemble Optimisation",sub: "Scipy weight blending",  color: "#10b77f" },
  { label: "12-Week Forecast",     sub: "Live actionable output", color: "#4f6ef7" },
];

const WHY = [
  "Differenced target variable with cumulative-sum reconstruction eliminates look-ahead bias",
  "Market regime detection via 52-week Z-score and distance from historical highs and lows",
  "Cross-market interaction features: Brent × PMI, Brent × CNY, Trade Volume × PMI signals",
  "SHAP attribution values at every forecast horizon for full commercial explainability",
];

const BASELINES = [
  { label: "Naïve",      val: "2,985", color: "#7a7f96" },
  { label: "MA4",        val: "2,942", color: "#f59e0b" },
  { label: "EWM",        val: "2,961", color: "#10b77f" },
  { label: "Seas. Naïve",val: "1,832", color: "#8b5cf6" },
];

/* ── shared tokens (mirror global.css) ── */
const T = {
  bg:      "#0c0d11",
  bgCard:  "#13141a",
  bgRaised:"#1a1c24",
  border:  "#22242e",
  borderH: "#323546",
  t1:      "#edeef2",
  t2:      "#b0b4c4",
  tm:      "#7a7f96",
  td:      "#44475a",
  blue:    "#4f6ef7",
  violet:  "#8b5cf6",
  green:   "#10b77f",
  r:       "10px",
  r2:      "14px",
  shCard:  "0 2px 8px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.035)",
  shHover: "0 8px 28px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.05)",
};

/* ── tiny reusable card ── */
const Card = ({ style, children, hover = true }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hov ? T.borderH : T.border}`,
        borderRadius: T.r2,
        boxShadow: hov ? T.shHover : T.shCard,
        position: "relative",
        overflow: "hidden",
        transition: "border-color .18s, box-shadow .18s, transform .18s",
        transform: hov ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      <div style={{
        position:"absolute", top:0, left:10, right:10, height:1,
        background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)",
        pointerEvents:"none",
      }}/>
      {children}
    </div>
  );
};

/* ── Feature icon using inline SVG ── */
const FeatureIcon = ({ path }) => (
  <div style={{
    width:42, height:42, borderRadius:10,
    background:"rgba(79,110,247,.1)", border:"1px solid rgba(79,110,247,.2)",
    display:"flex", alignItems:"center", justifyContent:"center",
    marginBottom:16, flexShrink:0,
  }}>
    <svg width="20" height="20" fill="none" stroke="#4f6ef7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path}/>
    </svg>
  </div>
);

export default function LandingPage() {
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    const pts = 80, baseY = H * 0.55;
    const draw = (offA, offB, offC, sa, sb, sc, stroke, lw) => {
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const x = (i / pts) * W;
        const y = baseY
          + Math.sin(i * offA + tick * sa) * 28
          + Math.sin(i * offB + tick * sb) * 18
          + Math.sin(i * offC + tick * sc) * 9;
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
    };
    draw(.18,.07,.35, .04,.02,.06, "rgba(79,110,247,.3)",  2);
    draw(.14,.09,.25, .03,.025,.05,"rgba(139,92,246,.18)", 1.5);
  }, [tick]);

  const go = () => navigate("/login");

  const Sec = ({ children, style }) => (
    <section style={{ padding:"100px 48px", ...style }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>{children}</div>
    </section>
  );

  const Eyebrow = ({ children }) => (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:8,
      background:"rgba(79,110,247,.1)", border:"1px solid rgba(79,110,247,.28)",
      borderRadius:999, padding:"5px 16px",
      fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase",
      color:"#6f9af8", marginBottom:20,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:T.blue, display:"inline-block", animation:"pulse 2s infinite" }}/>
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:T.td, marginBottom:12 }}>
      {children}
    </div>
  );

  const H2 = ({ children, style }) => (
    <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:38, fontWeight:800, margin:"0 0 10px", color:T.t1, lineHeight:1.08, letterSpacing:-.3, ...style }}>
      {children}
    </h2>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'Barlow','Inter',sans-serif", overflowX:"hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        background:"rgba(12,13,17,.92)", backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${T.border}`,
        padding:"0 40px", height:58,
        display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center",
        boxShadow:"0 1px 0 rgba(255,255,255,.04)",
      }}>
        {/* brand */}
        <div style={{ display:"flex", alignItems:"center", gap:12, justifySelf:"start" }}>
          <img
            src={LOGO_ICON}
            alt="Fretra"
            style={{ height:44, width:"auto", objectFit:"contain", filter:"drop-shadow(0 0 10px rgba(79,110,247,.45))" }}
            onError={e => e.target.style.display="none"}
          />
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:17, fontWeight:700, letterSpacing:2,
              color:T.t1, lineHeight:1, textTransform:"uppercase",
            }}>FRETRA</div>
            <div style={{
              fontSize:8.5, fontWeight:600, letterSpacing:2.5,
              color:T.td, textTransform:"uppercase", lineHeight:1,
            }}>SCFI Rate Forecasting Engine</div>
          </div>
        </div>
        {/* links */}
        <div style={{ display:"flex", gap:2, justifySelf:"center" }}>
          {[
            { label: "Models",   path: "/models" },
            { label: "Features", path: "/features" },
            { label: "Pipeline", path: "/pipeline" },
            { label: "About",    path: "/about" },
          ].map(l => (
            <button key={l.label} onClick={() => navigate(l.path)} style={{
              background:"none", border:"none", padding:"6px 14px", borderRadius:T.r,
              color:T.tm, fontSize:13, fontWeight:600, cursor:"pointer",
              fontFamily:"inherit", transition:".15s",
            }}
              onMouseEnter={e => e.target.style.color = T.t2}
              onMouseLeave={e => e.target.style.color = T.tm}
            >{l.label}</button>
          ))}
        </div>
        {/* cta */}
        <button onClick={go} style={{
          background:T.blue, border:"none", borderRadius:T.r,
          color:"#fff", fontWeight:700, fontSize:13,
          padding:"8px 20px", cursor:"pointer", fontFamily:"inherit",
          boxShadow:"0 4px 14px rgba(79,110,247,.3)",
          transition:"background .15s, transform .15s",
          justifySelf:"end",
        }}
          onMouseEnter={e => { e.target.style.background="#3d5ef0"; e.target.style.transform="translateY(-1px)"; }}
          onMouseLeave={e => { e.target.style.background=T.blue;    e.target.style.transform="none"; }}
        >Launch App →</button>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position:"relative", minHeight:"100vh",
        display:"flex", alignItems:"center", justifyContent:"center",
        overflow:"hidden",
        background:"linear-gradient(160deg,#0f1120 0%,#0c0d11 60%)",
      }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:.7 }}/>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)",
          backgroundSize:"60px 60px", pointerEvents:"none",
        }}/>
        <div style={{ position:"absolute", top:-200, left:"50%", transform:"translateX(-50%)", width:700, height:600, background:"radial-gradient(ellipse,rgba(79,110,247,.1) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-100, right:-100, width:500, height:500, background:"radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 65%)", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:780, padding:"0 24px", marginTop:58 }}>
          <Eyebrow>Live Machine Learning Forecasting System</Eyebrow>

          {/* Hero logo */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
            <img
              src={LOGO_FULL}
              alt="Fretra"
              style={{ height:140, width:"auto", objectFit:"contain", filter:"drop-shadow(0 0 40px rgba(79,110,247,.55))" }}
              onError={e => e.target.style.display="none"}
            />
          </div>

          <h1 style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:"clamp(40px,6.5vw,72px)", fontWeight:800,
            lineHeight:1.05, margin:"0 0 22px", letterSpacing:-1, color:T.t1,
          }}>
            Predict Container<br/>
            <span style={{ background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Freight Rates
            </span><br/>
            with Machine Learning
          </h1>

          <p style={{ fontSize:16, color:T.tm, lineHeight:1.75, maxWidth:560, margin:"0 auto 40px" }}>
            12-week Shanghai Containerized Freight Index forecasts powered by XGBoost, LSTM, and ensemble models —
            backed by a decade of global shipping intelligence with full SHAP-driven decision transparency.
          </p>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={go} style={{
              background:T.blue, border:"none", borderRadius:T.r2,
              color:"#fff", fontWeight:700, fontSize:15,
              padding:"13px 32px", cursor:"pointer", fontFamily:"inherit",
              boxShadow:"0 0 40px rgba(79,110,247,.35), 0 4px 16px rgba(79,110,247,.25)",
              transition:"transform .15s, box-shadow .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 0 60px rgba(79,110,247,.45),0 8px 24px rgba(79,110,247,.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(79,110,247,.35),0 4px 16px rgba(79,110,247,.25)"; }}
            >Launch Fretra →</button>
            <button style={{
              background:"transparent",
              border:`1px solid ${T.borderH}`,
              borderRadius:T.r2, color:T.t2, fontWeight:600, fontSize:15,
              padding:"13px 32px", cursor:"pointer", fontFamily:"inherit",
              transition:"border-color .15s, color .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=T.t2; e.currentTarget.style.color=T.t1; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.borderH; e.currentTarget.style.color=T.t2; }}
            >View on GitHub</button>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", color:T.td, fontSize:12, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", fontWeight:600 }}>Scroll</span>
          <span style={{ animation:"bounce 2s infinite", display:"block", fontSize:18 }}>↓</span>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ background:T.bgCard, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, boxShadow:T.shCard }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", padding:"0" }}>
          {STATS.map(({ value, suffix, label }, i) => (
            <div key={label} style={{
              textAlign:"center", padding:"44px 24px",
              borderRight: i < 3 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:44, fontWeight:800, color:T.t1, lineHeight:1, letterSpacing:-.5 }}>
                {value}<span style={{ fontSize:26, color:T.blue }}>{suffix}</span>
              </div>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", color:T.td, marginTop:8 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SHIP BANNER ── */}
      <div style={{ position:"relative", height:320, overflow:"hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1400&q=80"
          alt="Container ship"
          style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.28 }}
        />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,#0c0d11 0%,transparent 28%,transparent 72%,#0c0d11 100%)" }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
          <div style={{
            fontSize:11, fontWeight:700, letterSpacing:4, textTransform:"uppercase",
            background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>
            Powering Commercial Decisions Across
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:800, textAlign:"center", color:T.t1, letterSpacing:-.3 }}>
            Global Container Shipping Markets
          </div>
        </div>
      </div>

      {/* ── MODEL CARDS ── */}
      <Sec style={{ background:"linear-gradient(160deg,#0f1120 0%,#0c0d11 60%)" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <SectionLabel>Model Performance</SectionLabel>
          <H2>Four Models, One Ensemble</H2>
          <p style={{ color:T.tm, fontSize:14, margin:0 }}>5-fold expanding walk-forward cross-validation · Zero look-ahead bias</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {MODELS.map(m => (
            <Card key={m.id} style={{ padding:"24px 20px" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:m.color }}/>
              {m.best && (
                <div style={{
                  position:"absolute", top:12, right:12,
                  fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase",
                  background:m.violet, color:m.color, border:`1px solid ${m.color}55`,
                  padding:"2px 7px", borderRadius:5,
                }}>Best</div>
              )}
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.8, textTransform:"uppercase", color:m.color, marginBottom:16 }}>{m.id}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:11.5, color:T.tm }}>MAPE</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:700, color:T.t1 }}>{m.mape}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <span style={{ fontSize:11.5, color:T.tm }}>R²</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:700, color:T.t1 }}>{m.r2}</span>
              </div>
              <div style={{ height:1, background:T.border, margin:"0 0 14px" }}/>
              <div style={{ fontSize:11.5, color:T.td }}>{m.desc}</div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:40 }}>
          <button onClick={() => navigate("/models")} style={{
            background:T.blue, border:"none", borderRadius:T.r2,
            color:"#fff", fontWeight:700, fontSize:14,
            padding:"12px 28px", cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 0 40px rgba(79,110,247,.3)",
            transition:"transform .15s, box-shadow .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 0 60px rgba(79,110,247,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(79,110,247,.3)"; }}
          >Explore All Models →</button>
        </div>
      </Sec>

      {/* ── ANALYTICAL PIPELINE ── */}
      <Sec style={{ background:T.bg, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <SectionLabel>Architecture</SectionLabel>
          <H2>Analytical Intelligence Pipeline</H2>
          <p style={{ color:T.tm, fontSize:14, margin:"8px 0 0" }}>From raw market data to actionable freight rate intelligence</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", overflowX:"auto", paddingBottom:4, gap:0 }}>
          {PIPELINE.map((step, i) => (
            <div key={step.label} style={{ display:"flex", alignItems:"center", flex:"1 0 auto" }}>
              <Card style={{ padding:"18px 16px", textAlign:"center", minWidth:145, flex:1 }} hover={false}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:step.color, margin:"0 auto 10px", boxShadow:`0 0 8px ${step.color}88` }}/>
                <div style={{ fontSize:12, fontWeight:700, color:T.t2, marginBottom:4 }}>{step.label}</div>
                <div style={{ fontSize:10, fontWeight:600, color:T.td }}>{step.sub}</div>
              </Card>
              {i < PIPELINE.length - 1 && (
                <div style={{ height:1, width:20, background:T.border, flexShrink:0, position:"relative" }}>
                  <div style={{ position:"absolute", right:-4, top:-4, width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderLeft:`8px solid ${T.borderH}` }}/>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:40 }}>
          <button onClick={() => navigate("/pipeline")} style={{
            background:T.blue, border:"none", borderRadius:T.r2,
            color:"#fff", fontWeight:700, fontSize:14,
            padding:"12px 28px", cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 0 40px rgba(79,110,247,.3)",
            transition:"transform .15s, box-shadow .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 0 60px rgba(79,110,247,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(79,110,247,.3)"; }}
          >View Full Pipeline →</button>
        </div>
      </Sec>

      {/* ── PORT BANNER ── */}
      <div style={{ position:"relative", height:260, overflow:"hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1400&q=80"
          alt="Container port"
          style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.25 }}
        />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,#0c0d11 0%,transparent 25%,transparent 75%,#0c0d11 100%)" }}/>
      </div>

      {/* ── FEATURES ── */}
      <Sec style={{ background:"linear-gradient(160deg,#0f1120 0%,#0c0d11 60%)" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <SectionLabel>Capabilities</SectionLabel>
          <H2>Everything Your Business Needs</H2>
          <p style={{ color:T.tm, fontSize:14, margin:"8px 0 0" }}>Enterprise-grade forecasting tools built for shipping professionals and analysts</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {FEATURES.map(f => (
            <Card key={f.title} style={{ padding:"24px 22px" }}>
              <FeatureIcon path={f.svgPath} />
              <div style={{ fontSize:14.5, fontWeight:700, color:T.t1, marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:13, color:T.tm, lineHeight:1.65 }}>{f.desc}</div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:40 }}>
          <button onClick={() => navigate("/features")} style={{
            background:T.blue, border:"none", borderRadius:T.r2,
            color:"#fff", fontWeight:700, fontSize:14,
            padding:"12px 28px", cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 0 40px rgba(79,110,247,.3)",
            transition:"transform .15s, box-shadow .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 0 60px rgba(79,110,247,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(79,110,247,.3)"; }}
          >Explore All Features →</button>
        </div>
      </Sec>

      {/* ── WHY FRETRA + MINI CHART ── */}
      <Sec style={{ background:T.bg, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center" }}>
          {/* text */}
          <div>
            <SectionLabel>Why Fretra</SectionLabel>
            <H2 style={{ marginBottom:14 }}>Built for Commercial<br/>Freight Intelligence</H2>
            <p style={{ color:T.tm, fontSize:14, lineHeight:1.8, marginBottom:28 }}>
              Fretra combines advanced gradient boosting with domain-specific market feature engineering:
              52-week regime signals, Brent crude interactions, PMI crossover alerts, and CNY/USD momentum
              — giving freight teams the analytical edge they need.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {WHY.map(item => (
                <div key={item} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <span style={{ color:"#10b77f", fontSize:14, marginTop:2, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:13.5, color:T.t2, lineHeight:1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* mini chart card */}
          <Card style={{ padding:24 }} hover={false}>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:T.td, marginBottom:4 }}>Live W+1 Forecast</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:800, color:T.blue, marginBottom:20, letterSpacing:-.5 }}>
              2,986 <span style={{ fontSize:15, color:T.tm, fontWeight:400 }}>SCFI pts</span>
            </div>
            <svg viewBox="0 0 340 110" style={{ width:"100%", height:"auto" }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#4f6ef7" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <polygon points="0,90 40,78 80,66 120,54 160,44 200,38 240,32 280,28 320,22 340,18 340,110 0,110" fill="url(#chartGrad)"/>
              <polyline points="0,90 40,78 80,66 120,54 160,44 200,38 240,32 280,28 320,22 340,18" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="340" cy="18" r="4" fill="#4f6ef7" style={{ filter:"drop-shadow(0 0 6px #4f6ef7)" }}/>
              <line x1="0" y1="104" x2="340" y2="104" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
            </svg>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:18 }}>
              {BASELINES.map(b => (
                <div key={b.label} style={{ background:T.bgRaised, borderRadius:T.r, padding:"10px 12px", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:9.5, fontWeight:700, color:b.color, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>{b.label}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:T.t1 }}>{b.val}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <section style={{ padding:"120px 48px", textAlign:"center", position:"relative", overflow:"hidden", background:"linear-gradient(160deg,#0f1120 0%,#0c0d11 60%)" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(79,110,247,.09) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <SectionLabel>Get Started</SectionLabel>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(30px,5vw,54px)", fontWeight:800, margin:"0 0 18px", color:T.t1, letterSpacing:-.5 }}>
            Ready to Lead With Freight Intelligence?
          </h2>
          <p style={{ color:T.tm, fontSize:15.5, maxWidth:500, margin:"0 auto 40px", lineHeight:1.7 }}>
            Launch the full dashboard and start making data-driven decisions today — live SCFI tracking, 12-week forecasts, and SHAP-powered market insights, all in one place.
          </p>
          <button onClick={go} style={{
            background:T.blue, border:"none", borderRadius:T.r2,
            color:"#fff", fontWeight:700, fontSize:16,
            padding:"16px 48px", cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 0 60px rgba(79,110,247,.4), 0 4px 20px rgba(79,110,247,.25)",
            transition:"transform .15s, box-shadow .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 0 80px rgba(79,110,247,.5),0 8px 28px rgba(79,110,247,.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 60px rgba(79,110,247,.4),0 4px 20px rgba(79,110,247,.25)"; }}
          >Launch Fretra Dashboard — Let's Get Started →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop:`1px solid ${T.border}`,
        padding:"28px 48px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        color:T.td, fontSize:12,
        background:T.bgCard,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", fontSize:13, color:T.tm }}>Fretra</span>
          <span style={{ color:T.border }}>·</span>
          <span>SCFI Forecasting Intelligence Platform</span>
        </div>
        <span>Built with XGBoost · FastAPI · React · Supabase</span>
        <span>FYP · Universiti Teknologi PETRONAS</span>
      </footer>

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
      `}</style>
    </div>
  );
}