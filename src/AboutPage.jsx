import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { SiteHeader } from "./components/SiteHeader";

/* ============================================================
   DESIGN TOKENS  (existing palette preserved, extended for depth)
   ============================================================ */
const T = {
  bg: "#0c0d11", bgCard: "#13141a", bgRaised: "#1a1c24",
  border: "#22242e", borderH: "#323546",
  t1: "#edeef2", t2: "#b0b4c4", tm: "#7a7f96", td: "#44475a",
  blue: "#4f6ef7", violet: "#8b5cf6", green: "#10b77f", amber: "#f59e0b", pink: "#ec4899", cyan: "#06b6d4",
  r: "10px", r2: "14px", r3: "20px",
  shCard: "0 2px 8px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.035)",
  shHover: "0 8px 28px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.05)",
  glass: "rgba(19,20,26,.55)",
  glassBorder: "rgba(255,255,255,.08)",
};

const EASE = [0.16, 1, 0.3, 1];

/* ============================================================
   CONTENT DATA
   ============================================================ */
const STATS = [
  { val: "0.996", label: "XGBoost R\u00B2 Score", color: T.blue },
  { val: "5", label: "Validated Forecast Models", color: T.green },
  { val: "12W", label: "Forward Forecast Horizon", color: T.violet },
  { val: "10+", label: "Years of SCFI Market Data", color: T.amber },
];

const OVERVIEW_CAPABILITIES = [
  {
    color: T.blue,
    svgPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Live SCFI Market Tracking",
    desc: "Weekly Shanghai Containerized Freight Index data is ingested, validated, and processed across major transoceanic trade lanes, refreshed automatically through Supabase.",
  },
  {
    color: T.green,
    svgPath: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
    title: "Production Grade Ensemble Forecasting",
    desc: "Five models are trained with a 5-fold expanding walk forward cross validation protocol, eliminating data leakage. Ensemble weights are tuned through constrained SLSQP optimisation with a 10% floor per model.",
  },
  {
    color: T.violet,
    svgPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Full Forecast Transparency via SHAP",
    desc: "Every prediction ships with a SHAP driven driver narrative, surfacing which macroeconomic signals are moving rates and by how much, so the number is never a black box.",
  },
];

const TARGET_USERS = [
  "Logistics companies", "Freight forwarders", "Shipping companies",
  "Supply chain planners", "Procurement teams", "Logistics analysts",
  "Operations managers", "Researchers",
];

const DEVELOPER = {
  name: "Ferhad Edika Putra bin Azmi",
  role: "Lead Developer, Machine Learning Engineer, Full Stack Developer, and Data Scientist",
  bio: "Ferhad Edika Putra bin Azmi is a final year Bachelor of Information Technology student majoring in Big Data Analytics at Universiti Teknologi PETRONAS. During his internship, he gained practical experience in data analysis within the logistics, supply chain, and information technology industries. He specialises in building end to end machine learning solutions, from data engineering and model development to full stack web applications and deployment, with a strong focus on creating practical AI systems for real world business problems.",
  emails: ["Ferhad_22001321@utp.edu.my", "ferhadazmi@gmail.com"],
  linkedin: "#",
  github: "#",
  skillGroups: [
    { label: "Modelling", items: ["XGBoost", "Random Forest", "LSTM", "SARIMAX", "Ensemble Learning", "Time Series Forecasting"] },
    { label: "ML Tooling", items: ["SHAP", "Optuna", "Scikit Learn", "Feature Engineering", "Walk Forward Cross Validation", "Hyperparameter Optimization"] },
    { label: "Engineering", items: ["Python", "React", "FastAPI", "Supabase", "Firebase", "REST API"] },
    { label: "Data & Ops", items: ["Pandas", "NumPy", "SQL", "PostgreSQL", "Power BI", "Git", "Data Preprocessing", "Model Deployment"] },
  ],
};

const SUPERVISOR = {
  name: "[Supervisor Name]",
  title: "[Academic Title]",
  department: "[Department]",
  specialization: "[Area of Specialisation]",
  bio: "[Placeholder biography describing the supervisor's research background, academic contributions, and role in guiding this final year project's methodology and technical direction.]",
};

