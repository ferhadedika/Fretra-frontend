import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import Lenis from "lenis";
import { SiteHeader } from "./components/SiteHeader";

/* ============================== TOKENS ============================== */
const T = {
  bg: "#08090c", bgCard: "#121319", bgRaised: "#191b23",
  border: "#22242e", borderH: "#34384a",
  t1: "#f0f1f5", t2: "#adb2c4", tm: "#767b91", td: "#464a5c",
  blue: "#4f6ef7", violet: "#8b5cf6", green: "#10b77f", amber: "#f59e0b", pink: "#ec4899", red: "#ef4444", cyan: "#06b6d4",
  r: "10px", r2: "16px", r3: "22px",
  display: "'Barlow Condensed',sans-serif",
  body: "'Barlow','Inter',sans-serif",
  mono: "'JetBrains Mono','SF Mono',monospace",
};

const EASE = [0.16, 1, 0.3, 1];

/* ============================== DATA (unchanged) ============================== */
const MODELS = [
  {
    id: "XGBoost", tag: "BEST MODEL", color: T.blue,
    mape: "2.63", mapeSuffix: "%", r2: "0.996", rmse: "61.4", mae: "44.2",
    desc: "Gradient-boosted decision trees fine-tuned through 200 Bayesian optimisation trials across 5 walk-forward validation folds. Delivers the highest predictive accuracy across all performance metrics, making it the primary production-grade forecasting engine.",
    details: [
      { label: "Estimators", val: "540" },
      { label: "Max Depth", val: "6" },
      { label: "Learning Rate", val: "0.042" },
      { label: "Optimiser", val: "Optuna · 200 trials" },
      { label: "Subsample", val: "0.82" },
      { label: "Col Sample", val: "0.74" },
    ],
    barPct: 96,
    curve: [64, 58, 66, 52, 60, 48, 55, 44, 50, 40, 46, 38],
  },
  {
    id: "Ensemble", tag: "PRODUCTION", color: T.violet,
    mape: "2.63", mapeSuffix: "%", r2: "0.996", rmse: "61.2", mae: "43.9",
    desc: "A commercially deployed blend of all four base models - XGBoost, Random Forest, SARIMAX, and LSTM - with weights optimised via SLSQP constrained minimisation to minimise validation MAE, subject to a 10% minimum weight per model. The floor guarantees a genuine multi-model blend rather than letting the optimiser collapse onto a single dominant model, trading a small amount of validation accuracy for robustness against any one model underperforming in a future regime.",
    details: [
      { label: "XGBoost Weight", val: "0.70 (current)" },
      { label: "RF Weight", val: "0.10 (current)" },
      { label: "SARIMAX Weight", val: "0.10 (current)" },
      { label: "LSTM Weight", val: "0.10 (current)" },
      { label: "Optimiser", val: "Scipy SLSQP" },
      { label: "Objective", val: "Minimise Validation MAE" },
      { label: "Constraint", val: "Sum w = 1, w >= 0.10 each" },
    ],
    barPct: 97,
    curve: [60, 57, 61, 50, 58, 47, 53, 43, 49, 39, 45, 37],
  },
  {
    id: "Random Forest", tag: "IN ENSEMBLE", color: T.green,
    mape: "2.86", mapeSuffix: "%", r2: "0.996", rmse: "65.1", mae: "48.3",
    desc: "A bagged ensemble of decision trees with randomised feature subsampling, tuned through 30-iteration randomised search. Contributes meaningful diversification to the production ensemble through independent variance reduction.",
    details: [
      { label: "Estimators", val: "400" },
      { label: "Max Features", val: "sqrt" },
      { label: "Min Samples", val: "2" },
      { label: "Tuner", val: "RandomizedSearchCV" },
      { label: "Iterations", val: "30" },
      { label: "OOB Score", val: "Enabled" },
    ],
    barPct: 88,
    curve: [66, 61, 68, 55, 63, 51, 58, 47, 54, 44, 50, 42],
  },
  {
    id: "LSTM", tag: "IN ENSEMBLE", color: T.amber,
    mape: "4.23", mapeSuffix: "%", r2: "0.992", rmse: "88.6", mae: "71.4",
    desc: "A Long Short-Term Memory deep recurrent network trained on 12-week rolling sequences. Captures non-linear temporal dependencies and cyclical market dynamics that tree-based models may miss, adding complementary signal to the ensemble.",
    details: [
      { label: "Sequence Length", val: "12 Weeks" },
      { label: "Hidden Units", val: "128 -> 64" },
      { label: "Dropout", val: "0.2" },
      { label: "Epochs", val: "200 (Early Stop)" },
      { label: "Batch Size", val: "32" },
      { label: "Optimiser", val: "Adam, lr=1e-3" },
    ],
    barPct: 74,
    curve: [70, 74, 68, 78, 66, 80, 64, 76, 62, 72, 60, 70],
  },
  {
    id: "SARIMAX", tag: "IN ENSEMBLE", color: T.cyan,
    mape: "3.28", mapeSuffix: "%", r2: "0.996", rmse: "82.4", mae: "57.0",
    desc: "Seasonal ARIMA with exogenous macroeconomic variables, expanding-window walk-forward validated alongside the three ML models. Contributes a statistically-grounded, linear-trend perspective to the ensemble, distinct from the tree/deep-learning models' non-linear pattern matching.",
    details: [
      { label: "Order", val: "p=1, d=1, q=1" },
      { label: "Seasonal", val: "P=1, D=1, Q=1, s=52" },
      { label: "Exogenous", val: "PMI, Brent, CNY" },
      { label: "Status", val: "In Ensemble" },
      { label: "In Ensemble", val: "Included (10% weight, floored)" },
      { label: "R2", val: "0.9957" },
    ],
    barPct: 80,
    curve: [58, 63, 55, 66, 52, 68, 49, 70, 46, 72, 43, 74],
  },
];

