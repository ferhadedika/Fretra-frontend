import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useTransform, useSpring, useMotionValue, useInView } from "framer-motion";
import { SiteHeader } from "./components/SiteHeader";
import { useLenisScroll } from "./components/ui/fx";

/* ============================================================================
   DATA — identical in substance to the original. Only em dashes and double
   hyphens have been rewritten into plain, natural punctuation.
   ============================================================================ */

// The 68 model inputs (backend/model_artifacts/feature_config.json ->
// ml_features), grouped into five families. `count` is the number of real
// model columns in each category and must sum to 68. SHAP rankings quoted
// in descriptions come from backend/SCFI_model_metrics.json -> shap_global.
const FEAT_CATS = [
  {
    key: "price", label: "Price Momentum", color: "#4f6ef7", count: 8,
    svgPath: "M3 3v18h18M7 16l4-4 4 4 4-4",
    desc: "Signals built from the SCFI's own recent movement: lags of its weekly change, 4-week momentum and an EMA crossover. This is the dominant feature group in both tree models, which together carry 80% of the production ensemble's weight.",
    features: [
      { name: "Weekly Change Lags", raw: "DSCFI_lag1, lag2, lag3, lag4, lag8, lag12", desc: "The SCFI's own week-over-week change from 1, 2, 3, 4, 8 and 12 weeks ago. The models forecast the weekly change, so its recent history is the autoregressive core; the 1 to 3 week lags all rank in XGBoost's top six drivers." },
      { name: "4-Week Momentum", raw: "SCFI_pct_chg_4w", desc: "Percentage change in the SCFI over the trailing 4 weeks. The single most important input in both XGBoost and Random Forest by mean |SHAP|, well ahead of every other signal." },
      { name: "EMA Crossover", raw: "SCFI_EMA4_vs_EMA12", desc: "Fast (4-week) minus slow (12-week) exponential moving average. Positive when short-term momentum is outpacing the longer trend, a classic trend-following signal." },
    ],
  },
  {
    key: "macro", label: "Macroeconomic Signals", color: "#10b77f", count: 31,
    svgPath: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9",
    desc: "External drivers of container demand and carrier costs - oil, manufacturing activity, the yuan and world trade volume - each fed in as levels, lags and rate-of-change terms, plus cross-market interactions. These are the main inputs to SARIMAX.",
    features: [
      { name: "Brent Crude Oil", raw: "Brent_Oil, Brent_Oil_lag1, lag2, lag4, lag8", desc: "Spot Brent price plus its 1, 2, 4 and 8 week lags. Bunker fuel is shipping's largest variable cost and is passed through to freight rates as surcharges." },
      { name: "Oil Momentum & Z-Score", raw: "Brent_Oil_delta1, delta4, pct4, Brent_z13", desc: "1 and 4 week changes in Brent, its 4-week % change, and a 13-week z-score flagging unusually high or low oil prices. Brent's 4-week change is the LSTM's second most important input." },
      { name: "Global Manufacturing PMI", raw: "World_PMI, lag1, lag4, lag8, delta1, delta4, pct4", desc: "Manufacturing PMI level, three lags and its rate of change. Above 50 signals expanding factory output, and with it more cargo to ship." },
      { name: "CNY/USD Exchange Rate", raw: "CNY_USD, CNY_USD_lag1, lag2, lag4", desc: "The yuan's rate and three lags. A weaker yuan makes Chinese exports cheaper and lifts container demand; it is SARIMAX's single largest driver." },
      { name: "World Trade Volume", raw: "Trade_Volume_Index, lag1, lag4, lag8, delta1, delta4, pct4, Trade_Volume_YoY", desc: "The CPB world trade volume index with lags, rate-of-change terms and year-on-year growth, measuring the physical volume of goods moving through the shipping network." },
      { name: "Cross-Market Interactions", raw: "brent_x_pmi, brent_x_cny, trade_x_pmi", desc: "Products of oil price, PMI, the yuan and trade volume, capturing compounding pressure when several drivers move together." },
    ],
  },
  {
    key: "regime", label: "Market Regime Detection", color: "#8b5cf6", count: 5,
    svgPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    desc: "Positioning features that tell the models where the market sits within its 52-week range, so they can behave differently in depressed, normal and overheated markets.",
    features: [
      { name: "52-Week Z-Score", raw: "SCFI_z52", desc: "How many standard deviations the SCFI sits from its trailing 52-week mean - the basis of the regime label." },
      { name: "Distance from Cycle High", raw: "SCFI_dist_hi52", desc: "Gap between the current SCFI and its 52-week high, a proxy for market cooling. The third most important XGBoost input." },
      { name: "Distance from Cycle Low", raw: "SCFI_dist_lo52", desc: "Gap above the 52-week low, a proxy for the strength of a recovery." },
      { name: "Regime Label", raw: "SCFI_regime", desc: "A low / normal / high label (0, 1, 2) from thresholding the 52-week z-score, letting the tree models split on market state directly." },
      { name: "Momentum × Regime", raw: "DSCFI_x_regime", desc: "Last week's change multiplied by the regime label, so the same momentum is read differently depending on whether the market is depressed or overheated." },
    ],
  },
  {
    key: "temporal", label: "Seasonal & Temporal", color: "#f59e0b", count: 17,
    svgPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    desc: "Calendar encodings that let the models learn recurring seasonal patterns in freight rates - Chinese New Year, peak export season, Golden Week and the year-end slowdown.",
    features: [
      { name: "Week of Year", raw: "week_of_year", desc: "ISO week number, capturing Chinese New Year disruptions, Q4 peak-season surges and other recurring patterns." },
      { name: "Calendar Month", raw: "month", desc: "Month number, the coarse intra-year seasonality signal." },
      { name: "Month Dummies", raw: "Month_Feb … Month_Dec", desc: "Eleven one-hot month flags (January is the baseline), letting each month carry its own effect - from the Chinese New Year spike to the December blank-sailing slowdown." },
      { name: "Quarter Dummies", raw: "Q2, Q3, Q4", desc: "Quarter flags (Q1 is the baseline) for the spring restock, the Q3 peak season and the Q4 holiday rush then slowdown." },
      { name: "Year", raw: "year", desc: "Calendar year, capturing long-run structural shifts in rate levels such as post-pandemic capacity growth." },
    ],
  },
  {
    key: "trend", label: "Trend & Volatility", color: "#ec4899", count: 7,
    svgPath: "M22 12h-4l-3 9L9 3l-3 9H2",
    desc: "Smoothed trend and volatility measures of the SCFI at several speeds, helping the models separate genuine trend shifts from short-term noise. These are the LSTM's most influential inputs.",
    features: [
      { name: "Rolling Averages", raw: "SCFI_rolling_mean4, mean8, mean13", desc: "4, 8 and 13 week simple averages of the SCFI, smoothing week-to-week noise to expose the underlying trend at three speeds." },
      { name: "Rolling Volatility", raw: "SCFI_rolling_std4, std8", desc: "4 and 8 week standard deviation of the SCFI. The 4-week measure is the second most important Random Forest input." },
      { name: "Exponential Moving Averages", raw: "SCFI_EMA4, SCFI_EMA12", desc: "Fast and slow exponentially weighted averages that react to recent weeks more than simple averages do. The 12-week EMA is the LSTM's top input." },
    ],
  },
];

