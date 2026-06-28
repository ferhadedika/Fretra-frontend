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
  { id:"01", label:"BEST",  name:"XGBoost",       type:"Gradient Boosting",  r2:"0.996", pct:96, color:"#4f6ef7", inEnsemble:true  },
  { id:"02", label:"",      name:"Random Forest",  type:"Bagged Tree Ensemble",r2:"0.996",pct:88, color:"#10b77f", inEnsemble:true  },
  { id:"03", label:"",      name:"LSTM",           type:"Deep Recurrent Network",r2:"0.992",pct:74,color:"#8b5cf6",inEnsemble:true  },
  { id:"04", label:"",      name:"SARIMAX",        type:"Statistical Baseline",r2:"−0.84",pct:0,  color:"#44475a", inEnsemble:false },
  { id:"05", label:"FINAL", name:"Ensemble",       type:"SLSQP Weight-Optimised",r2:"0.996",pct:97,color:"#4f6ef7",inEnsemble:true },
];

const TEAM = [
  {
    initials:"JJ", gradient:"linear-gradient(135deg,#4f6ef7,#8b5cf6)",
    name:"JJ", role:"Lead Developer & ML Engineer",
    bio:"End-to-end system architecture, machine learning pipeline design, and full-stack integration. Responsible for all modelling, feature engineering, and production deployment of Fretra.",
    tags:["Python","React","XGBoost","FastAPI","Supabase"],
  },
  {
    initials:"TM", gradient:"linear-gradient(135deg,#10b77f,#06b6d4)",
    name:"Teammate", role:"Data Science & Validation",
    bio:"Model training strategy, walk-forward cross-validation protocol, and SHAP interpretability framework. Focus area: time-series forecasting and ensemble optimisation.",
    tags:["LSTM","SHAP","Optuna","scikit-learn"],
  },
  {
    initials:"DA", gradient:"linear-gradient(135deg,#f59e0b,#ef4444)",
    name:"Teammate", role:"Research & Data Engineering",
    bio:"Dataset curation, external macroeconomic feature sourcing, and exploratory data analysis. Responsible for PMI, Brent Crude, Trade Volume, and CNY/USD data pipelines.",
    tags:["EDA","Feature Engineering","pandas","Excel"],
  },
  {
    initials:"SV", gradient:"linear-gradient(135deg,#8b5cf6,#ec4899)",
    name:"Supervisor", role:"Academic Advisor",
    bio:"Faculty supervisor overseeing research methodology, academic rigour, and industry relevance. Provided strategic guidance throughout the project lifecycle at UTP.",
    tags:["UTP","Research Methodology","Logistics","ML Oversight"],
  },
];

const MISSION_CARDS = [
  {
    color:"#4f6ef7",
    svgPath:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title:"Live SCFI Market Tracking",
    desc:"Weekly Shanghai Containerized Freight Index data ingested, validated, and processed across all major transoceanic trade lanes — updated automatically via Supabase.",
  },
  {
    color:"#10b77f",
    svgPath:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
    title:"Production-Grade Ensemble Forecasting",
    desc:"Five models trained with rigorous expanding walk-forward cross-validation — zero data leakage. Ensemble weights optimised via constrained SLSQP minimisation.",
  },
  {
    color:"#8b5cf6",
    svgPath:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title:"Full Forecast Transparency via SHAP",
    desc:"Every forecast output is accompanied by a SHAP-driven driver narrative — surfacing which macroeconomic signals are moving rates and by how much.",
  },
];

const STATS = [
  { val:"0.996", label:"XGBoost R² Score",          color:"#4f6ef7" },
  { val:"5",     label:"Validated Forecast Models",  color:"#10b77f" },
  { val:"12W",   label:"Forward Forecast Horizon",   color:"#8b5cf6" },
  { val:"10+",   label:"Years of SCFI Market Data",  color:"#f59e0b" },
];

const Card = ({ children, style, accentColor, hover = true }) => {
  const [h, setH] = React.useState(false);
  return (
    <div
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${h ? T.borderH : T.border}`,
        borderRadius: T.r2,
        boxShadow: h ? T.shHover : T.shCard,
        position: "relative", overflow: "hidden",
        transition: "all .18s",
        transform: h ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      <div style={{ position:"absolute", top:0, left:10, right:10, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)", pointerEvents:"none" }}/>
      {accentColor && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accentColor},${accentColor}44)` }}/>}
      {children}
    </div>
  );
};

const SvgIcon = ({ path, color, size = 22 }) => (
  <div style={{ width:44, height:44, borderRadius:10, background:`${color}18`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, flexShrink:0 }}>
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path}/>
    </svg>
  </div>
);

const SectionLabel = ({ children, color = T.blue }) => (
  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color, marginBottom:12 }}>{children}</div>
);