const CV_FOLDS = [
  { fold: 1, train: "2017-06-16 → 2018-12-14 (79w)", val: "2018-12-21 → 2020-06-19", lstm: "0.769" },
  { fold: 2, train: "2017-06-16 → 2020-06-19 (158w)", val: "2020-06-26 → 2021-12-24", lstm: "0.995" },
  { fold: 3, train: "2017-06-16 → 2021-12-24 (237w)", val: "2021-12-31 → 2023-06-30", lstm: "0.996" },
  { fold: 4, train: "2017-06-16 → 2023-06-30 (316w)", val: "2023-07-07 → 2025-01-03", lstm: "0.976" },
  { fold: 5, train: "2017-06-16 → 2025-01-03 (395w)", val: "2025-01-10 → 2026-07-10", lstm: "0.939" },
];

/* ============================== UTIL: smooth scroll ============================== */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true });
    let raf;
    function loop(time) { lenis.raf(time); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
}

/* ============================== UTIL: animated counter ============================== */
function AnimatedNumber({ value, suffix = "", decimals = 2, style }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (value == null) { setDisplay("—"); return; }
    const num = parseFloat(value);
    const sign = value.toString().startsWith("-") ? -1 : 1;
    const controls = animate(0, num, {
      duration: 1.1, ease: EASE,
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [value]);
  return <span ref={ref} style={style}>{value == null ? "—" : `${display}${suffix}`}</span>;
}

/* ============================== UTIL: spotlight card ============================== */
function SpotlightCard({ children, style, accent, onClick, className }) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);
  return (
    <div
      className={className}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
        background: T.bgCard, border: `1px solid ${hover ? T.borderH : T.border}`,
        borderRadius: T.r2, transition: "border-color .25s, transform .25s, box-shadow .25s",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 14px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04)" : "0 2px 10px rgba(0,0,0,.4)",
        ...style,
      }}
    >
      {hover && (
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.9,
            background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, ${accent || "rgba(79,110,247,.10)"}, transparent 60%)`,
          }}
        />
      )}
      <div style={{ position: "absolute", top: 0, left: 12, right: 12, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

/* ============================== UTIL: magnetic button ============================== */
function MagneticButton({ children, style, onClick, primary }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });
  return (
    <motion.button
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.3);
        y.set((e.clientY - r.top - r.height / 2) * 0.3);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      style={{
         x: sx, y: sy, cursor: "pointer", fontFamily: T.body,
        fontWeight: 700, fontSize: 13.5, borderRadius: 999, padding: "12px 26px",
        background: primary ? `linear-gradient(135deg,${T.blue},${T.violet})` : "transparent",
        color: primary ? "#fff" : T.t2,
      boxShadow: primary ? "0 8px 24px rgba(79,110,247,.35)" : "none",
      border: primary ? "none" : `1px solid ${T.border}`,
  ...style,
}}
    >
      {children}
    </motion.button>
  );
}

/* ============================== HERO: forecast visualization ============================== */
function ForecastHero() {
  const wrapRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 30 });
  const width = 1100, height = 380;

  const paths = useMemo(() => {
    return MODELS.map((m) => {
      const pts = m.curve.map((v, i) => {
        const x = (i / (m.curve.length - 1)) * width;
        const y = 60 + v * 2.1;
        return [x, y];
      });
      const d = pts.reduce((acc, [x, y], i) => acc + (i === 0 ? `M${x},${y}` : ` L${x},${y}`), "");
      return { id: m.id, color: m.color, d };
    });
  }, []);

  return (
    <div
      ref={wrapRef}
      onMouseMove={(e) => {
        const r = wrapRef.current.getBoundingClientRect();
        setGlow({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      style={{ position: "relative", width: "100%", maxWidth: 1100, margin: "0 auto", height, borderRadius: T.r3, overflow: "hidden", border: `1px solid ${T.border}`, background: "rgba(255,255,255,.015)" }}
    >
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, rgba(79,110,247,.14), transparent 60%)`, transition: "background .1s" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 100%)" }} />
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ position: "relative" }}>
        <defs>
          <linearGradient id="fadeMask" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="15%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
        </defs>
        {paths.map((p, i) => (
          <motion.path
            key={p.id}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={p.id === "XGBoost" ? 2.6 : 1.6}
            strokeLinecap="round"
            opacity={p.id === "XGBoost" ? 1 : 0.45}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: i * 0.12, ease: EASE }}
          />
        ))}
      </svg>
      <div style={{ position: "absolute", bottom: 18, left: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {MODELS.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.tm, fontFamily: T.mono }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
            {m.id}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== SMALL PIECES ============================== */
const SectionLabel = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: T.tm, fontFamily: T.mono }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${T.border},transparent)` }} />
  </div>
);

const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily: T.display, fontSize: 44, fontWeight: 800, color: T.t1, lineHeight: 1.02, letterSpacing: -0.5, margin: "0 0 12px", ...style }}>{children}</h2>
);

function Reveal({ children, delay = 0, y = 24 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ============================== PAGE ============================== */
export default function ModelsPage() {
  useLenis();
  const navigate = useNavigate();
  const [active, setActive] = useState("XGBoost");
  const model = MODELS.find((m) => m.id === active);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.t1, fontFamily: T.body, position: "relative" }}>
      {/* AMBIENT MESH BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${T.blue}22, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "10%", right: "-15%", width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${T.violet}1c, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${T.green}16, transparent 70%)`, filter: "blur(40px)" }} />
      </div>

      {/* NAV */}
      <SiteHeader active="Models" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HERO */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 48px 64px", textAlign: "center" }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: `1px solid ${T.border}`, background: "rgba(255,255,255,.03)", fontSize: 11.5, fontWeight: 600, color: T.t2, marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}`, animation: "pulse 2s infinite" }} />
              5 models benchmarked · live on SCFI data
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <H2 style={{ fontSize: 62, maxWidth: 780, margin: "0 auto 16px" }}>
              Five forecasting engines. <span style={{ background: `linear-gradient(90deg,${T.blue},${T.violet})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One production ensemble.</span>
            </H2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontSize: 16.5, color: T.t2, maxWidth: 620, margin: "0 auto 44px", lineHeight: 1.7 }}>
              Every model below was validated on five years of expanding walk-forward folds before it earned a place in the ensemble that powers Fretra's SCFI predictions.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ForecastHero />
          </Reveal>
        </section>

        {/* SELECTOR + DETAIL */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 40px" }}>
          <Reveal><SectionLabel>Select a model</SectionLabel></Reveal>
          <Reveal delay={0.05}>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 32 }}>
              {MODELS.map((m) => {
                const isActive = active === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActive(m.id)}
                    style={{
                      position: "relative", flexShrink: 0, textAlign: "left", cursor: "pointer",
                      padding: "16px 20px", borderRadius: T.r2, minWidth: 168,
                      border: `1px solid ${isActive ? m.color + "77" : T.border}`,
                      background: isActive ? `${m.color}14` : T.bgCard,
                      transition: "all .25s",
                    }}
                  >
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", color: isActive ? m.color : T.td, marginBottom: 6, fontFamily: T.mono }}>{m.tag}</div>
                    <div style={{ fontFamily: T.display, fontSize: 21, fontWeight: 800, color: T.t1, marginBottom: 8 }}>{m.id}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700, color: isActive ? m.color : T.tm }}>{m.mape ? `${m.mape}%` : "—"}</span>
                      <span style={{ fontSize: 10, color: T.td }}>MAPE</span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="selectorUnderline"
                        style={{ position: "absolute", bottom: 0, left: 12, right: 12, height: 2, borderRadius: 2, background: m.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <SpotlightCard accent={`${model.color}1a`} style={{ padding: "32px 36px" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${model.color},${model.color}00)` }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: model.color, marginBottom: 8, fontFamily: T.mono }}>{model.tag}</div>
                    <div style={{ fontFamily: T.display, fontSize: 38, fontWeight: 800, color: T.t1 }}>{model.id}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      ["MAPE", model.mape, model.mapeSuffix, T.green],
                      ["R2", model.r2, "", model.color],
                      ["RMSE", model.rmse, "", T.amber],
                      ["MAE", model.mae, "", T.violet],
                    ].map(([lbl, val, suf, c]) => (
                      <div key={lbl} style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "12px 18px", textAlign: "center", minWidth: 84 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, marginBottom: 5, fontFamily: T.mono }}>{lbl}</div>
                        <div style={{ fontFamily: T.display, fontSize: 24, fontWeight: 800, color: c }}>
                          <AnimatedNumber value={val} suffix={suf} decimals={lbl === "R2" ? 3 : lbl === "MAPE" ? 2 : 1} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: 14.5, color: T.t2, lineHeight: 1.8, marginBottom: 28, maxWidth: 640 }}>{model.desc}</p>

                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: T.tm, fontWeight: 600 }}>Relative performance vs. statistical baseline</span>
                    <span style={{ fontSize: 11.5, color: model.color, fontWeight: 700, fontFamily: T.mono }}>{model.barPct}%</span>
                  </div>
                  <div style={{ height: 7, background: T.bgRaised, borderRadius: 4, overflow: "hidden", border: `1px solid ${T.border}` }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${model.barPct}%` }}
                      transition={{ duration: 1, ease: EASE }}
                      style={{ height: "100%", background: `linear-gradient(90deg,${model.color},${model.color}99)`, borderRadius: 4, boxShadow: `0 0 14px ${model.color}66` }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.td, marginBottom: 14, fontFamily: T.mono }}>Model configuration</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                    {model.details.map(({ label, val }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                        style={{ background: T.bgRaised, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "13px 15px" }}
                      >
                        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.td, marginBottom: 5, fontFamily: T.mono }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.t2, fontFamily: T.display }}>{val}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* COMPARISON TABLE */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px 72px" }}>
          <Reveal><SectionLabel>Performance benchmarking</SectionLabel></Reveal>
          <Reveal delay={0.05}>
            <SpotlightCard accent={`${T.blue}12`} style={{ overflow: "visible" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["Model", "Classification", "MAPE ↓", "R2 ↑", "RMSE ↓", "MAE ↓", "Deployment"].map((h, i) => (
                        <th key={h} style={{ padding: "14px 18px", textAlign: i === 0 ? "left" : "center", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, fontFamily: T.mono }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODELS.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setActive(m.id)}
                        style={{
                          borderBottom: `1px solid ${T.bgRaised}`, cursor: "pointer",
                          background: active === m.id ? `${m.color}0d` : "transparent",
                          transition: "background .15s",
                        }}
                        onMouseEnter={(e) => { if (active !== m.id) e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                        onMouseLeave={(e) => { if (active !== m.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, boxShadow: `0 0 6px ${m.color}88`, flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: T.t1 }}>{m.id}</span>
                          </div>
                        </td>
                        <td style={{ padding: "13px 18px", textAlign: "center", color: T.tm, fontSize: 12 }}>{m.tag}</td>
                        <td style={{ padding: "13px 18px", textAlign: "center", fontWeight: 700, color: T.green, fontFamily: T.display, fontSize: 16 }}>{m.mape ? `${m.mape}%` : "—"}</td>
                        <td style={{ padding: "13px 18px", textAlign: "center", fontWeight: 700, color: m.color, fontFamily: T.display, fontSize: 16 }}>{m.r2}</td>
                        <td style={{ padding: "13px 18px", textAlign: "center", color: T.t2, fontFamily: T.display, fontSize: 15 }}>{m.rmse || "—"}</td>
                        <td style={{ padding: "13px 18px", textAlign: "center", color: T.t2, fontFamily: T.display, fontSize: 15 }}>{m.mae || "—"}</td>
                        <td style={{ padding: "13px 18px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}44` }}>
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          </Reveal>
        </section>

        {/* CV FOLDS TABLE */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 120px" }}>
          <Reveal><SectionLabel>Validation integrity: R2 by training fold</SectionLabel></Reveal>
          <Reveal delay={0.05}>
            <p style={{ fontSize: 13.5, color: T.tm, marginBottom: 22, lineHeight: 1.7, maxWidth: 720 }}>
              Expanding walk-forward cross-validation ensures each fold trains exclusively on historical data and is evaluated on a future period it has never seen, mirroring real commercial deployment conditions. Training windows start 2017-06-16 (after the ~52-week warm-up period needed for rolling/regime features is dropped) and expand each fold; LSTM is the only model whose per-fold R² is individually logged by the training script — XGBoost/Random Forest/SARIMAX/Ensemble report one aggregate cross-validated score across all 5 folds (see the model cards above).
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <SpotlightCard accent={`${T.green}10`}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["Fold", "Training Window", "Validation Period", "LSTM R2"].map((h, i) => (
                        <th key={h} style={{ padding: "14px 18px", textAlign: i < 3 ? "left" : "center", fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, fontFamily: T.mono }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CV_FOLDS.map((row) => (
                      <tr key={row.fold} style={{ borderBottom: `1px solid ${T.bgRaised}` }}>
                        <td style={{ padding: "12px 18px", fontWeight: 700, color: T.blue, fontFamily: T.display }}>#{row.fold}</td>
                        <td style={{ padding: "12px 18px", color: T.tm, fontSize: 12 }}>{row.train}</td>
                        <td style={{ padding: "12px 18px", color: T.tm, fontSize: 12 }}>{row.val}</td>
                        <td style={{ padding: "12px 18px", textAlign: "center", fontWeight: 700, color: T.amber, fontFamily: T.display, fontSize: 15 }}>{row.lstm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          </Reveal>
        </section>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}