const TECH_STACK_GROUPS = [
  {
    label: "Machine Learning",
    color: T.blue,
    items: ["XGBoost", "Random Forest", "LSTM", "SARIMAX", "Ensemble Learning", "SHAP", "Optuna", "Scikit Learn"],
  },
  {
    label: "Data Engineering",
    color: T.green,
    items: ["Python", "Pandas", "NumPy", "Feature Engineering", "Data Preprocessing", "SQL", "PostgreSQL"],
  },
  {
    label: "Application & Infrastructure",
    color: T.violet,
    items: ["React", "FastAPI", "Supabase", "Firebase", "REST API", "Git", "Model Deployment"],
  },
  {
    label: "Analytics & Reporting",
    color: T.amber,
    items: ["Power BI", "Walk Forward Cross Validation", "Hyperparameter Optimization"],
  },
];

const MODELS = [
  { id: "01", label: "BEST", name: "XGBoost", type: "Gradient Boosting", r2: "0.996", pct: 96, color: T.blue },
  { id: "02", label: "", name: "Random Forest", type: "Bagged Tree Ensemble", r2: "0.996", pct: 88, color: T.green },
  { id: "03", label: "", name: "LSTM", type: "Deep Recurrent Network", r2: "0.992", pct: 74, color: T.violet },
  { id: "04", label: "", name: "SARIMAX", type: "Statistical Time Series", r2: "0.996", pct: 85, color: T.cyan },
  { id: "05", label: "FINAL", name: "Ensemble", type: "SLSQP Weight Optimised (70/10/10/10)", r2: "0.996", pct: 97, color: T.blue },
];

const METHODOLOGY_TABS = [
  {
    key: "pipeline",
    label: "Data Pipeline",
    heading: "Five sources, one weekly spine.",
    body: "SCFI, Brent crude, CNY/USD, PMI, and World Trade Volume are merged onto a Friday anchored weekly timeline. Hampel filtering removes sensor level outliers before lag features and seasonal dummies are engineered, producing a clean 522 row, 62 column training set.",
  },
  {
    key: "modelling",
    label: "Model Development",
    heading: "Four architectures, one production ensemble.",
    body: "XGBoost with Optuna guided tuning, Random Forest, SARIMAX, and LSTM are each trained independently to capture a different dimension of freight rate behaviour, from non linear feature interactions to sequential momentum.",
  },
  {
    key: "validation",
    label: "Validation Strategy",
    heading: "5-fold expanding walk forward validation.",
    body: "Each fold trains on all historical data up to a cutoff and validates only on the following, unseen block \u2014 the training window grows from 79 weeks in fold 1 to 395 weeks in fold 5, while validation always covers the next 79 weeks. Because no fold's model ever sees data beyond its own cutoff, this eliminates the look ahead bias a random train/test split would introduce, reaching a final XGBoost R\u00B2 of 0.996 after tuning.",
  },
  {
    key: "interpretability",
    label: "Interpretability",
    heading: "SHAP driven driver narratives.",
    body: "A SHAP TreeExplainer decomposes every forecast into the macroeconomic signals that produced it, turning a single predicted number into a readable explanation of what is moving the market and by how much.",
  },
];

const TIMELINE = [
  { phase: "01", title: "Problem Definition & Literature Review", desc: "Scoped freight rate volatility as a forecasting problem and reviewed existing statistical and machine learning approaches used in logistics costing." },
  { phase: "02", title: "Dataset Construction", desc: "Built the core SCFI research dataset from scratch, merging five raw sources with Hampel filtering, lag features, and documented forward filled boundary values." },
  { phase: "03", title: "Model Development", desc: "Trained XGBoost with Optuna tuning, Random Forest, SARIMAX, and LSTM as four independent base learners, each capturing a different dimension of freight rate behaviour." },
  { phase: "04", title: "Validation Protocol", desc: "Adopted 5-fold expanding walk forward cross validation, training on all history up to each cutoff and validating only on the following unseen block, reaching a final XGBoost R\u00B2 of 0.996 with SHAP interpretability integrated." },
  { phase: "05", title: "Full Stack Platform Build", desc: "Built the Fretra web application on React, FastAPI, Supabase, and Firebase, including live Supabase backed data hooks and Google OAuth authentication." },
  { phase: "06", title: "Live Data Automation", desc: "Automated weekly SCFI and macroeconomic updates using the FRED API and a Selenium and tedata based scraper, scheduled through GitHub Actions." },
  { phase: "07", title: "Final Submission", desc: "Consolidated the platform, model pipeline, and documentation for final year project presentation and academic assessment." },
];

