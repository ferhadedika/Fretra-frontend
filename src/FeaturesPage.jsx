import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LOGO_ICON from "./assests/logo-icon.png";

const T = {
  bg: "#0c0d11", bgCard: "#13141a", bgRaised: "#1a1c24",
  border: "#22242e", borderH: "#323546",
  t1: "#edeef2", t2: "#b0b4c4", tm: "#7a7f96", td: "#44475a",
  blue: "#4f6ef7", violet: "#8b5cf6", green: "#10b77f", amber: "#f59e0b", pink: "#ec4899", teal: "#06b6d4",
  r: "10px", r2: "14px",
  shCard: "0 2px 8px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.035)",
  shHover: "0 8px 28px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.05)",
};

const FEAT_CATS = [
  {
    key: "price", label: "Price Intelligence", color: "#4f6ef7",
    svgPath: "M3 3v18h18M7 16l4-4 4 4 4-4",
    desc: "Autoregressive signals derived directly from the SCFI — the single highest-impact feature group across all production models. Captures short-term momentum, recent volatility, and directional strength in freight rate movements.",
    features: [
      { name: "Price Lags", raw: "scfi_lag_1 … scfi_lag_8", desc: "SCFI values at 1–8 week offsets. lag_1 and lag_2 are the dominant SHAP contributors in XGBoost — the most commercially decisive inputs." },
      { name: "Rolling Mean", raw: "rolling_4w_mean, rolling_8w_mean", desc: "4-week and 8-week centred rolling averages that smooth short-term volatility and expose the underlying rate trend." },
      { name: "Rolling Std Dev", raw: "rolling_4w_std, rolling_8w_std", desc: "Volatility signal quantifying how sharply the index is swinging relative to recent trading history." },
      { name: "Rolling Range", raw: "rolling_4w_min, rolling_8w_max", desc: "Captures range compression and breakout setups — critical for detecting inflection points in freight rate cycles." },
      { name: "First Difference", raw: "scfi_diff_1", desc: "Week-on-week change used as the primary model target. Stationarises the series for robust out-of-sample training." },
      { name: "Momentum", raw: "scfi_mom_4w, scfi_mom_8w", desc: "Rate-of-change over 4 and 8 weeks — a directional strength indicator used by both tree-based and recurrent models." },
    ],
  },
  {
    key: "macro", label: "Macroeconomic Signals", color: "#10b77f",
    svgPath: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9",
    desc: "External economic indicators that drive container shipping demand and carrier costs. All features are z-score normalised and lagged to eliminate any risk of forward data leakage.",
    features: [
      { name: "Global PMI", raw: "global_pmi_lag_1, global_pmi_lag_2", desc: "JP Morgan Global Manufacturing PMI — the most widely tracked leading indicator for international trade volumes. Z-score normalised." },
      { name: "Brent Crude Oil", raw: "brent_lag_1, brent_lag_2", desc: "Brent crude price: a direct input cost for ocean carriers and a reliable proxy for global economic demand conditions." },
      { name: "Trade Volume Index", raw: "trade_vol_lag_1", desc: "Global trade volume index normalised via z-score. Measures the physical volume of goods entering the shipping network." },
      { name: "CNY/USD Exchange Rate", raw: "cny_usd_lag_1, cny_usd_lag_2", desc: "Chinese yuan to US dollar rate — directly affects Chinese export competitiveness and container booking volumes." },
      { name: "PMI Expansion Crossover", raw: "pmi_cross_50", desc: "Binary threshold signal: PMI crossing the 50-point expansion/contraction boundary — a recognised commercial turning point." },
      { name: "Cross-Market Interactions", raw: "brent_x_pmi, brent_x_cny, trade_x_pmi", desc: "Three interaction terms capturing combined macro effects — among the highest-impact non-linear signals in the feature set." },
    ],
  },
  {
    key: "regime", label: "Market Regime Detection", color: "#8b5cf6",
    svgPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    desc: "Structural positioning features that communicate where the market currently sits within the freight rate cycle — enabling regime-aware forecasting that performs consistently across expansion, contraction, and shock periods.",
    features: [
      { name: "52-Week Z-Score", raw: "zscore_52w", desc: "How many standard deviations the current SCFI sits from its 52-week mean — the primary regime classification signal." },
      { name: "Distance from Cycle High", raw: "dist_from_52w_high", desc: "Percentage distance below the 52-week high — identifies overbought and cycle-peak market states." },
      { name: "Distance from Cycle Low", raw: "dist_from_52w_low", desc: "Percentage distance above the 52-week low — identifies oversold and cycle-trough market states." },
      { name: "Regime Classification", raw: "regime_label", desc: "Ordinal encoding: 0=trough, 1=recovery, 2=expansion, 3=peak, 4=contraction — derived from 52-week Z-score thresholds." },
      { name: "Trend Direction", raw: "trend_dir_4w", desc: "Sign of 4-week linear regression slope — a categorical directional signal supporting short-horizon decision-making." },
      { name: "Cycle Phase", raw: "cycle_phase", desc: "Composite signal combining regime label and trend direction for phase-aware, context-sensitive forecasting." },
    ],
  },
  {
    key: "temporal", label: "Seasonal & Temporal", color: "#f59e0b",
    svgPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    desc: "Calendar and cyclical encodings that enable the model to learn recurring seasonal patterns in freight rates — spanning Chinese New Year windows, peak export seasons, and multi-year trade cycle trends.",
    features: [
      { name: "Week of Year", raw: "week_of_year", desc: "ISO week number — captures Chinese New Year disruptions, Q4 peak season surges, and other commercially significant recurrent patterns." },
      { name: "Calendar Month", raw: "month", desc: "Monthly encoding that captures typical intra-year booking and rate seasonality across the container shipping calendar." },
      { name: "Fiscal Quarter", raw: "quarter", desc: "Q1–Q4 ordinal — supports annual demand cycle detection and quarterly rate trend analysis." },
      { name: "Cyclical Encoding", raw: "week_sin, week_cos", desc: "Sine/cosine encoding of week-of-year — prevents the model from treating week 52 and week 1 as temporally distant." },
      { name: "Long-Run Growth Trend", raw: "year_trend", desc: "Linear year index capturing structural growth in global container trade volumes over the 10-year dataset horizon." },
      { name: "Post-Peak Normalisation Flag", raw: "post_covid_flag", desc: "Binary flag for weeks after May 2022 — isolates the post-peak rate normalisation regime for targeted model adaptation." },
    ],
  },
  {
    key: "shock", label: "Structural Break Variables", color: "#ec4899",
    svgPath: "M13 10V3L4 14h7v7l9-11h-7z",
    desc: "COVID-era structural break variables that allow the model to cleanly handle the extreme 2020–2022 rate spike — protecting baseline forecasting accuracy without contaminating pre- or post-shock market periods.",
    features: [
      { name: "Shock Period Indicator", raw: "covid_shock_dummy", desc: "Binary flag active during the COVID rate spike (Jun 2020 – Dec 2022). Prevents regime bleed-out across training folds." },
      { name: "Shock Phase Ordinal", raw: "phase_ordinal", desc: "Five-phase ordered encoding: 0=pre-COVID, 1=initial shock, 2=peak, 3=plateau, 4=normalisation." },
      { name: "Mean-Reversion Decay", raw: "covid_decay", desc: "Exponential decay variable starting from the rate peak — models the structural return-to-baseline trajectory." },
      { name: "Shock-Macro Interaction", raw: "covid_x_pmi", desc: "Shock dummy × PMI — captures how macroeconomic signals behaved differently during the acute disruption period." },
      { name: "Era-Balanced Weights", raw: "covid_sample_weight", desc: "Shock-period rows are up-weighted during training to correct for era-imbalance and prevent baseline period dominance." },
      { name: "Regime Transition Flag", raw: "structural_break_flag", desc: "Flags weeks within 8 weeks of a confirmed regime transition — an edge-aware signal for boundary period forecasting." },
    ],
  },
];

