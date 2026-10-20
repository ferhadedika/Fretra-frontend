import { useEffect, useRef, useState, useMemo, useCallback, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useInView } from "framer-motion";
import { useLenisScroll } from "./components/ui/fx";
import LOGO_FULL from "./assets/logo-full.png";
import LOGO_ICON from "./assets/logo-icon.png";

/* ============================================================================
   DATA — unchanged from the original. Content is never simplified or removed.
   ============================================================================ */

const STATS = [
  { value: "10", suffix: "+", label: "Years of SCFI Historical Data" },
  { value: "2.52", suffix: "%", label: "Best Forecast Accuracy (MAPE)" },
  { value: "12", suffix: "W", label: "Forward Forecast Horizon" },
  { value: "0.997", suffix: "", label: "XGBoost Model Precision (R²)" },
];

// Cross-validated metrics from backend/SCFI_model_metrics.json - re-sync on retrain.
const MODELS = [
  { id: "XGBoost", mape: "2.52%", r2: "0.997", mapeN: 97.5, r2N: 99.7, color: "#4f6ef7", violet: "rgba(79,110,247,.15)", desc: "Optuna-tuned · 1,325 estimators", best: true },
  { id: "Ensemble", mape: "2.64%", r2: "0.997", mapeN: 97.4, r2N: 99.7, color: "#8b5cf6", violet: "rgba(139,92,246,.15)", desc: "Scipy-optimised weights" },
  { id: "LSTM", mape: "3.89%", r2: "0.993", mapeN: 96.1, r2N: 99.3, color: "#10b77f", violet: "rgba(16,183,127,.15)", desc: "Deep recurrent network" },
  { id: "Random Forest", mape: "2.74%", r2: "0.996", mapeN: 97.3, r2N: 99.6, color: "#f59e0b", violet: "rgba(245,158,11,.15)", desc: "30-iter randomised search" },
  { id: "SARIMAX", mape: "3.28%", r2: "0.996", mapeN: 96.7, r2N: 99.6, color: "#06b6d4", violet: "rgba(6,182,212,.15)", desc: "ARIMA(1,1,1) with macro drivers" },
];