const ROADMAP = [
  { tag: "Now", title: "Model Refresh Automation", desc: "Scheduled retraining triggers so the ensemble adapts as new SCFI and macroeconomic data arrives each week." },
  { tag: "Next", title: "Additional Freight Indices", desc: "Extend coverage beyond SCFI to CCFI and the World Container Index for broader trade lane visibility." },
  { tag: "Next", title: "Port Congestion Signals", desc: "Incorporate real time port congestion and vessel queue data as additional leading indicators." },
  { tag: "Later", title: "Broker & ERP Integrations", desc: "Expose forecasts through an API that logistics and procurement systems can consume directly for costing workflows." },
  { tag: "Later", title: "Mobile Companion App", desc: "A lightweight mobile view for operations managers who need a forecast check outside the desktop platform." },
];

/* ============================================================
   SHARED UI PRIMITIVES
   ============================================================ */
const Card = ({ children, style, accentColor, hover = true, as: Comp = "div", ...rest }) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [h, setH] = useState(false);
  return (
    <Comp
      onMouseMove={(e) => {
        if (!hover) return;
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${h ? T.borderH : T.border}`,
        borderRadius: T.r2,
        boxShadow: h ? T.shHover : T.shCard,
        position: "relative", overflow: "hidden",
        transition: "border-color .25s, transform .25s, box-shadow .3s",
        transform: h ? "translateY(-3px)" : "none",
        ...style,
      }}
      {...rest}
    >
      {hover && (
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            opacity: h ? 1 : 0, transition: "opacity .3s",
            background: `radial-gradient(340px circle at ${pos.x}% ${pos.y}%, ${accentColor || T.blue}22, transparent 70%)`,
          }}
        />
      )}
      <div style={{ position: "absolute", top: 0, left: 10, right: 10, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)", pointerEvents: "none" }} />
      {accentColor && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accentColor},${accentColor}44)` }} />}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </Comp>
  );
};

const GlassPanel = ({ children, style }) => (
  <div style={{
    background: T.glass,
    border: `1px solid ${T.glassBorder}`,
    borderRadius: T.r2,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    ...style,
  }}>
    {children}
  </div>
);

const SvgIcon = ({ path, color, size = 22 }) => (
  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, flexShrink: 0 }}>
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  </div>
);

const SectionLabel = ({ children, color = T.blue }) => (
  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color, marginBottom: 12 }}>{children}</div>
);

const Reveal = ({ children, delay = 0, y = 24, style }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, ease: EASE, delay }}
    style={style}
  >
    {children}
  </motion.div>
);

const AnimatedNumber = ({ value, color }) => {
  const numeric = parseFloat(value);
  const isNumeric = !Number.isNaN(numeric) && /^[0-9.]+$/.test(value.replace(/[+W]/g, ""));
  const [display, setDisplay] = useState(isNumeric ? "0" : value);
  const ref = useRef(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => {
        if (!isNumeric) return;
        const suffix = value.replace(/[0-9.]/g, "");
        const duration = 900;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const current = (numeric * eased).toFixed(value.includes(".") ? 3 : 0);
          setDisplay(`${current}${suffix}`);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }}
      style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 44, fontWeight: 800, color, lineHeight: 1, letterSpacing: -0.5 }}
    >
      {display}
    </motion.div>
  );
};

/* ============================================================
   SIGNATURE VISUAL: animated forecast curve
   Historical line resolves into a dashed, uncertainty banded
   forecast, the exact shape of what Fretra produces.
   ============================================================ */