// XGBoost global importance: top 10 features by mean |SHAP| (index points),
// from backend/SCFI_model_metrics.json -> shap_global.xgboost.
const SHAP_ITEMS = [
  { name: "SCFI_pct_chg_4w", val: 52.4, color: "#4f6ef7", pct: 100 },
  { name: "DSCFI_lag3", val: 14.3, color: "#4f6ef7", pct: 27.3 },
  { name: "SCFI_dist_hi52", val: 13.3, color: "#8b5cf6", pct: 25.4 },
  { name: "SCFI_rolling_std4", val: 12.9, color: "#ec4899", pct: 24.5 },
  { name: "DSCFI_lag2", val: 9.4, color: "#4f6ef7", pct: 17.9 },
  { name: "DSCFI_lag1", val: 8.6, color: "#4f6ef7", pct: 16.4 },
  { name: "SCFI_rolling_mean4", val: 2.9, color: "#ec4899", pct: 5.6 },
  { name: "DSCFI_x_regime", val: 2.5, color: "#8b5cf6", pct: 4.8 },
  { name: "DSCFI_lag4", val: 2.5, color: "#4f6ef7", pct: 4.7 },
  { name: "week_of_year", val: 2.4, color: "#f59e0b", pct: 4.7 },
];

const DATA_STANDARDS = [
  { label: "Macro inputs", val: "Levels, lags & rate-of-change", color: "#10b77f" },
  { label: "Lag strategy", val: "1 to 12 weeks, no look-ahead", color: "#4f6ef7" },
  { label: "Regime handling", val: "52-week z-score + regime label", color: "#ec4899" },
  { label: "Forecast target variable", val: "First-differenced SCFI", color: "#8b5cf6" },
  { label: "Feature set", val: "Fixed 68 inputs, SHAP for interpretation", color: "#f59e0b" },
];