import React from "react";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'Barlow','Inter',sans-serif", overflowX:"hidden" }}>

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
            <button key={l} onClick={() => navigate(p)} style={{ background: l==="About" ? T.bgRaised : "none", border: l==="About" ? `1px solid ${T.borderH}` : "1px solid transparent", padding:"6px 14px", borderRadius:T.r, color: l==="About" ? T.t1 : T.tm, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
        <button onClick={() => navigate("/login")} style={{ background:T.blue, border:"none", borderRadius:T.r, color:"#fff", fontWeight:700, fontSize:13, padding:"8px 20px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(79,110,247,.3)", justifySelf:"end" }}>Launch App →</button>
      </nav>

      {/* HERO */}
      <section style={{ position:"relative", padding:"88px 48px 72px", textAlign:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-200, left:"50%", transform:"translateX(-50%)", width:700, height:600, background:"radial-gradient(circle,rgba(79,110,247,.1) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(79,110,247,.1)", border:"1px solid rgba(79,110,247,.28)", borderRadius:999, padding:"5px 16px", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#6f9af8", marginBottom:24 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:T.blue, display:"inline-block", animation:"pulse 2s infinite" }}/>
            Final Year Project — Data Science · UTP
          </div>

          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(40px,6vw,68px)", fontWeight:800, lineHeight:1.05, margin:"0 0 22px", letterSpacing:-.5 }}>
            Built to bring clarity<br/>
            <span style={{ background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>to global freight markets.</span>
          </h1>

          <p style={{ maxWidth:600, margin:"0 auto 36px", fontSize:16, color:T.tm, lineHeight:1.75 }}>
            Fretra combines production-grade machine learning with a decade of SCFI market data to give logistics professionals, analysts, and freight planners a reliable forward view on container shipping rate movements.
          </p>

          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10 }}>
            {[
              { color:"#4f6ef7", text:"XGBoost · Random Forest · LSTM" },
              { color:"#10b77f", text:"10+ Years of SCFI Historical Data" },
              { color:"#8b5cf6", text:"SHAP Attribution Engine" },
              { color:"#f59e0b", text:"FastAPI · React · Supabase" },
            ].map(({ color, text }) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 16px", background:"rgba(255,255,255,.04)", border:`1px solid ${T.border}`, borderRadius:999, fontSize:13, color:T.tm }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:color, flexShrink:0 }}/>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div style={{ background:T.bgCard, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {STATS.map(({ val, label, color }, i) => (
            <div key={label} style={{ textAlign:"center", padding:"40px 24px", borderRight: i < 3 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:44, fontWeight:800, color, lineHeight:1, letterSpacing:-.5 }}>{val}</div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase", color:T.td, marginTop:8 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MISSION */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"96px 48px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"start" }}>
          <div style={{ paddingTop:16 }}>
            <SectionLabel>Our Mission</SectionLabel>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:40, fontWeight:800, lineHeight:1.05, margin:"0 0 18px", letterSpacing:-.3 }}>
              Transforming market complexity<br/>into commercial foresight.
            </h2>
            <p style={{ fontSize:15, color:T.tm, lineHeight:1.8, marginBottom:18 }}>
              Container shipping rates are among the most volatile and consequential variables in global supply chains — politically sensitive, cyclically driven, and notoriously resistant to prediction.
            </p>
            <p style={{ fontSize:15, color:T.tm, lineHeight:1.8 }}>
              Fretra exists to address that gap — delivering institutional-grade freight rate forecasting tools to logistics operators, freight planners, and supply chain analysts who need a reliable forward view before rates move.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {MISSION_CARDS.map(({ color, svgPath, title, desc }) => (
              <Card key={title} accentColor={color} style={{ padding:"22px 24px" }}>
                <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                  <SvgIcon path={svgPath} color={color} size={20} />
                  <div>
                    <div style={{ fontSize:14.5, fontWeight:700, color:T.t1, marginBottom:6 }}>{title}</div>
                    <div style={{ fontSize:13, color:T.tm, lineHeight:1.65 }}>{desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MODEL ARCHITECTURE */}
      <div style={{ background:T.bgCard, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"80px 48px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel>Forecasting Architecture</SectionLabel>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:38, fontWeight:800, lineHeight:1.05, margin:"0 0 10px", letterSpacing:-.3 }}>Five validated models. One optimised ensemble.</h2>
            <p style={{ fontSize:14, color:T.tm, maxWidth:580, margin:"0 auto" }}>
              Each model captures a distinct dimension of freight rate dynamics. The production ensemble blends XGBoost, Random Forest, and LSTM via SLSQP-constrained weight optimisation.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
            {MODELS.map(({ id, label, name, type, r2, pct, color, inEnsemble }) => (
              <Card key={id} accentColor={color} style={{ padding:"22px 18px", border:`1px solid ${color}44` }} hover={false}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:T.td, marginBottom:12 }}>
                  {`MODEL ${id}`}{label ? ` · ${label}` : ""}
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:T.t1, marginBottom:3 }}>{name}</div>
                <div style={{ fontSize:12, color:T.tm, marginBottom:18 }}>{type}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, fontWeight:800, color, lineHeight:1, marginBottom:2 }}>{r2}</div>
                <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:T.td, marginBottom:14 }}>R² Score</div>
                <div style={{ height:5, background:T.bgRaised, borderRadius:3, overflow:"hidden", border:`1px solid ${T.border}`, marginBottom:12 }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, boxShadow:`0 0 8px ${color}55` }}/>
                </div>
                {!inEnsemble && (
                  <div style={{ fontSize:11, color:T.amber, background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.2)", padding:"5px 8px", borderRadius:5, textAlign:"center" }}>
                    Statistical Benchmark
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* TEAM */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"96px 48px" }}>
        <div style={{ marginBottom:48 }}>
          <SectionLabel>The Team</SectionLabel>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:38, fontWeight:800, lineHeight:1.05, margin:"0 0 10px", letterSpacing:-.3 }}>
            Built by researchers,<br/>for the industry.
          </h2>
          <p style={{ fontSize:15, color:T.tm, lineHeight:1.75, maxWidth:560 }}>
            Final year students at Universiti Teknologi PETRONAS — combining data science, software engineering, and applied research in maritime logistics intelligence.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {TEAM.map(({ initials, gradient, name, role, bio, tags }) => (
            <Card key={initials} style={{ padding:"26px 22px" }}>
              <div style={{ width:56, height:56, borderRadius:12, background:gradient, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"#fff", marginBottom:16, boxShadow:`0 4px 16px rgba(0,0,0,.35)` }}>
                {initials}
              </div>
              <div style={{ fontSize:16, fontWeight:700, color:T.t1, marginBottom:3 }}>{name}</div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:T.blue, marginBottom:12 }}>{role}</div>
              <div style={{ fontSize:13, color:T.tm, lineHeight:1.65, marginBottom:16 }}>{bio}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {tags.map(t => (
                  <span key={t} style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:5, background:"rgba(79,110,247,.1)", border:"1px solid rgba(79,110,247,.25)", color:T.blue }}>{t}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ACADEMIC CARD */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 96px" }}>
        <div style={{ position:"relative", padding:"44px 48px", background:"linear-gradient(135deg,rgba(79,110,247,.12) 0%,rgba(139,92,246,.08) 100%)", border:`1px solid ${T.border}`, borderRadius:T.r2, overflow:"hidden", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
          <div style={{ position:"absolute", top:"-30%", right:"-10%", width:400, height:400, background:"radial-gradient(circle,rgba(79,110,247,.08) 0%,transparent 65%)", pointerEvents:"none" }}/>

          <div style={{ position:"relative", zIndex:1 }}>
            <SectionLabel>Academic Context</SectionLabel>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:800, lineHeight:1.1, margin:"0 0 16px", color:T.t1 }}>
              Final Year Project<br/>Presentation 2024/25
            </div>
            <p style={{ fontSize:14.5, color:T.tm, lineHeight:1.75, marginBottom:28 }}>
              Fretra is submitted as a final year capstone project, assessed on technical depth, commercial applicability, and innovation in applied machine learning for the logistics sector.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:48, height:48, background:"linear-gradient(135deg,#4f6ef7,#8b5cf6)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, color:"#fff", flexShrink:0 }}>UTP</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.t1, marginBottom:2 }}>Universiti Teknologi PETRONAS</div>
                <div style={{ fontSize:12, color:T.tm }}>Department of Information & Communication Technology</div>
              </div>
            </div>
          </div>

          <div style={{ position:"relative", zIndex:1 }}>
            {[
              { lbl:"Programme",   val:"B.Sc. Data Science / Information Technology" },
              { lbl:"Project",     val:"Final Year Project 2024/25" },
              { lbl:"Domain",      val:"Applied Machine Learning · Logistics Intelligence" },
              { lbl:"Dataset",     val:"SCFI 2015–2025 · 10+ Years Weekly" },
              { lbl:"Tech Stack",  val:"FastAPI · React · Supabase · Firebase" },
              { lbl:"Status",      val:"Completed", green:true },
            ].map(({ lbl, val, green }) => (
              <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12.5, color:T.tm, fontWeight:600 }}>{lbl}</span>
                <span style={{ fontSize:12.5, fontWeight:700, color: green ? T.green : T.t2, background: green ? "rgba(16,183,127,.1)" : "transparent", border: green ? "1px solid rgba(16,183,127,.25)" : "none", padding: green ? "2px 10px" : "0", borderRadius:5 }}>
                  {green ? "✓ " : ""}{val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}