const FEATURES = [
  { svgPath: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", title: "Predictive Forecast Engine", desc: "Four production-grade models — XGBoost, Random Forest, LSTM, and SARIMAX — validated through rigorous walk-forward cross-validation with zero data leakage." },
  { svgPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", title: "Real-Time Baseline Benchmarking", desc: "Naïve, moving average, exponentially weighted, and seasonal baseline models computed live from Supabase for instant performance comparison." },
  { svgPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Transparent Forecast Drivers", desc: "SHAP interpretability at every prediction level — understand exactly which market signals are driving each freight rate forecast before committing to a decision." },
  { svgPath: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z M9 4v3 M15 4v3", title: "A Decade of Market Intelligence", desc: "Historical Shanghai Containerized Freight Index data from 2016, enriched with Brent crude oil, Global PMI, CNY/USD exchange rates, and international trade volume." },
  { svgPath: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", title: "Automated Hyperparameter Optimisation", desc: "100-trial Bayesian search via Optuna, tuned across all cross-validation folds, delivering peak out-of-sample performance without manual intervention." },
  { svgPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", title: "Purpose-Built for Container Freight", desc: "Engineered specifically for the Shanghai Containerized Freight Index — the industry's most widely referenced benchmark for global container shipping rates." },
];

const PIPELINE = [
  { label: "SCFI Market Data", sub: "Weekly index ingestion", color: "#4f6ef7" },
  { label: "Feature Engineering", sub: "68 market signals", color: "#8b5cf6" },
  { label: "Validation Protocol", sub: "Walk-forward CV", color: "#ec4899" },
  { label: "Model Training", sub: "XGB / RF / SARIMAX / LSTM", color: "#f59e0b" },
  { label: "Ensemble Optimisation", sub: "Scipy weight blending", color: "#10b77f" },
  { label: "12-Week Forecast", sub: "Live actionable output", color: "#4f6ef7" },
];

const WHY = [
  "Differenced target variable with cumulative-sum reconstruction eliminates look-ahead bias",
  "Market regime detection via 52-week Z-score and distance from historical highs and lows",
  "Cross-market interaction features: Brent × PMI, Brent × CNY, Trade Volume × PMI signals",
  "SHAP attribution values at every forecast horizon for full commercial explainability",
];

// Static snapshot of a real rolling-forecast run (data through 2026-07-03,
// generated 2026-09-08) - this card does not fetch live data, so update
// these alongside SNAPSHOT_W1 when refreshing marketing numbers.
const SNAPSHOT_W1 = { ensemble: "3,393", asOf: "data to 3 Jul 2026" };
const BASELINES = [
  { label: "XGBoost", val: "3,412", color: "#4f6ef7" },
  { label: "Random Forest", val: "3,408", color: "#f59e0b" },
  { label: "SARIMAX", val: "3,341", color: "#06b6d4" },
  { label: "LSTM", val: "3,298", color: "#10b77f" },
];

const NAV_LINKS = [
  { label: "Models", path: "/models", id: "models" },
  { label: "Pipeline", path: "/pipeline", id: "pipeline" },
  { label: "Features", path: "/features", id: "features" },
  { label: "About", path: "/about", id: "why" },
];

/* ============================================================================
   DESIGN TOKENS
   ============================================================================ */

const T = {
  bg: "#08090c",
  bgDeep: "#050506",
  bgCard: "rgba(255,255,255,.035)",
  bgCardSolid: "#12131a",
  bgRaised: "#181a22",
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
  r: "10px",
  r2: "16px",
  r3: "22px",
  glass: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
  shCard: "0 1px 0 rgba(255,255,255,.05) inset, 0 12px 40px -18px rgba(0,0,0,.75)",
  shHover: "0 1px 0 rgba(255,255,255,.08) inset, 0 24px 70px -20px rgba(0,0,0,.85)",
  displayFont: "'Barlow Condensed','Barlow',sans-serif",
  bodyFont: "'Inter','Barlow',sans-serif",
};

const EASE = [0.16, 1, 0.3, 1];

/* ============================================================================
   LOW-LEVEL HOOKS
   ============================================================================ */

/** Tracks pointer position in viewport space, rAF-throttled. */
function usePointer() {
  const x = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const y = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  useEffect(() => {
    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
        raf = null;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);
  return { x, y };
}

const LenisCtx = createContext(null);

function scrollToId(lenisRef, id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisRef?.current) lenisRef.current.scrollTo(el, { offset: -84, duration: 1.2 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/** Fires a count-up animation once the element scrolls into view. */
function useCountUp(rawValue, inView, duration = 1.4) {
  const numeric = parseFloat(String(rawValue).replace(/,/g, ""));
  const decimals = (String(rawValue).split(".")[1] || "").length;
  const [display, setDisplay] = useState(isNaN(numeric) ? rawValue : (0).toFixed(decimals));
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current || isNaN(numeric)) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay((numeric * eased).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
      else setDisplay(numeric.toFixed(decimals));
    };
    requestAnimationFrame(tick);
  }, [inView, numeric, decimals, duration]);
  return isNaN(numeric) ? rawValue : display;
}

/* ============================================================================
   AMBIENT BACKGROUND — aurora mesh, blobs, animated grid, noise, particles
   ============================================================================ */

const AuroraField = () => {
  const particles = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.4,
      dur: 14 + Math.random() * 18,
      delay: -Math.random() * 20,
      drift: 40 + Math.random() * 80,
      op: 0.15 + Math.random() * 0.35,
    })),
    []
  );

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* base */}
      <div style={{ position: "absolute", inset: 0, background: T.bg }} />

      {/* animated mesh / aurora gradients */}
      <motion.div
        style={{
          position: "absolute", top: "-30%", left: "-10%", width: "70%", height: "80%",
          background: "radial-gradient(circle at 30% 30%, rgba(79,110,247,.16), transparent 60%)",
          filter: "blur(10px)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 30, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{
          position: "absolute", top: "-10%", right: "-15%", width: "60%", height: "70%",
          background: "radial-gradient(circle at 70% 30%, rgba(139,92,246,.14), transparent 60%)",
          filter: "blur(10px)",
        }}
        animate={{ x: [0, -30, 20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{
          position: "absolute", bottom: "-25%", left: "20%", width: "55%", height: "60%",
          background: "radial-gradient(circle, rgba(16,183,127,.10), transparent 65%)",
          filter: "blur(10px)",
        }}
        animate={{ x: [0, 25, -15, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* animated grid */}
      <motion.div
        style={{
          position: "absolute", inset: -2,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 80%)",
        }}
        animate={{ backgroundPosition: ["0px 0px", "64px 64px"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            background: "#9fb0ff", opacity: p.op,
            boxShadow: "0 0 6px rgba(159,176,255,.8)",
          }}
          animate={{ y: [0, -p.drift, 0], opacity: [p.op, p.op * 1.6, p.op] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* film grain / noise */}
      <div
        style={{
          position: "absolute", inset: 0, opacity: 0.045, mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 60% at 50% 0%, transparent 40%, #08090c 100%)" }} />
    </div>
  );
};

/** Soft glow that follows the cursor across the whole page. */
const CursorGlow = ({ x, y }) => {
  const gx = useTransform(x, (v) => v - 260);
  const gy = useTransform(y, (v) => v - 260);
  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed", top: 0, left: 0, width: 520, height: 520, zIndex: 1,
        borderRadius: "50%", pointerEvents: "none", mixBlendMode: "plus-lighter",
        background: "radial-gradient(circle, rgba(79,110,247,.10), rgba(139,92,246,.05) 45%, transparent 72%)",
        x: gx, y: gy,
      }}
    />
  );
};

/* ============================================================================
   PRIMITIVES
   ============================================================================ */

const Reveal = ({ children, delay = 0, y = 22, style }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, delay, ease: EASE }}
    style={style}
  >
    {children}
  </motion.div>
);

const Stagger = ({ children, gap = 0.07, style }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
    variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    style={style}
  >
    {children}
  </motion.div>
);

const staggerItem = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Glass card with a cursor-tracking spotlight + animated gradient border. */
const SpotlightCard = ({ children, style, accent = T.blue, glow = true, className }) => {
  const ref = useRef(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const [hov, setHov] = useState(false);

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  const bg = useTransform([mx, my], ([mxv, myv]) =>
    `radial-gradient(340px circle at ${mxv}% ${myv}%, ${accent}22, transparent 70%)`
  );

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        position: "relative", overflow: "hidden", borderRadius: T.r2,
        background: T.glass, backdropFilter: "blur(18px)",
        border: `1px solid ${hov ? "rgba(255,255,255,.18)" : T.border}`,
        boxShadow: hov ? T.shHover : T.shCard,
        transition: "border-color .25s, box-shadow .3s",
        ...style,
      }}
    >
      {glow && (
        <motion.div
          aria-hidden
          style={{ position: "absolute", inset: 0, opacity: hov ? 1 : 0, transition: "opacity .3s", background: bg, pointerEvents: "none" }}
        />
      )}
      <div style={{ position: "absolute", top: 0, left: 14, right: 14, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</div>
    </motion.div>
  );
};

/** Magnetic, glowing, rippling primary/secondary button. */
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
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onClick={onClick}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className="mag-btn"
    >
      <span
        style={{
          position: "relative", display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: T.bodyFont, fontWeight: 700, fontSize: big ? 16 : 14.5,
          padding: big ? "16px 36px" : "12px 26px", borderRadius: 999,
          color: primary ? "#08090c" : T.t1,
          background: primary
            ? "linear-gradient(135deg,#8fb0ff,#5f7dfb 45%,#9c7bfa)"
            : "rgba(255,255,255,.04)",
          border: primary ? "1px solid rgba(255,255,255,.5)" : `1px solid ${T.borderH}`,
          boxShadow: primary
            ? "0 0 0 1px rgba(79,110,247,.4), 0 10px 30px -8px rgba(79,110,247,.55), 0 2px 10px rgba(0,0,0,.4)"
            : "none",
          overflow: "hidden", cursor: "pointer", whiteSpace: "nowrap",
          ...style,
        }}
      >
        {children}
        {ripples.map((rp) => (
          <motion.span
            key={rp.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={{
              position: "absolute", left: rp.left, top: rp.top, width: 16, height: 16,
              marginLeft: -8, marginTop: -8, borderRadius: "50%",
              background: primary ? "rgba(8,9,12,.35)" : "rgba(255,255,255,.35)",
              pointerEvents: "none",
            }}
          />
        ))}
      </span>
    </motion.button>
  );
};

const Eyebrow = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(79,110,247,.08)", border: "1px solid rgba(79,110,247,.28)",
      borderRadius: 999, padding: "6px 16px 6px 12px",
      fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
      color: "#9db3fb", marginBottom: 22, fontFamily: T.bodyFont,
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue, boxShadow: "0 0 8px #4f6ef7", display: "inline-block" }} className="dot-pulse" />
    {children}
  </motion.div>
);