const NAV_LINKS = [["Models", "/models"], ["Pipeline", "/pipeline"], ["Features", "/features"], ["About", "/about"]];

/* ============================================================================
   DESIGN TOKENS
   ============================================================================ */

const T = {
  bg: "#08090c",
  border: "rgba(255,255,255,.08)",
  borderH: "rgba(255,255,255,.16)",
  t1: "#f2f3f7",
  t2: "#aeb2c4",
  tm: "#7b7f96",
  td: "#4c4f61",
  blue: "#4f6ef7",
  blueSoft: "#7d97fa",
  violet: "#8b5cf6",
  green: "#10b77f",
  amber: "#f59e0b",
  pink: "#ec4899",
  teal: "#06b6d4",
  r: "10px",
  r2: "16px",
  glass: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
  shCard: "0 1px 0 rgba(255,255,255,.05) inset, 0 12px 40px -18px rgba(0,0,0,.75)",
  shHover: "0 1px 0 rgba(255,255,255,.08) inset, 0 24px 70px -20px rgba(0,0,0,.85)",
  displayFont: "'Barlow Condensed','Barlow',sans-serif",
  bodyFont: "'Inter','Barlow',sans-serif",
  mono: "'JetBrains Mono','SFMono-Regular',Consolas,monospace",
};

const EASE = [0.16, 1, 0.3, 1];

/* ============================================================================
   HOOKS
   ============================================================================ */

function usePointer() {
  const x = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const y = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  useEffect(() => {
    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => { x.set(e.clientX); y.set(e.clientY); raf = null; });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);
  return { x, y };
}

function useCountUp(rawValue, inView, duration = 1.2) {
  const numeric = parseFloat(String(rawValue).replace(/,/g, ""));
  const [display, setDisplay] = useState(isNaN(numeric) ? rawValue : 0);
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current || isNaN(numeric)) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(numeric * eased));
      if (p < 1) requestAnimationFrame(tick);
      else setDisplay(numeric);
    };
    requestAnimationFrame(tick);
  }, [inView, numeric, duration]);
  return isNaN(numeric) ? rawValue : display;
}

/* ============================================================================
   AMBIENT BACKGROUND
   ============================================================================ */

const AuroraField = () => {
  const particles = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random() * 2.2, dur: 14 + Math.random() * 18,
      delay: -Math.random() * 20, drift: 36 + Math.random() * 70,
      op: 0.12 + Math.random() * 0.3,
    })),
    []
  );

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: T.bg }} />
      <motion.div
        style={{ position: "absolute", top: "-28%", left: "-8%", width: "65%", height: "75%", background: "radial-gradient(circle at 30% 30%, rgba(139,92,246,.15), transparent 60%)", filter: "blur(10px)" }}
        animate={{ x: [0, 34, -18, 0], y: [0, 26, 10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ position: "absolute", top: "-8%", right: "-14%", width: "58%", height: "66%", background: "radial-gradient(circle at 70% 30%, rgba(236,72,153,.11), transparent 60%)", filter: "blur(10px)" }}
        animate={{ x: [0, -28, 18, 0], y: [0, 18, -10, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ position: "absolute", bottom: "-22%", left: "18%", width: "50%", height: "56%", background: "radial-gradient(circle, rgba(79,110,247,.1), transparent 65%)", filter: "blur(10px)" }}
        animate={{ x: [0, 22, -14, 0], y: [0, -18, 8, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{
          position: "absolute", inset: -2,
          backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 55% at 50% 15%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 55% at 50% 15%, black 40%, transparent 80%)",
        }}
        animate={{ backgroundPosition: ["0px 0px", "64px 64px"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: "#c9b8ff", opacity: p.op, boxShadow: "0 0 6px rgba(201,184,255,.8)" }}
          animate={{ y: [0, -p.drift, 0], opacity: [p.op, p.op * 1.6, p.op] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.045, mixBlendMode: "overlay",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 55% at 50% 0%, transparent 40%, #08090c 100%)" }} />
    </div>
  );
};

const CursorGlow = ({ x, y }) => {
  const gx = useTransform(x, (v) => v - 260);
  const gy = useTransform(y, (v) => v - 260);
  return (
    <motion.div
      aria-hidden
      style={{ position: "fixed", top: 0, left: 0, width: 520, height: 520, zIndex: 1, borderRadius: "50%", pointerEvents: "none", mixBlendMode: "plus-lighter", background: "radial-gradient(circle, rgba(139,92,246,.09), rgba(79,110,247,.05) 45%, transparent 72%)", x: gx, y: gy }}
    />
  );
};

/* ============================================================================
   PRIMITIVES
   ============================================================================ */

const Reveal = ({ children, delay = 0, y = 22, style }) => (
  <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay, ease: EASE }} style={style}>
    {children}
  </motion.div>
);

const Stagger = ({ children, gap = 0.06, style }) => (
  <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }} style={style}>
    {children}
  </motion.div>
);