const ForecastVisualization = () => {
  const historicalPath = "M0,150 C40,120 70,170 110,140 C150,110 180,160 220,130 C260,100 290,150 330,120 C370,95 400,130 430,105";
  const forecastPath = "M430,105 C465,88 500,96 540,78 C580,60 615,72 650,50";
  const bandTop = "M430,105 C465,80 500,82 540,58 C580,38 615,44 650,18 L650,50 C615,72 580,60 540,78 C500,96 465,88 430,105 Z";

  return (
    <svg viewBox="0 0 650 220" style={{ width: "100%", maxWidth: 640, height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.blue} />
          <stop offset="100%" stopColor={T.violet} />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.violet} stopOpacity="0.28" />
          <stop offset="100%" stopColor={T.violet} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={bandTop}
        fill="url(#fillGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
      />

      <motion.path
        d={historicalPath}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
      />

      <motion.path
        d={forecastPath}
        fill="none"
        stroke={T.violet}
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 1.2 }}
      />

      <motion.circle
        cx="430" cy="105" r="5" fill={T.t1}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.3, duration: 0.4 }}
      />
      <motion.circle
        cx="430" cy="105" r="5" fill="none" stroke={T.violet} strokeWidth="1.5"
        animate={{ r: [5, 22, 5], opacity: [0.9, 0, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
      />

      <motion.text
        x="440" y="30" fill={T.tm} fontSize="11" fontFamily="'Barlow',sans-serif" fontWeight="600"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
      >
        12 week forecast
      </motion.text>
      <motion.text
        x="150" y="200" fill={T.td} fontSize="11" fontFamily="'Barlow',sans-serif" fontWeight="600"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
      >
        Historical SCFI
      </motion.text>
    </svg>
  );
};

const AuroraBackground = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    <motion.div
      style={{ position: "absolute", top: -180, left: "18%", width: 520, height: 420, borderRadius: "50%", background: `radial-gradient(circle,${T.blue}22 0%,transparent 68%)`, filter: "blur(10px)" }}
      animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      style={{ position: "absolute", top: -100, right: "12%", width: 480, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${T.violet}1c 0%,transparent 68%)`, filter: "blur(10px)" }}
      animate={{ x: [0, -30, 20, 0], y: [0, 20, -20, 0] }}
      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
    />
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
  </div>
);

/* Nav is now the shared <SiteHeader> component, imported above,
   so this page's header matches every other marketing page. */

/* ============================================================
   HERO
   ============================================================ */
const Hero = ({ glowRef }) => (
  <section
    ref={glowRef}
    style={{ position: "relative", padding: "96px 48px 80px", overflow: "hidden" }}
  >
    <AuroraBackground />
    <div
      className="cursor-glow"
      style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(420px circle at var(--mx,50%) var(--my,20%),rgba(79,110,247,.10),transparent 70%)",
      }}
    />

    <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
      <div>
        <Reveal>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,110,247,.1)", border: "1px solid rgba(79,110,247,.28)", borderRadius: 999, padding: "5px 16px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#6f9af8", marginBottom: 24 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.blue, display: "inline-block", animation: "pulse 2s infinite" }} />
            Final Year Project, Data Science, UTP
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(38px,5vw,60px)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 22px", letterSpacing: -0.5 }}>
            Built to bring clarity<br />
            <span style={{ background: "linear-gradient(90deg,#4f6ef7,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>to global freight markets.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p style={{ maxWidth: 520, fontSize: 16, color: T.tm, lineHeight: 1.75, marginBottom: 32 }}>
            Fretra pairs production grade machine learning with a decade of SCFI market data, giving logistics professionals, analysts, and freight planners a reliable forward view on container shipping rate movements.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { color: T.blue, text: "XGBoost, Random Forest, SARIMAX, LSTM" },
              { color: T.green, text: "10+ Years of SCFI Data" },
              { color: T.violet, text: "SHAP Attribution Engine" },
            ].map(({ color, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "rgba(255,255,255,.04)", border: `1px solid ${T.border}`, borderRadius: 999, fontSize: 13, color: T.tm }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.2} y={16}>
        <GlassPanel style={{ padding: "28px 24px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ForecastVisualization />
        </GlassPanel>
      </Reveal>
    </div>
  </section>
);

/* ============================================================
   PROJECT OVERVIEW
   ============================================================ */
const Overview = () => (
  <>
    <div style={{ background: T.bgCard, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
        {STATS.map(({ val, label, color }, i) => (
          <div key={label} style={{ textAlign: "center", padding: "40px 24px", borderRight: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <AnimatedNumber value={val} color={color} />
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: T.td, marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>

    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 48px" }}>
      <Reveal>
        <SectionLabel>Project Overview</SectionLabel>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: "0 0 14px", letterSpacing: -0.3, maxWidth: 640 }}>
          A forecasting system built for how freight rates actually move.
        </h2>
        <p style={{ fontSize: 15, color: T.tm, lineHeight: 1.8, maxWidth: 620, marginBottom: 48 }}>
          Fretra: Machine Learning Based Freight Rate Forecasting System to Plan Costing for Logistics Companies is an individual final year capstone project under the Bachelor of Information Technology (Hons.) programme, majoring in Big Data Analytics, at Universiti Teknologi PETRONAS. It combines a validated ensemble forecasting engine with a full production web platform.
        </p>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {OVERVIEW_CAPABILITIES.map(({ color, svgPath, title, desc }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <Card accentColor={color} style={{ padding: "24px 22px", height: "100%" }}>
              <SvgIcon path={svgPath} color={color} size={20} />
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.65 }}>{desc}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  </>
);

/* ============================================================
   PROJECT MISSION
   ============================================================ */
const Mission = () => (
  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 96px" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "start" }}>
      <Reveal>
        <SectionLabel>Project Mission</SectionLabel>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: -0.3 }}>
          Transforming market complexity into commercial foresight.
        </h2>
        <p style={{ fontSize: 15, color: T.tm, lineHeight: 1.8 }}>
          Fretra helps logistics companies forecast freight rates more accurately using machine learning. Traditional forecasting methods rely on historical averages and manual estimation, making them ineffective during rapidly changing market conditions. By combining historical freight data with macroeconomic indicators and advanced forecasting models, Fretra provides reliable predictions that support better planning, budgeting, and operational decision making.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, marginBottom: 16 }}>Built for</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TARGET_USERS.map((u) => (
            <span key={u} style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 999, background: T.bgRaised, border: `1px solid ${T.border}`, color: T.t2 }}>{u}</span>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

/* ============================================================
   DEVELOPER PROFILE
   ============================================================ */
const DeveloperProfile = () => (
  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 96px" }}>
    <Reveal>
      <SectionLabel>Developer Profile</SectionLabel>
      <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: "0 0 40px", letterSpacing: -0.3 }}>
        One developer, the full stack.
      </h2>
    </Reveal>

    <Reveal delay={0.05}>
      <Card style={{ padding: "44px 44px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 4 }}>
          <div style={{ width: 96, height: 96, borderRadius: 20, background: "linear-gradient(135deg,#4f6ef7,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 30, color: "#fff", boxShadow: "0 8px 24px rgba(79,110,247,.35)" }}>
            FE
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`mailto:${DEVELOPER.emails[0]}`} style={{ width: 34, height: 34, borderRadius: 9, background: T.bgRaised, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.tm, textDecoration: "none" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 8l9 6 9-6M3 6h18v12H3z" /></svg>
            </a>
            <a href={DEVELOPER.linkedin} style={{ width: 34, height: 34, borderRadius: 9, background: T.bgRaised, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.tm, textDecoration: "none" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 9v9M6 6v.01M11 18v-5.5a2.5 2.5 0 015 0V18M11 9v9" /></svg>
            </a>
            <a href={DEVELOPER.github} style={{ width: 34, height: 34, borderRadius: 9, background: T.bgRaised, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.tm, textDecoration: "none" }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 00-6.2 0C6.7 3.1 5.6 3.4 5.6 3.4a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004.2 9.8c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></svg>
            </a>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, marginBottom: 4 }}>{DEVELOPER.name}</div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: T.blue, marginBottom: 18, lineHeight: 1.6 }}>{DEVELOPER.role}</div>
          <p style={{ fontSize: 14.5, color: T.tm, lineHeight: 1.8, marginBottom: 28, maxWidth: 720 }}>{DEVELOPER.bio}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
            {DEVELOPER.skillGroups.map((g) => (
              <div key={g.label}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, marginBottom: 10 }}>{g.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.items.map((s) => (
                    <span key={s} style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "rgba(79,110,247,.1)", border: "1px solid rgba(79,110,247,.22)", color: "#8ba7fb" }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Reveal>
  </section>
);

/* ============================================================
   SUPERVISOR PROFILE
   ============================================================ */
const SupervisorProfile = () => (
  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 96px" }}>
    <Reveal>
      <SectionLabel color={T.violet}>Supervisor Profile</SectionLabel>
      <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, lineHeight: 1.1, margin: "0 0 32px", letterSpacing: -0.3 }}>
        Academic guidance.
      </h2>
    </Reveal>
    <Reveal delay={0.05}>
      <Card style={{ padding: "36px 40px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "start" }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: "linear-gradient(135deg,#8b5cf6,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", flexShrink: 0 }}>
          SV
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.t1, marginBottom: 2 }}>{SUPERVISOR.name}</div>
          <div style={{ fontSize: 13, color: T.tm, marginBottom: 2 }}>{SUPERVISOR.title}</div>
          <div style={{ fontSize: 12, color: T.td, marginBottom: 16 }}>{SUPERVISOR.department}</div>
          <p style={{ fontSize: 13.5, color: T.tm, lineHeight: 1.75, marginBottom: 14 }}>{SUPERVISOR.bio}</p>
          <div style={{ fontSize: 12, color: T.violet, fontWeight: 600 }}>Specialisation: {SUPERVISOR.specialization}</div>
        </div>
      </Card>
    </Reveal>
  </section>
);

/* ============================================================
   TECHNOLOGY STACK
   ============================================================ */
const TechStack = () => (
  <div style={{ background: T.bgCard, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "96px 48px" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Reveal>
        <SectionLabel color={T.green}>Technology Stack</SectionLabel>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: "0 0 40px", letterSpacing: -0.3 }}>
          Everything from raw data to deployed forecast.
        </h2>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {TECH_STACK_GROUPS.map(({ label, color, items }, i) => (
          <Reveal key={label} delay={i * 0.06}>
            <Card accentColor={color} style={{ padding: "22px 20px", height: "100%" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, marginBottom: 14 }}>{label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((it) => (
                  <div key={it} style={{ fontSize: 12.5, color: T.tm, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    {it}
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  </div>
);

/* ============================================================
   RESEARCH & METHODOLOGY
   ============================================================ */
const Methodology = () => {
  const [active, setActive] = useState(METHODOLOGY_TABS[0].key);
  const activeTab = METHODOLOGY_TABS.find((t) => t.key === active);

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 48px" }}>
      <Reveal>
        <SectionLabel>Research & Methodology</SectionLabel>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: "0 0 40px", letterSpacing: -0.3 }}>
          Four models, one validated 0.996 R\u00B2.
        </h2>
      </Reveal>

      <Reveal delay={0.06}>
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {METHODOLOGY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                background: active === t.key ? T.bgRaised : "transparent",
                border: `1px solid ${active === t.key ? T.borderH : T.border}`,
                color: active === t.key ? T.t1 : T.tm,
                fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: T.r,
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 800, color: T.t1, marginBottom: 14 }}>{activeTab.heading}</div>
            <p style={{ fontSize: 14.5, color: T.tm, lineHeight: 1.8 }}>{activeTab.body}</p>
          </motion.div>
        </AnimatePresence>

        <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
            {MODELS.map(({ id, label, name, r2, pct, color }) => (
              <Card key={id} accentColor={color} style={{ padding: "16px 12px" }} hover={false}>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: T.td, marginBottom: 8 }}>
                  {`M${id}`}{label ? ` \u00B7 ${label}` : ""}
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 800, color: T.t1, marginBottom: 8, lineHeight: 1.1 }}>{name}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{r2}</div>
                <div style={{ height: 4, background: T.bgRaised, borderRadius: 3, overflow: "hidden", border: `1px solid ${T.border}`, marginTop: 10 }}>
                  <motion.div
                    style={{ height: "100%", background: color, borderRadius: 3 }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ============================================================
   PROJECT TIMELINE
   ============================================================ */
const Timeline = () => (
  <div style={{ background: T.bgCard, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "96px 48px" }}>
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Reveal>
        <SectionLabel color={T.amber}>Project Timeline</SectionLabel>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: "0 0 48px", letterSpacing: -0.3 }}>
          Seven phases, one platform.
        </h2>
      </Reveal>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 19, top: 8, bottom: 8, width: 1, background: T.border }} />
        {TIMELINE.map((item, i) => (
          <Reveal key={item.phase} delay={i * 0.05} y={16}>
            <div style={{ display: "flex", gap: 24, paddingBottom: i === TIMELINE.length - 1 ? 0 : 32, position: "relative" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: T.bgRaised, border: `1px solid ${T.borderH}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 13, color: T.blue, flexShrink: 0, zIndex: 1 }}>
                {item.phase}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: T.t1, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13.5, color: T.tm, lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </div>
);