const SectionLabel = ({ children, accent = T.td }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: accent, marginBottom: 14, fontFamily: T.bodyFont }}>
    {children}
  </div>
);

const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily: T.displayFont, fontSize: "clamp(30px,4vw,44px)", fontWeight: 800, margin: "0 0 12px", color: T.t1, lineHeight: 1.08, letterSpacing: -0.5, ...style }}>
    {children}
  </h2>
);

const Sec = ({ children, style, id }) => (
  <section id={id} style={{ padding: "128px 48px", position: "relative", ...style }}>
    <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>{children}</div>
  </section>
);

/* ============================================================================
   NAV
   ============================================================================ */

const Nav = ({ go, lenisRef }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState("hero");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["hero", "stats", "features", "models", "pipeline", "why", "cta"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? "rgba(8,9,12,.78)" : "rgba(8,9,12,.4)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        padding: "0 32px", height: 68,
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
        transition: "background .3s, border-color .3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13, justifySelf: "start", cursor: "pointer" }}
        onClick={() => scrollToId(lenisRef, "hero")}
      >
        <img src={LOGO_ICON} alt="Fretra" style={{ height: 40, width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(79,110,247,.5))" }} onError={(e) => (e.target.style.display = "none")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{
            fontFamily: T.displayFont, fontSize: 19, fontWeight: 800, letterSpacing: 2.2, lineHeight: 1, textTransform: "uppercase",
            background: "linear-gradient(90deg, #edeef2 0%, #b9c3ff 55%, #d9b8ff 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            FRETRA
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2.6, color: T.td, textTransform: "uppercase", lineHeight: 1 }}>SCFI Rate Forecasting Engine</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 2, justifySelf: "center", position: "relative", background: "rgba(255,255,255,.03)", border: `1px solid ${T.border}`, borderRadius: 999, padding: 4 }}>
        {NAV_LINKS.map((l) => (
          <button
            key={l.label}
            onClick={() => { scrollToId(lenisRef, l.id); }}
            onDoubleClick={() => navigate(l.path)}
            style={{
              position: "relative", background: "none", border: "none", padding: "7px 16px", borderRadius: 999,
              color: active === l.id ? T.t1 : T.tm, fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: T.bodyFont, transition: "color .2s", zIndex: 1,
            }}
          >
            {active === l.id && (
              <motion.span
                layoutId="nav-pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{ position: "absolute", inset: 0, borderRadius: 999, background: "rgba(255,255,255,.08)", border: `1px solid ${T.borderH}`, zIndex: -1 }}
              />
            )}
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ justifySelf: "end" }}>
        <MagButton onClick={go}>Launch App →</MagButton>
      </div>
    </motion.nav>
  );
};