const staggerItem = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

const SpotlightCard = ({ children, style, accent = T.blue, glow = true, onClick }) => {
  const ref = useRef(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const [hov, setHov] = useState(false);

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };
  const bg = useTransform([mx, my], ([mxv, myv]) => `radial-gradient(320px circle at ${mxv}% ${myv}%, ${accent}22, transparent 70%)`);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        position: "relative", overflow: "hidden", borderRadius: T.r2,
        background: T.glass, backdropFilter: "blur(18px)",
        border: `1px solid ${hov ? "rgba(255,255,255,.18)" : T.border}`,
        boxShadow: hov ? T.shHover : T.shCard,
        transition: "border-color .25s, box-shadow .3s",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {glow && <motion.div aria-hidden style={{ position: "absolute", inset: 0, opacity: hov ? 1 : 0, transition: "opacity .3s", background: bg, pointerEvents: "none" }} />}
      <div style={{ position: "absolute", top: 0, left: 14, right: 14, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</div>
    </motion.div>
  );
};

const MagButton = ({ children, onClick, variant = "primary", style, big }) => {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });
  const [ripples, setRipples] = useState([]);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.28);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  const onDown = (e) => {
    const r = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((rs) => [...rs, { id, left: e.clientX - r.left, top: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((rp) => rp.id !== id)), 650);
  };
  const primary = variant === "primary";

  return (
    <motion.button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onMouseDown={onDown} onClick={onClick} style={{ x, y }} whileTap={{ scale: 0.96 }} className="mag-btn">
      <span
        style={{
          position: "relative", display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: T.bodyFont, fontWeight: 700, fontSize: big ? 16 : 13.5,
          padding: big ? "16px 36px" : "9px 22px", borderRadius: 999,
          color: primary ? "#08090c" : T.t1,
          background: primary ? "linear-gradient(135deg,#8fb0ff,#5f7dfb 45%,#9c7bfa)" : "rgba(255,255,255,.04)",
          border: primary ? "1px solid rgba(255,255,255,.5)" : `1px solid ${T.borderH}`,
          boxShadow: primary ? "0 0 0 1px rgba(79,110,247,.4), 0 10px 30px -8px rgba(79,110,247,.55)" : "none",
          overflow: "hidden", cursor: "pointer", whiteSpace: "nowrap",
          ...style,
        }}
      >
        {children}
        {ripples.map((rp) => (
          <motion.span key={rp.id} initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.65, ease: "easeOut" }}
            style={{ position: "absolute", left: rp.left, top: rp.top, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: "50%", background: primary ? "rgba(8,9,12,.35)" : "rgba(255,255,255,.35)", pointerEvents: "none" }} />
        ))}
      </span>
    </motion.button>
  );
};