/* ============================================================
   CONTACT
   ============================================================ */
const Contact = () => (
  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 48px" }}>
    <Reveal>
      <div style={{ position: "relative", padding: "56px 48px", background: "linear-gradient(135deg,rgba(79,110,247,.12) 0%,rgba(139,92,246,.08) 100%)", border: `1px solid ${T.border}`, borderRadius: T.r2, overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "-40%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, background: "radial-gradient(circle,rgba(79,110,247,.1) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <SectionLabel>Contact</SectionLabel>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 800, lineHeight: 1.1, margin: "0 0 14px", letterSpacing: -0.3 }}>
            Interested in the project or the research?
          </h2>
          <p style={{ fontSize: 14.5, color: T.tm, lineHeight: 1.75, maxWidth: 480, margin: "0 auto 32px" }}>
            Reach out for questions on the methodology, the platform, or potential collaboration.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {DEVELOPER.emails.map((e) => (
              <a key={e} href={`mailto:${e}`} style={{ fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: T.r, background: T.bgRaised, border: `1px solid ${T.borderH}`, color: T.t1, textDecoration: "none" }}>{e}</a>
            ))}
            <a href={DEVELOPER.linkedin} style={{ fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: T.r, background: T.blue, border: "none", color: "#fff", textDecoration: "none", boxShadow: "0 4px 14px rgba(79,110,247,.3)" }}>LinkedIn</a>
            <a href={DEVELOPER.github} style={{ fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: T.r, background: "transparent", border: `1px solid ${T.borderH}`, color: T.t2, textDecoration: "none" }}>GitHub</a>
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);

/* ============================================================
   FUTURE ROADMAP
   ============================================================ */
const Roadmap = () => (
  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 96px" }}>
    <Reveal>
      <SectionLabel color={T.pink}>Future Roadmap</SectionLabel>
      <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: "0 0 40px", letterSpacing: -0.3 }}>
        Where Fretra goes after submission.
      </h2>
    </Reveal>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
      {ROADMAP.map((r, i) => {
        const tagColor = r.tag === "Now" ? T.green : r.tag === "Next" ? T.blue : T.violet;
        return (
          <Reveal key={r.title} delay={i * 0.05}>
            <Card style={{ padding: "22px 20px", height: "100%" }}>
              <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: tagColor, background: `${tagColor}18`, border: `1px solid ${tagColor}30`, padding: "3px 10px", borderRadius: 999, marginBottom: 14 }}>{r.tag}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 8 }}>{r.title}</div>
              <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.65 }}>{r.desc}</div>
            </Card>
          </Reveal>
        );
      })}
    </div>
  </section>
);