const SHAP_ITEMS = [
  { name: "scfi_lag_1",          val: 312, color: "#4f6ef7", pct: 100 },
  { name: "scfi_lag_2",          val: 218, color: "#4f6ef7", pct: 70  },
  { name: "rolling_4w_mean",     val: 174, color: "#4f6ef7", pct: 56  },
  { name: "brent_x_pmi",         val: 143, color: "#10b77f", pct: 46  },
  { name: "zscore_52w",          val: 128, color: "#8b5cf6", pct: 41  },
  { name: "global_pmi_lag_1",    val: 109, color: "#10b77f", pct: 35  },
  { name: "covid_shock_dummy",   val: 94,  color: "#ec4899", pct: 30  },
  { name: "week_of_year",        val: 76,  color: "#f59e0b", pct: 24  },
  { name: "dist_from_52w_high",  val: 68,  color: "#8b5cf6", pct: 22  },
  { name: "brent_lag_1",         val: 61,  color: "#10b77f", pct: 20  },
];

const Card = ({ children, style, accent }) => {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ background:T.bgCard, border:`1px solid ${h ? T.borderH : T.border}`, borderRadius:T.r2, boxShadow: h ? T.shHover : T.shCard, position:"relative", overflow:"hidden", transition:"all .18s", transform: h ? "translateY(-2px)" : "none", ...style }}>
      <div style={{ position:"absolute", top:0, left:10, right:10, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)", pointerEvents:"none" }}/>
      {accent && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:accent }}/>}
      {children}
    </div>
  );
};