const Eyebrow = ({ children, color = T.violet, textColor = "#c4a8fb" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${color}14`, border: `1px solid ${color}48`, borderRadius: 999, padding: "6px 16px 6px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: textColor, marginBottom: 22, fontFamily: T.bodyFont }}
  >
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, display: "inline-block" }} className="dot-pulse" />
    {children}
  </motion.div>
);

const SectionLabel = ({ children, accent = T.td }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: accent, marginBottom: 14, fontFamily: T.bodyFont }}>{children}</div>
);

const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily: T.displayFont, fontSize: "clamp(28px,3.6vw,40px)", fontWeight: 800, margin: "0 0 10px", color: T.t1, lineHeight: 1.1, letterSpacing: -0.5, ...style }}>{children}</h2>
);

const Sec = ({ children, style, id }) => (
  <section id={id} style={{ padding: "88px 48px", position: "relative", ...style }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>{children}</div>
  </section>
);

const CatIcon = ({ path, color, size = 42 }) => (
  <div style={{ width: size, height: size, borderRadius: 11, background: `linear-gradient(145deg, ${color}22, ${color}0a)`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 16px -6px ${color}55` }}>
    <svg width={size * 0.46} height={size * 0.46} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={path} /></svg>
  </div>
);

/* ============================================================================
   NAV
   ============================================================================ */

/* Nav is now the shared <SiteHeader> component, imported above,
   so this page's header matches every other marketing page. */

/* ============================================================================
   HERO — signature visualization: 68 signals resolving into 5 categories
   ============================================================================ */