/* ============================================================
   ACADEMIC CONTEXT STRIP
   ============================================================ */
const AcademicContext = () => (
  <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 96px" }}>
    <Reveal>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "24px 32px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r2, flexWrap: "wrap" }}>
        <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#4f6ef7,#8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 }}>UTP</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 2 }}>Universiti Teknologi PETRONAS</div>
          <div style={{ fontSize: 12, color: T.tm }}>Bachelor of Information Technology (Hons.), Major in Big Data Analytics</div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.green, background: "rgba(16,183,127,.1)", border: "1px solid rgba(16,183,127,.25)", padding: "5px 14px", borderRadius: 999 }}>
          Final Year Project
        </div>
      </div>
    </Reveal>
  </section>
);

/* ============================================================
   PAGE
   ============================================================ */
export default function AboutPage() {
  const navigate = useNavigate();
  const glowRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, easing: (t) => 1 - Math.pow(1 - t, 3) });
    let frame;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.t1, fontFamily: "'Barlow','Inter',sans-serif", overflowX: "hidden" }}>
      <SiteHeader active="About" />
      <Hero glowRef={glowRef} />
      <Overview />
      <Mission />
      <DeveloperProfile />
      <SupervisorProfile />
      <TechStack />
      <Methodology />
      <Timeline />
      <AcademicContext />
      <Contact />
      <Roadmap />

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        @media (max-width: 900px) {
          section > div[style*="grid-template-columns: 1.05fr 0.95fr"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          div[style*="repeat(5,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          div[style*="repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}