const CatIcon = ({ path, color }) => (
  <div style={{ width:42, height:42, borderRadius:10, background:`${color}18`, border:`1px solid ${color}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    <svg width="20" height="20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path}/>
    </svg>
  </div>
);

export default function FeaturesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("price");
  const cat = FEAT_CATS.find(c => c.key === activeTab);

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
            <button key={l} onClick={() => navigate(p)} style={{ background: l==="Features" ? T.bgRaised : "none", border: l==="Features" ? `1px solid ${T.borderH}` : "1px solid transparent", padding:"6px 14px", borderRadius:T.r, color: l==="Features" ? T.t1 : T.tm, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
        <button onClick={() => navigate("/login")} style={{ background:T.blue, border:"none", borderRadius:T.r, color:"#fff", fontWeight:700, fontSize:13, padding:"8px 20px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(79,110,247,.3)", justifySelf:"end" }}>Launch App →</button>
      </nav>

      {/* HERO */}
      <section style={{ padding:"72px 48px 56px", maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(139,92,246,.1)", border:"1px solid rgba(139,92,246,.28)", borderRadius:999, padding:"5px 16px", fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#a78bfa", marginBottom:20 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:T.violet, display:"inline-block" }}/>
          Market Intelligence Architecture
        </div>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:800, lineHeight:1.05, margin:"0 0 16px", letterSpacing:-.5 }}>
          62 engineered market signals.<br/>
          <span style={{ background:"linear-gradient(90deg,#8b5cf6,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Five intelligence categories.</span>
        </h1>
        <p style={{ fontSize:15.5, color:T.tm, maxWidth:600, lineHeight:1.75, margin:0 }}>
          Fretra's feature layer spans autoregressive price intelligence, z-score normalised macroeconomic signals, cycle regime detection, seasonal calendar encodings, and COVID structural break variables — engineered to deliver commercially reliable forecasts across all market conditions.
        </p>
      </section>

      {/* CATEGORY TABS */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 52px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
          {FEAT_CATS.map(c => (
            <Card key={c.key} style={{ padding:"16px 18px", cursor:"pointer", border:`1px solid ${activeTab===c.key ? c.color+"44" : T.border}`, boxShadow: activeTab===c.key ? `0 0 0 1px ${c.color}22,${T.shCard}` : T.shCard }} accent={activeTab===c.key ? `linear-gradient(90deg,${c.color},${c.color}44)` : undefined}>
              <button onClick={() => setActiveTab(c.key)} style={{ background:"none", border:"none", padding:0, cursor:"pointer", width:"100%", textAlign:"left", fontFamily:"inherit" }}>
                <div style={{ marginBottom:10 }}>
                  <CatIcon path={c.svgPath} color={activeTab===c.key ? c.color : T.td} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color: activeTab===c.key ? c.color : T.td, marginBottom:4 }}>{c.label}</div>
                <div style={{ fontSize:12, color:T.td }}>{c.features.length} signals</div>
              </button>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURE DETAIL */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 72px" }}>
        <Card accent={`linear-gradient(90deg,${cat.color},${cat.color}44)`} style={{ padding:"28px 32px", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <CatIcon path={cat.svgPath} color={cat.color} />
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:cat.color, marginBottom:3 }}>Signal Category</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800, color:T.t1 }}>{cat.label}</div>
            </div>
          </div>
          <p style={{ fontSize:14, color:T.t2, lineHeight:1.75, maxWidth:720, marginBottom:24 }}>{cat.desc}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {cat.features.map(f => (
              <div key={f.name} style={{ background:T.bgRaised, border:`1px solid ${T.border}`, borderRadius:T.r, padding:"14px 16px" }}>
                <div style={{ fontWeight:700, color:T.t1, fontSize:13.5, marginBottom:3 }}>{f.name}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10.5, color:cat.color, marginBottom:8, letterSpacing:.5 }}>{f.raw}</div>
                <div style={{ fontSize:12.5, color:T.tm, lineHeight:1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* SHAP IMPORTANCE */}
      <section style={{ maxWidth:1200, margin:"0 auto", padding:"0 48px 96px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

          {/* SHAP bar chart */}
          <Card style={{ padding:"24px 28px" }} accent={`linear-gradient(90deg,${T.blue}44,transparent)`}>
            <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:T.td, marginBottom:4 }}>SHAP Attribution Analysis</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:T.t1, marginBottom:4 }}>Top 10 Decision Drivers</div>
            <div style={{ fontSize:12, color:T.tm, marginBottom:20 }}>The signals with the greatest measurable impact on each forecast output</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {SHAP_ITEMS.map(item => (
                <div key={item.name}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, color:T.t2, fontFamily:"monospace" }}>{item.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.val}</span>
                  </div>
                  <div style={{ height:5, background:T.bgRaised, borderRadius:3, overflow:"hidden", border:`1px solid ${T.border}` }}>
                    <div style={{ height:"100%", width:`${item.pct}%`, background:`linear-gradient(90deg,${item.color},${item.color}88)`, borderRadius:3, boxShadow:`0 0 8px ${item.color}44`, transition:"width .5s" }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, fontSize:11, color:T.td }}>Mean |SHAP value| across 5 validation folds — XGBoost production model</div>
          </Card>

          {/* right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Card style={{ padding:"20px 22px" }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:T.td, marginBottom:16 }}>Signal Distribution by Category</div>
              {FEAT_CATS.map(c => (
                <div key={c.key} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:c.color, flexShrink:0, boxShadow:`0 0 6px ${c.color}88` }}/>
                  <span style={{ fontSize:13, color:T.t2, flex:1 }}>{c.label}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:c.color }}>{c.features.length}</span>
                  <div style={{ width:80, height:4, background:T.bgRaised, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(c.features.length/6)*100}%`, background:c.color, borderRadius:2 }}/>
                  </div>
                </div>
              ))}
              <div style={{ borderTop:`1px solid ${T.border}`, marginTop:8, paddingTop:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:T.tm }}>Total engineered market signals</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:T.t1 }}>62</span>
              </div>
            </Card>

            <Card style={{ padding:"20px 22px" }}>
              <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:T.td, marginBottom:12 }}>Data Engineering Standards</div>
              {[
                { label:"Macro normalisation",     val:"Z-score (52-week rolling)",        color:T.green  },
                { label:"Lag strategy",             val:"1–8 weeks, zero alignment leakage",color:T.blue   },
                { label:"Shock period handling",    val:"Phase dummies + sample weighting", color:T.pink   },
                { label:"Forecast target variable", val:"First-differenced SCFI",           color:T.violet },
                { label:"Feature selection",        val:"SHAP attribution + VIF screening", color:T.amber  },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.bgRaised}` }}>
                  <span style={{ fontSize:12.5, color:T.tm }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:600, color, background:`${color}12`, border:`1px solid ${color}28`, padding:"2px 8px", borderRadius:5 }}>{val}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}