const HeroVisual = ({ mx, my }) => {
  const canvasRef = useRef(null);
  const dims = useRef({ w: 0, h: 0 });
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const move = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      dims.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { w, h } = dims.current;
      const centers = FEAT_CATS.map((c, i) => {
        const angle = (i / FEAT_CATS.length) * Math.PI * 2 - Math.PI / 2;
        return { cx: w / 2 + Math.cos(angle) * w * 0.32, cy: h / 2 + Math.sin(angle) * h * 0.34, color: c.color };
      });

      const nodes = [];
      centers.forEach((c) => {
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 14 + Math.random() * 34;
          nodes.push({
            x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r,
            tx: c.cx, ty: c.cy, ta: a, tr: r,
            color: c.color, phase: Math.random() * Math.PI * 2, speed: 0.006 + Math.random() * 0.01,
          });
        }
      });
      nodesRef.current = { nodes, centers };
    };

    setup();
    window.addEventListener("resize", setup);

    let t = 0, raf;
    const render = () => {
      t += 1;
      const { w, h } = dims.current;
      const { nodes, centers } = nodesRef.current;
      ctx.clearRect(0, 0, w, h);

      centers.forEach((c) => {
        const grad = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, 70);
        grad.addColorStop(0, `${c.color}22`);
        grad.addColorStop(1, `${c.color}00`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(c.cx, c.cy, 70, 0, Math.PI * 2); ctx.fill();
      });

      nodes.forEach((n) => {
        const wobble = n.tr + Math.sin(t * n.speed + n.phase) * 5;
        let tx = n.tx + Math.cos(n.ta + t * 0.002) * wobble;
        let ty = n.ty + Math.sin(n.ta + t * 0.002) * wobble;

        const mdx = mouseRef.current.x - (canvas.getBoundingClientRect().left + tx);
        const mdy = mouseRef.current.y - (canvas.getBoundingClientRect().top + ty);
        const dist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (dist < 90) {
          const f = (1 - dist / 90) * 22;
          tx -= (mdx / (dist || 1)) * f;
          ty -= (mdy / (dist || 1)) * f;
        }

        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;

        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n.tx, n.ty);
        ctx.strokeStyle = `${n.color}18`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", setup); };
  }, []);

  const px = useTransform(mx, (v) => (typeof window !== "undefined" ? (v / window.innerWidth - 0.5) * -10 : 0));
  const py = useTransform(my, (v) => (typeof window !== "undefined" ? (v / window.innerHeight - 0.5) * -8 : 0));
  const spx = useSpring(px, { stiffness: 60, damping: 18 });
  const spy = useSpring(py, { stiffness: 60, damping: 18 });

  return (
    <motion.div style={{ x: spx, y: spy, position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </motion.div>
  );
};

const Hero = ({ mx, my }) => (
  <section style={{ position: "relative", padding: "96px 48px 40px", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.9 }}><HeroVisual mx={mx} my={my} /></div>
    <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 720, height: 520, background: "radial-gradient(ellipse,rgba(139,92,246,.12) 0%,transparent 65%)", pointerEvents: "none" }} />

    <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
      <Eyebrow>Market Intelligence Architecture</Eyebrow>
      <motion.h1
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}
        style={{ fontFamily: T.displayFont, fontSize: "clamp(38px,5.6vw,64px)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 20px", letterSpacing: -1.2, maxWidth: 780 }}
      >
        68 engineered market signals.<br />
        <span style={{ background: "linear-gradient(90deg,#a78bfa,#ec4899 55%,#a78bfa)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "inline-block" }} className="gradient-flow">
          Five intelligence categories.
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        style={{ fontSize: 16.5, color: T.t2, maxWidth: 640, lineHeight: 1.8, margin: 0, fontFamily: T.bodyFont }}
      >
        Fretra's feature layer spans SCFI price momentum, trend and volatility measures, macroeconomic drivers with cross-market interactions, 52-week market regime positioning, and seasonal calendar encodings - 68 inputs to the tree and LSTM models, 19 of which also drive SARIMAX.
      </motion.p>
    </div>
  </section>
);

/* ============================================================================
   CATEGORY SELECTOR
   ============================================================================ */

const CategorySelector = ({ activeTab, setActiveTab }) => (
  <Sec style={{ paddingTop: 8, paddingBottom: 56 }}>
    <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
      {FEAT_CATS.map((c) => {
        const isActive = activeTab === c.key;
        return (
          <motion.div key={c.key} variants={staggerItem}>
            <SpotlightCard
              accent={c.color}
              onClick={() => setActiveTab(c.key)}
              style={{
                padding: "20px 18px",
                border: `1px solid ${isActive ? c.color + "66" : T.border}`,
                boxShadow: isActive ? `0 0 0 1px ${c.color}33, 0 20px 46px -20px ${c.color}55` : T.shCard,
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: isActive ? `linear-gradient(90deg, transparent, ${c.color}, transparent)` : "transparent" }} />
              <div style={{ marginBottom: 14 }}><CatIcon path={c.svgPath} color={isActive ? c.color : T.td} /></div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: isActive ? c.color : T.t2, marginBottom: 6, lineHeight: 1.3, fontFamily: T.bodyFont }}>{c.label}</div>
              <div style={{ fontSize: 12, color: T.td, fontFamily: T.bodyFont }}>{c.count} signals</div>
              {isActive && (
                <motion.div layoutId="cat-check" style={{ position: "absolute", top: 16, right: 16, width: 18, height: 18, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 10px ${c.color}` }}>
                  <svg width="10" height="10" fill="none" stroke="#08090c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                </motion.div>
              )}
            </SpotlightCard>
          </motion.div>
        );
      })}
    </Stagger>
  </Sec>
);

/* ============================================================================
   FEATURE DETAIL
   ============================================================================ */

const FeatureDetail = ({ cat }) => (
  <Sec style={{ paddingTop: 0, paddingBottom: 40 }}>
    <AnimatePresence mode="wait">
      <motion.div
        key={cat.key}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <SpotlightCard accent={cat.color} style={{ padding: "32px 34px" }} glow={false}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}22)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <CatIcon path={cat.svgPath} color={cat.color} size={48} />
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: cat.color, marginBottom: 4, fontFamily: T.bodyFont }}>Signal Category</div>
              <div style={{ fontFamily: T.displayFont, fontSize: 26, fontWeight: 800, color: T.t1, letterSpacing: -0.3 }}>{cat.label}</div>
            </div>
          </div>
          <p style={{ fontSize: 14.5, color: T.t2, lineHeight: 1.8, maxWidth: 760, marginBottom: 28, fontFamily: T.bodyFont }}>{cat.desc}</p>

          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} gap={0.05}>
            {cat.features.map((f) => (
              <motion.div key={f.name} variants={staggerItem}>
                <motion.div
                  whileHover={{ y: -3 }}
                  style={{
                    background: "rgba(255,255,255,.025)", border: `1px solid ${T.border}`, borderRadius: T.r,
                    padding: "16px 18px", height: "100%", transition: "border-color .2s, background .2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${cat.color}55`; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,.025)"; }}
                >
                  <div style={{ fontWeight: 700, color: T.t1, fontSize: 13.5, marginBottom: 4, fontFamily: T.bodyFont }}>{f.name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10.5, color: cat.color, marginBottom: 9, letterSpacing: 0.3, wordBreak: "break-word" }}>{f.raw}</div>
                  <div style={{ fontSize: 12.5, color: T.tm, lineHeight: 1.6, fontFamily: T.bodyFont }}>{f.desc}</div>
                </motion.div>
              </motion.div>
            ))}
          </Stagger>
        </SpotlightCard>
      </motion.div>
    </AnimatePresence>
  </Sec>
);

/* ============================================================================
   SHAP IMPORTANCE
   ============================================================================ */

const ShapRow = ({ item, i, inView }) => {
  const [hov, setHov] = useState(false);
  const display = useCountUp(item.val, inView, 1 + i * 0.05);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ padding: "6px 8px", margin: "0 -8px", borderRadius: 8, background: hov ? "rgba(255,255,255,.03)" : "transparent", transition: "background .2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, color: hov ? T.t1 : T.t2, fontFamily: T.mono, transition: "color .2s" }}>{item.name}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: item.color, fontFamily: T.bodyFont }}>{display}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden", border: `1px solid ${T.border}` }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: inView ? `${item.pct}%` : 0 }} transition={{ duration: 0.9, delay: i * 0.05, ease: EASE }}
          style={{ height: "100%", background: `linear-gradient(90deg,${item.color},${item.color}aa)`, borderRadius: 3, boxShadow: hov ? `0 0 12px ${item.color}` : `0 0 6px ${item.color}66`, transition: "box-shadow .2s" }}
        />
      </div>
    </div>
  );
};