/* ============================================================================
   HERO — signature interactive visualization: converging market signals
   ============================================================================ */

const HeroVisual = ({ mx, my }) => {
  const canvasRef = useRef(null);
  const tickRef = useRef(0);
  const px = useTransform(mx, (v) => (typeof window !== "undefined" ? (v / window.innerWidth - 0.5) * -14 : 0));
  const py = useTransform(my, (v) => (typeof window !== "undefined" ? (v / window.innerHeight - 0.5) * -10 : 0));
  const spx = useSpring(px, { stiffness: 60, damping: 18 });
  const spy = useSpring(py, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const signals = [
      { amp: [22, 12, 6], freq: [0.05, 0.09, 0.15], speed: [0.018, 0.03, 0.05], color: "rgba(79,110,247,.55)", lw: 2, yOff: 0.32 },
      { amp: [16, 9, 5], freq: [0.06, 0.11, 0.18], speed: [0.015, 0.026, 0.045], color: "rgba(139,92,246,.4)", lw: 1.6, yOff: 0.46 },
      { amp: [12, 7, 4], freq: [0.07, 0.13, 0.2], speed: [0.02, 0.035, 0.05], color: "rgba(16,183,127,.32)", lw: 1.4, yOff: 0.58 },
      { amp: [9, 5, 3], freq: [0.08, 0.15, 0.22], speed: [0.022, 0.038, 0.06], color: "rgba(245,158,11,.28)", lw: 1.2, yOff: 0.68 },
    ];

    let raf;
    const render = () => {
      tickRef.current += 1;
      const t = tickRef.current;
      ctx.clearRect(0, 0, W, H);
      const convergeX = W * 0.72;

      signals.forEach((s) => {
        const baseY = H * s.yOff;
        ctx.beginPath();
        const pts = 90;
        for (let i = 0; i <= pts; i++) {
          const x = (i / pts) * W;
          const damp = x < convergeX ? 1 : Math.max(0, 1 - (x - convergeX) / (W - convergeX));
          const y =
            baseY * (0.4 + 0.6 * damp) + (H * 0.5 - baseY * (0.4 + 0.6 * damp)) * (1 - damp) +
            (Math.sin(i * s.freq[0] + t * s.speed[0]) * s.amp[0] +
              Math.sin(i * s.freq[1] + t * s.speed[1]) * s.amp[1] +
              Math.sin(i * s.freq[2] + t * s.speed[2]) * s.amp[2]) * damp;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.lw;
        ctx.stroke();
      });

      // converged forecast line
      const endY = H * 0.5;
      ctx.beginPath();
      for (let x = convergeX; x <= W; x += 2) {
        const p = (x - convergeX) / (W - convergeX);
        const y = endY + Math.sin(p * 8 + t * 0.05) * 3 * (1 - p);
        x === convergeX ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(convergeX, 0, W, 0);
      grad.addColorStop(0, "rgba(79,110,247,0)");
      grad.addColorStop(0.3, "rgba(79,110,247,.9)");
      grad.addColorStop(1, "rgba(159,176,255,1)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // pulsing endpoint node
      const pulse = 4 + Math.sin(t * 0.06) * 1.6;
      ctx.beginPath();
      ctx.arc(W - 10, endY, pulse + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(79,110,247,.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W - 10, endY, pulse, 0, Math.PI * 2);
      ctx.fillStyle = "#c8d3ff";
      ctx.shadowColor = "#4f6ef7";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <motion.div style={{ x: spx, y: spy, position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </motion.div>
  );
};

const Hero = ({ go, mx, my }) => {
  const { scrollYProgress } = useScroll();
  const heroFade = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, 60]);

  return (
    <section id="hero" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <HeroVisual mx={mx} my={my} />

      <div style={{ position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)", width: 780, height: 620, background: "radial-gradient(ellipse,rgba(79,110,247,.14) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-14%", right: "-8%", width: 560, height: 560, background: "radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 65%)", pointerEvents: "none" }} />

      <motion.div style={{ opacity: heroFade, y: heroY, position: "relative", zIndex: 2, textAlign: "center", maxWidth: 860, padding: "0 24px", marginTop: 40 }}>
        

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}
        >
          <img src={LOGO_FULL} alt="Fretra" style={{ height: "clamp(150px, 16vw, 210px)", width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 56px rgba(79,110,247,.6))" }} onError={(e) => (e.target.style.display = "none")} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          style={{ fontFamily: T.displayFont, fontSize: "clamp(46px,7.5vw,88px)", fontWeight: 800, lineHeight: 1.02, margin: "0 0 24px", letterSpacing: -2, color: T.t1 }}
        >
          Predict Container<br />
          <span style={{ background: "linear-gradient(90deg,#6f8bff,#a78bfa 55%,#6f8bff)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "inline-block" }} className="gradient-flow">
            Freight Rates
          </span><br />
          with Machine Learning
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          style={{ fontSize: 17, color: T.t2, lineHeight: 1.75, maxWidth: 600, margin: "0 auto 40px", fontFamily: T.bodyFont }}
        >
          Fretra converges a decade of SCFI market data, Brent crude, PMI, CNY/USD, World Trade Volume & Seasonal Dummies into
          a 12-week ensemble forecast, with SHAP-level transparency behind every prediction.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}
        >
          <MagButton onClick={go} big>Launch Fretra →</MagButton>
          
        </motion.div>

        {/* trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", fontFamily: T.bodyFont }}
        >
          {[
            ["XGBoost · RF · LSTM · SARIMAX", T.blue],
            ["Zero look-ahead bias", T.green],
            ["SHAP-explainable", T.violet],
            ["Walk-forward validated", T.amber],
          ].map(([label, c]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.tm, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}` }} />
              {label}
            </div>
          ))}
        </motion.div>
      </motion.div>

      
    </section>
  );
};

/* ============================================================================
   STATS — animated counters, glass cards, hover glow
   ============================================================================ */

const StatCard = ({ value, suffix, label, i }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const display = useCountUp(value, inView);
  return (
    <motion.div ref={ref} variants={staggerItem}>
      <SpotlightCard style={{ padding: "38px 26px", textAlign: "center", height: "100%" }} accent={[T.blue, T.violet, T.green, T.amber][i % 4]}>
        <div style={{ fontFamily: T.displayFont, fontSize: 46, fontWeight: 800, color: T.t1, lineHeight: 1, letterSpacing: -1 }}>
          {display}<span style={{ fontSize: 26, color: T.blueSoft }}>{suffix}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: T.td, marginTop: 12, fontFamily: T.bodyFont }}>{label}</div>
      </SpotlightCard>
    </motion.div>
  );
};

const Stats = () => (
  <section id="stats" style={{ padding: "0 48px", position: "relative" }}>
    <div style={{ maxWidth: 1160, margin: "-64px auto 0" }}>
      <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {STATS.map((s, i) => <StatCard key={s.label} {...s} i={i} />)}
      </Stagger>
    </div>
  </section>
);

/* ============================================================================
   BANNERS (kept, restyled)
   ============================================================================ */

const Banner = ({ src, height, children }) => (
  <div style={{ position: "relative", height, overflow: "hidden" }}>
    <motion.img
      src={src} alt=""
      initial={{ scale: 1.1 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, ease: EASE }}
      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.22, filter: "saturate(0.7) contrast(1.05)" }}
    />
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom,${T.bg} 0%,transparent 28%,transparent 72%,${T.bg} 100%)` }} />
    {children}
  </div>
);

/* ============================================================================
   FEATURES — spotlight cards, icon containers, typography hierarchy
   ============================================================================ */

const FeatureIcon = ({ path }) => (
  <div style={{
    width: 46, height: 46, borderRadius: 12,
    background: "linear-gradient(145deg, rgba(79,110,247,.16), rgba(139,92,246,.08))",
    border: "1px solid rgba(79,110,247,.28)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 20, flexShrink: 0,
    boxShadow: "0 4px 18px -6px rgba(79,110,247,.4)",
  }}>
    <svg width="21" height="21" fill="none" stroke="#8fa4ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  </div>
);

const Features = ({ navigate }) => (
  <Sec id="features" style={{ background: "linear-gradient(180deg,rgba(79,110,247,.04) 0%,transparent 40%)" }}>
    <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
      <SectionLabel>Capabilities</SectionLabel>
      <H2>Everything Your Business Needs</H2>
      <p style={{ color: T.tm, fontSize: 15, margin: "8px 0 0", fontFamily: T.bodyFont }}>Enterprise-grade forecasting tools built for shipping professionals and analysts</p>
    </Reveal>
    <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
      {FEATURES.map((f) => (
        <motion.div key={f.title} variants={staggerItem}>
          <SpotlightCard style={{ padding: "28px 26px" }}>
            <FeatureIcon path={f.svgPath} />
            <div style={{ fontSize: 15.5, fontWeight: 700, color: T.t1, marginBottom: 10, fontFamily: T.bodyFont, letterSpacing: -0.2 }}>{f.title}</div>
            <div style={{ fontSize: 13.5, color: T.tm, lineHeight: 1.7, fontFamily: T.bodyFont }}>{f.desc}</div>
          </SpotlightCard>
        </motion.div>
      ))}
    </Stagger>
    <Reveal style={{ textAlign: "center", marginTop: 48 }}>
      <MagButton onClick={() => navigate("/features")}>Explore All Features →</MagButton>
    </Reveal>
  </Sec>
);

/* ============================================================================
   MODEL COMPARISON — expand-on-hover, animated bars, best-model emphasis
   ============================================================================ */

const ModelBar = ({ pct, color, inView, label, value }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <span style={{ fontSize: 11.5, color: T.tm, fontFamily: T.bodyFont }}>{label}</span>
      <span style={{ fontFamily: T.displayFont, fontSize: 20, fontWeight: 700, color: T.t1 }}>{value}</span>
    </div>
    <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: inView ? `${pct}%` : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 10px ${color}88` }}
      />
    </div>
  </div>
);

const ModelCard = ({ m }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [hov, setHov] = useState(false);

  return (
    <motion.div ref={ref} variants={staggerItem} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <SpotlightCard
        accent={m.color}
        style={{
          padding: "28px 22px",
          border: m.best ? `1px solid ${m.color}55` : `1px solid ${T.border}`,
          boxShadow: m.best ? `0 0 0 1px ${m.color}33, 0 20px 50px -20px ${m.color}55` : T.shCard,
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />
        {m.best && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
            style={{ position: "absolute", top: 14, right: 14, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", background: m.violet, color: m.color, border: `1px solid ${m.color}55`, padding: "3px 8px", borderRadius: 6 }}
          >Best</motion.div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", color: m.color, marginBottom: 20, fontFamily: T.bodyFont }}>{m.id}</div>

        <ModelBar pct={m.mapeN} color={m.color} inView={inView} label="MAPE" value={m.mape} />
        <ModelBar pct={m.r2N} color={m.color} inView={inView} label="R²" value={m.r2} />

        <div style={{ height: 1, background: T.border, margin: "6px 0 14px" }} />
        <div style={{ fontSize: 12, color: T.td, fontFamily: T.bodyFont }}>{m.desc}</div>

        <AnimatePresence>
          {hov && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 14 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ fontSize: 11.5, color: T.t2, lineHeight: 1.6, borderTop: `1px dashed ${T.border}`, paddingTop: 12, fontFamily: T.bodyFont }}>
                Validated across 5-fold expanding walk-forward cross-validation with zero look-ahead bias on held-out SCFI windows.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SpotlightCard>
    </motion.div>
  );
};

const Models = ({ navigate }) => (
  <Sec id="models">
    <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
      <SectionLabel>Model Performance</SectionLabel>
      <H2>Four Models, One Ensemble</H2>
      <p style={{ color: T.tm, fontSize: 15, margin: 0, fontFamily: T.bodyFont }}>5-fold expanding walk-forward cross-validation · Zero look-ahead bias</p>
    </Reveal>
    <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 18 }}>
      {MODELS.map((m) => <ModelCard key={m.id} m={m} />)}
    </Stagger>
    <Reveal style={{ textAlign: "center", marginTop: 48 }}>
      <MagButton onClick={() => navigate("/models")}>Explore All Models →</MagButton>
    </Reveal>
  </Sec>
);

/* ============================================================================
   PIPELINE — interactive horizontal timeline, scroll-triggered progression
   ============================================================================ */

const Pipeline = ({ navigate }) => {
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 75%", "end 60%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Sec id="pipeline" style={{ background: "linear-gradient(180deg,transparent,rgba(139,92,246,.045) 50%,transparent)" }}>
      <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
        <SectionLabel>Architecture</SectionLabel>
        <H2>Analytical Intelligence Pipeline</H2>
        <p style={{ color: T.tm, fontSize: 15, margin: "8px 0 0", fontFamily: T.bodyFont }}>From raw market data to actionable freight rate intelligence</p>
      </Reveal>

      <div ref={trackRef} style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 55, height: 2, background: "rgba(255,255,255,.06)", borderRadius: 2 }} />
        <motion.div
          style={{ position: "absolute", left: 0, right: 0, top: 55, height: 2, borderRadius: 2, transformOrigin: "left", scaleX: lineScale, background: "linear-gradient(90deg,#4f6ef7,#8b5cf6,#ec4899,#f59e0b,#10b77f,#4f6ef7)" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${PIPELINE.length},1fr)`, gap: 14 }}>
          {PIPELINE.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.09, ease: EASE }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ position: "relative" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09 + 0.15, type: "spring" }}
                  style={{ width: 12, height: 12, borderRadius: "50%", background: step.color, margin: "50px auto 18px", boxShadow: `0 0 14px ${step.color}`, border: "2px solid #08090c" }}
                />
                <SpotlightCard accent={step.color} style={{ padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t2, marginBottom: 5, fontFamily: T.bodyFont }}>{step.label}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: T.td, fontFamily: T.bodyFont }}>{step.sub}</div>
                </SpotlightCard>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <Reveal style={{ textAlign: "center", marginTop: 52 }}>
        <MagButton onClick={() => navigate("/pipeline")}>View Full Pipeline →</MagButton>
      </Reveal>
    </Sec>
  );
};

/* ============================================================================
   WHY FRETRA + live chart card
   ============================================================================ */

const LiveChartCard = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const pathD = "M0,90 C 20,86 30,80 40,78 C 55,75 65,70 80,66 C 95,62 105,58 120,54 C 135,50 145,47 160,44 C 175,41 185,40 200,38 C 215,36 225,34 240,32 C 255,30 265,29 280,28 C 295,27 305,24 320,22 C 330,20.5 335,19 340,18";

  return (
    <div ref={ref}>
      <SpotlightCard style={{ padding: 26 }} accent={T.blue}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.td, marginBottom: 6, fontFamily: T.bodyFont }}>
          Latest Ensemble W+1 Forecast · {SNAPSHOT_W1.asOf}
        </div>
        <div style={{ fontFamily: T.displayFont, fontSize: 36, fontWeight: 800, color: T.t1, marginBottom: 22, letterSpacing: -0.5 }}>
          {SNAPSHOT_W1.ensemble} <span style={{ fontSize: 16, color: T.tm, fontWeight: 400, fontFamily: T.bodyFont }}>SCFI pts</span>
        </div>
        <svg viewBox="0 0 340 110" style={{ width: "100%", height: "auto", overflow: "visible" }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4f6ef7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={`${pathD} L340,110 L0,110 Z`}
            fill="url(#chartGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          />
          <motion.path
            d={pathD}
            fill="none" stroke="#6f8bff" strokeWidth="2.4" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(111,139,255,.6))" }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 1.6, ease: EASE }}
          />
          <motion.circle
            cx="340" cy="18" r="4.5" fill="#c8d3ff"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0 }}
            transition={{ delay: 1.5, type: "spring" }}
            style={{ filter: "drop-shadow(0 0 8px #4f6ef7)" }}
          />
          <motion.circle
            cx="340" cy="18" r="4.5" fill="none" stroke="#4f6ef7" strokeWidth="1.5"
            initial={{ r: 4.5, opacity: 0.7 }}
            animate={{ r: [4.5, 11, 4.5], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <line x1="0" y1="104" x2="340" y2="104" stroke="rgba(255,255,255,.07)" strokeWidth="1" />
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
          {BASELINES.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 10 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              style={{ background: "rgba(255,255,255,.03)", borderRadius: T.r, padding: "11px 13px", border: `1px solid ${T.border}` }}
            >
              <div style={{ fontSize: 9.5, fontWeight: 700, color: b.color, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4, fontFamily: T.bodyFont }}>{b.label}</div>
              <div style={{ fontFamily: T.displayFont, fontSize: 19, fontWeight: 700, color: T.t1 }}>{b.val}</div>
            </motion.div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
};

const WhyFretra = () => (
  <Sec id="why" style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
      <Reveal>
        <SectionLabel>Why Fretra</SectionLabel>
        <H2 style={{ marginBottom: 16 }}>Built for Commercial<br />Freight Intelligence</H2>
        <p style={{ color: T.tm, fontSize: 15, lineHeight: 1.8, marginBottom: 30, fontFamily: T.bodyFont }}>
          Fretra combines advanced gradient boosting with domain-specific market feature engineering:
          52-week regime signals, Brent crude interactions, PMI momentum, and CNY/USD exchange-rate lags
          — giving freight teams the analytical edge they need.
        </p>
        <Stagger style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {WHY.map((item) => (
            <motion.div key={item} variants={staggerItem} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ color: T.green, fontSize: 15, marginTop: 1, flexShrink: 0, textShadow: "0 0 10px rgba(16,183,127,.6)" }}>✓</span>
              <span style={{ fontSize: 14, color: T.t2, lineHeight: 1.6, fontFamily: T.bodyFont }}>{item}</span>
            </motion.div>
          ))}
        </Stagger>
      </Reveal>

      <Reveal delay={0.15}>
        <LiveChartCard />
      </Reveal>
    </div>
  </Sec>
);

/* ============================================================================
   CTA
   ============================================================================ */

const CTA = ({ go }) => (
  <section id="cta" style={{ padding: "150px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 820, height: 820, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,110,247,.12) 0%,transparent 65%)", pointerEvents: "none" }}
    />
    <Reveal style={{ position: "relative", zIndex: 1 }}>
      <SectionLabel accent="#9db3fb">Get Started</SectionLabel>
      <h2 style={{ fontFamily: T.displayFont, fontSize: "clamp(34px,5.5vw,60px)", fontWeight: 800, margin: "0 0 20px", color: T.t1, letterSpacing: -1 }}>
        Ready to Lead With<br />Freight Intelligence?
      </h2>
      <p style={{ color: T.tm, fontSize: 16, maxWidth: 520, margin: "0 auto 44px", lineHeight: 1.75, fontFamily: T.bodyFont }}>
        Launch the full dashboard and start making data-driven decisions today, live SCFI tracking, 12-week forecasts, and SHAP-powered market insights, all in one place.
      </p>
      <MagButton onClick={go} big>Launch Fretra Dashboard →</MagButton>
    </Reveal>
  </section>
);

/* ============================================================================
   FOOTER
   ============================================================================ */

const Footer = ({ navigate }) => (
  <footer style={{ borderTop: `1px solid ${T.border}`, background: "rgba(255,255,255,.02)", position: "relative" }}>
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 48px 32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img src={LOGO_ICON} alt="Fretra" style={{ height: 30, width: "auto" }} onError={(e) => (e.target.style.display = "none")} />
            <span style={{ fontFamily: T.displayFont, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontSize: 15, color: T.t1 }}>Fretra</span>
          </div>
          <p style={{ fontSize: 13, color: T.tm, lineHeight: 1.7, maxWidth: 280, fontFamily: T.bodyFont }}>
            SCFI Rate Forecasting Engine — machine learning intelligence for global container freight markets.
          </p>
        </div>
        {[
          { h: "Product", items: [["Models", "/models"], ["Features", "/features"], ["Pipeline", "/pipeline"]] },
          { h: "Company", items: [["About", "/about"], ["Login", "/login"]] },
          { h: "Stack", items: [["XGBoost · FastAPI", null], ["React · Supabase", null]] },
        ].map((col) => (
          <div key={col.h}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, marginBottom: 16, fontFamily: T.bodyFont }}>{col.h}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.items.map(([label, path]) => (
                <span
                  key={label}
                  onClick={() => path && navigate(path)}
                  style={{ fontSize: 13.5, color: T.tm, cursor: path ? "pointer" : "default", fontFamily: T.bodyFont, transition: "color .15s" }}
                  onMouseEnter={(e) => path && (e.target.style.color = T.t1)}
                  onMouseLeave={(e) => path && (e.target.style.color = T.tm)}
                >{label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: T.td, fontFamily: T.bodyFont }}>© {new Date().getFullYear()} Fretra. All rights reserved.</span>
        <span style={{ fontSize: 12, color: T.td, fontFamily: T.bodyFont }}>Final Year Project · Universiti Teknologi PETRONAS</span>
      </div>
    </div>
  </footer>
);

/* ============================================================================
   ROOT
   ============================================================================ */

export default function LandingPage() {
  const navigate = useNavigate();
  const go = useCallback(() => navigate("/login"), [navigate]);
  const { x, y } = usePointer();
  const lenisRef = useLenisScroll({
    duration: 1.15,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    wheelMultiplier: 1,
    respectReducedMotion: true,
  });

  return (
    <LenisCtx.Provider value={lenisRef}>
      <div style={{ position: "relative", minHeight: "100vh", color: T.t1, fontFamily: T.bodyFont, overflowX: "hidden" }}>
        <AuroraField />
        <CursorGlow x={x} y={y} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <Nav go={go} lenisRef={lenisRef} />
          <Hero go={go} mx={x} my={y} />
          <Stats />
          <Banner src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1400&q=80" height={300}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", background: "linear-gradient(90deg,#6f8bff,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Powering Commercial Decisions Across
              </div>
              <div style={{ fontFamily: T.displayFont, fontSize: 36, fontWeight: 800, textAlign: "center", color: T.t1, letterSpacing: -0.5 }}>
                Global Container Shipping Markets
              </div>
            </div>
          </Banner>
          <Models navigate={navigate} />
          <Pipeline navigate={navigate} />
          <Banner src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1400&q=80" height={240} />
          <Features navigate={navigate} />
          <WhyFretra />
          <CTA go={go} />
          <Footer navigate={navigate} />
        </div>

        <style>{`
          html { scroll-behavior: auto; }
          * { box-sizing: border-box; }
          .mag-btn { background: none; border: none; padding: 0; font: inherit; cursor: pointer; }
          .gradient-flow { animation: gradientFlow 6s ease infinite; }
          @keyframes gradientFlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
          .dot-pulse { animation: dotPulse 2s infinite; }
          @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
          ::selection { background: rgba(79,110,247,.35); }
          @media (max-width: 1024px) {
            #models > div > div:nth-child(2), #features > div > div:nth-child(2) { grid-template-columns: repeat(2,1fr) !important; }
            #pipeline > div > div:nth-child(2) > div > div { grid-template-columns: repeat(3,1fr) !important; }
          }
          @media (max-width: 720px) {
            section { padding-left: 24px !important; padding-right: 24px !important; }
            #models > div > div:nth-child(2), #features > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
            #why > div > div { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
          }
        `}</style>
      </div>
    </LenisCtx.Provider>
  );
}