const ShapChart = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref}>
      <SpotlightCard style={{ padding: "26px 30px" }} accent={T.blue}>
        <SectionLabel>SHAP Attribution Analysis</SectionLabel>
        <div style={{ fontFamily: T.displayFont, fontSize: 24, fontWeight: 800, color: T.t1, marginBottom: 6 }}>Top 10 Decision Drivers</div>
        <div style={{ fontSize: 12.5, color: T.tm, marginBottom: 22, fontFamily: T.bodyFont }}>The inputs with the largest average impact on XGBoost's forecasts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {SHAP_ITEMS.map((item, i) => <ShapRow key={item.name} item={item} i={i} inView={inView} />)}
        </div>
        <div style={{ marginTop: 18, fontSize: 11, color: T.td, fontFamily: T.bodyFont }}>Mean |SHAP value| in SCFI index points, final XGBoost model over all training weeks</div>
      </SpotlightCard>
    </div>
  );
};

/* ============================================================================
   SIGNAL DISTRIBUTION
   ============================================================================ */

const SignalDistribution = ({ activeTab, setActiveTab }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const total = FEAT_CATS.reduce((sum, c) => sum + c.count, 0);
  const maxCount = Math.max(...FEAT_CATS.map((c) => c.count));

  return (
    <div ref={ref}>
      <SpotlightCard style={{ padding: "24px 26px" }} accent={T.violet}>
        <SectionLabel>Signal Distribution by Category</SectionLabel>

        {/* composition bar */}
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 22, border: `1px solid ${T.border}` }}>
          {FEAT_CATS.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ width: 0 }} animate={{ width: inView ? `${(c.count / total) * 100}%` : 0 }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
              onClick={() => setActiveTab(c.key)}
              style={{ background: c.color, opacity: activeTab === c.key ? 1 : 0.55, cursor: "pointer", transition: "opacity .2s" }}
            />
          ))}
        </div>

        {FEAT_CATS.map((c) => {
          const isActive = activeTab === c.key;
          return (
            <div
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, cursor: "pointer", padding: "4px 8px", margin: "0 -8px 8px", borderRadius: 8, background: isActive ? "rgba(255,255,255,.035)" : "transparent", transition: "background .2s" }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0, boxShadow: `0 0 6px ${c.color}88` }} />
              <span style={{ fontSize: 13, color: isActive ? T.t1 : T.t2, flex: 1, fontFamily: T.bodyFont, fontWeight: isActive ? 700 : 400 }}>{c.label}</span>
              <span style={{ fontFamily: T.displayFont, fontSize: 18, fontWeight: 700, color: c.color }}>{c.count}</span>
              <div style={{ width: 80, height: 4, background: "rgba(255,255,255,.05)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: inView ? `${(c.count / maxCount) * 100}%` : 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ height: "100%", background: c.color, borderRadius: 2 }} />
              </div>
            </div>
          );
        })}

        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12.5, color: T.tm, fontFamily: T.bodyFont }}>Total engineered market signals</span>
          <span style={{ fontFamily: T.displayFont, fontSize: 22, fontWeight: 800, color: T.t1 }}>{useCountUp(total, inView, 1.2)}</span>
        </div>
      </SpotlightCard>
    </div>
  );
};

/* ============================================================================
   DATA ENGINEERING STANDARDS
   ============================================================================ */

const DataStandards = () => (
  <SpotlightCard style={{ padding: "24px 26px" }} accent={T.amber}>
    <SectionLabel>Data Engineering Standards</SectionLabel>
    {DATA_STANDARDS.map(({ label, val, color }) => (
      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <span style={{ fontSize: 13, color: T.tm, fontFamily: T.bodyFont }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, background: `${color}14`, border: `1px solid ${color}30`, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap", fontFamily: T.bodyFont }}>{val}</span>
      </div>
    ))}
  </SpotlightCard>
);

/* ============================================================================
   FOOTER
   ============================================================================ */

const Footer = ({ navigate }) => (
  <footer style={{ borderTop: `1px solid ${T.border}`, background: "rgba(255,255,255,.02)", position: "relative" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.displayFont, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontSize: 13, color: T.tm }}>Fretra</span>
        <span style={{ color: T.border }}>·</span>
        <span style={{ fontSize: 12.5, color: T.td, fontFamily: T.bodyFont }}>SCFI Forecasting Intelligence Platform</span>
      </div>
      <span style={{ fontSize: 12.5, color: T.td, fontFamily: T.bodyFont }}>Built with XGBoost, FastAPI, React, Supabase</span>
      <span style={{ fontSize: 12.5, color: T.td, fontFamily: T.bodyFont }}>FYP, Universiti Teknologi PETRONAS</span>
    </div>
  </footer>
);

/* ============================================================================
   ROOT
   ============================================================================ */

export default function FeaturesPage() {
  const navigate = useNavigate();
  const go = useCallback(() => navigate("/login"), [navigate]);
  const [activeTab, setActiveTab] = useState("price");
  const cat = FEAT_CATS.find((c) => c.key === activeTab);
  const { x, y } = usePointer();
  useLenisScroll({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3), respectReducedMotion: true });

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: T.t1, fontFamily: T.bodyFont, overflowX: "hidden" }}>
      <AuroraField />
      <CursorGlow x={x} y={y} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <SiteHeader active="Features" />
        <Hero mx={x} my={y} />
        <CategorySelector activeTab={activeTab} setActiveTab={setActiveTab} />
        <FeatureDetail cat={cat} />

        <Sec style={{ paddingTop: 8 }}>
          <Reveal style={{ marginBottom: 32 }}>
            <SectionLabel accent="#7d97fa">Model Interpretability</SectionLabel>
            <H2>From Signal to Decision</H2>
            <p style={{ color: T.tm, fontSize: 14.5, margin: 0, maxWidth: 640, lineHeight: 1.7, fontFamily: T.bodyFont }}>
              Every engineered signal above feeds into the model. SHAP attribution then traces each forecast back to the exact drivers that produced it, closing the loop between feature engineering and commercial trust.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            <Reveal><ShapChart /></Reveal>
            <Reveal delay={0.1} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SignalDistribution activeTab={activeTab} setActiveTab={setActiveTab} />
              <DataStandards />
            </Reveal>
          </div>
        </Sec>

        <Footer navigate={navigate} />
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .mag-btn { background: none; border: none; padding: 0; font: inherit; cursor: pointer; }
        .gradient-flow { animation: gradientFlow 6s ease infinite; }
        @keyframes gradientFlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .dot-pulse { animation: dotPulse 2s infinite; }
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        ::selection { background: rgba(139,92,246,.35); }
        @media (max-width: 1024px) {
          section > div > div[style*="repeat(5,1fr)"] { grid-template-columns: repeat(3,1fr) !important; }
          section > div > div > div[style*="repeat(3,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          section > div > div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          section { padding-left: 22px !important; padding-right: 22px !important; }
          section > div > div[style*="repeat(5,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          section > div > div > div[style*="repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}