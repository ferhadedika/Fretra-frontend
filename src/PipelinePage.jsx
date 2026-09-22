import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "./components/SiteHeader";
import { useLenisScroll } from "./components/ui/fx";

/* ============================== TOKENS (shared) ============================== */
const T = {
  bg: "#08090c", bgCard: "#121319", bgRaised: "#191b23",
  border: "#22242e", borderH: "#34384a",
  t1: "#f0f1f5", t2: "#adb2c4", tm: "#767b91", td: "#464a5c",
  blue: "#4f6ef7", violet: "#8b5cf6", green: "#10b77f", amber: "#f59e0b", pink: "#ec4899", teal: "#06b6d4",
  r: "10px", r2: "16px", r3: "22px",
  display: "'Barlow Condensed',sans-serif",
  body: "'Barlow','Inter',sans-serif",
  mono: "'JetBrains Mono','Fira Code',monospace",
};
const EASE = [0.16, 1, 0.3, 1];

/* ============================== DATA (unchanged) ============================== */
const STEPS = [
  {
    num: "01", color: "#4f6ef7", title: "Market Data Ingestion",
    sub: "SCFI + Global Macro Sources",
    desc: "Weekly Shanghai Containerized Freight Index readings are loaded from the validated Supabase dataset, covering a decade of market history from 2016 to the present. External macroeconomic features including Global PMI, Brent Crude, CNY/USD, and the Trade Volume Index are fetched and merged by ISO week to ensure precise temporal alignment.",
    bullets: [
      "10+ years of SCFI data (from 2016), a commercially representative history",
      "Brent Crude Oil, Global Manufacturing PMI, CNY/USD rate, Trade Volume Index",
      "ISO week spine alignment eliminates date-shift errors across data sources",
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
    desc: "62 market signals are engineered across five intelligence categories: autoregressive price lags (1 to 8 weeks), rolling statistical measures, z-score normalised macroeconomic indicators with cross-market interaction terms, COVID-era structural break variables, and cyclical calendar encodings for seasonal pattern detection.",
    bullets: [
      "scfi_lag_1 through scfi_lag_8, consistently the top SHAP attribution drivers",
      "Brent x PMI, Brent x CNY, Trade Volume x PMI cross-market interaction signals",
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
    desc: "Rigorous expanding-window walk-forward cross-validation across 5 sequential folds, the industry standard for time-series model validation. The training window expands with each fold, ensuring no future data contaminates any training period. All models are evaluated on a 1-step-ahead anchor to eliminate multi-step error compounding.",
    bullets: [
      "Expanding window: training set grows incrementally with each fold",
      "1-step anchor evaluation prevents cumulative forecast error compounding",
      "Fold 1: ~200 training weeks / Fold 5: ~400 training weeks",
      "SARIMAX statistically eliminated at this stage (R2 = -0.84 vs. mean prediction)",
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
      "XGBoost: 200 Optuna Bayesian trials, optimal at 540 estimators, depth 6",
      "Random Forest: 30-iteration RandomizedSearchCV across key hyperparameters",
      "LSTM: 12-week input sequence, 96 to 48 hidden units, dropout 0.2, early stopping",
      "SARIMAX: statistical benchmark, also contributes a 10% weight in the production ensemble",
    ],
    code: `# XGBoost, Bayesian hyperparameter optimisation
study = optuna.create_study(direction="minimize")
study.optimize(xgb_objective, n_trials=200)
xgb = XGBRegressor(**study.best_params)

# LSTM, sequence model with early stopping
model = build_lstm(seq_len=12, units=[96,48])
model.fit(..., callbacks=[EarlyStopping(patience=20)])`,
    tag: "Optuna · TensorFlow",
  },
  {
    num: "05", color: "#10b77f", title: "Ensemble Weight Optimisation",
    sub: "Constrained SLSQP Weight Solver",
    desc: "Model weights for all four base models - XGBoost, Random Forest, SARIMAX, and LSTM - are jointly optimised using scipy's SLSQP constrained minimisation solver to minimise validation MAE. Weights must sum to exactly 1.0 and are floored at 10% each, so the optimiser can favour the strongest model without ever fully excluding the others - a deliberate accuracy-for-robustness tradeoff.",
    bullets: [
      "scipy.optimize.minimize with SLSQP method, convex constrained optimisation",
      "Objective function: minimise ensemble-weighted validation mean absolute error",
      "Hard constraint: sum of all 4 weights = 1.0, each weight >= 0.10",
      "Current production weights: 70% XGBoost / 10% Random Forest / 10% SARIMAX / 10% LSTM",
    ],
    code: `def ensemble_mae(weights):
    w_xgb, w_rf, w_sar, w_lstm = weights
    pred = w_xgb*p_xgb + w_rf*p_rf + w_sar*p_sar + w_lstm*p_lstm
    return mean_absolute_error(y_val, pred)

result = minimize(ensemble_mae, x0=[.25]*4,
    method="SLSQP",
    constraints={"type":"eq","fun": lambda w: sum(w)-1},
    bounds=[(0.10,1)]*4)`,
    tag: "scipy SLSQP",
  },
  {
    num: "06", color: "#06b6d4", title: "Forecast Explainability",
    sub: "SHAP Attribution: Per-Prediction Driver Narratives",
    desc: "TreeExplainer computes exact SHAP attribution values for the XGBoost model on every forecast output. The dashboard surfaces the top 5 bullish and bearish market drivers as a plain-language commercial narrative alongside waterfall decomposition and global importance charts, giving decision-makers full transparency into what is driving each rate forecast.",
    bullets: [
      "shap.TreeExplainer on XGBoost, computationally exact attribution values",
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
      "GET /api/forecast returns a 12-week ensemble forecast with confidence context",
      "GET /api/shap returns SHAP attribution values for the latest forecast period",
      "GET /api/metrics returns cross-validation performance metrics for all models",
      "Supabase for live historical data, Firebase Authentication for access control",
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

/* ============================== SHARED PIECES ============================== */
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

function SpotlightCard({ children, style, accent, className, onClick }) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.9, background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, ${accent || "rgba(79,110,247,.10)"}, transparent 60%)` }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 12, right: 12, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: T.tm, fontFamily: T.mono }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${T.border},transparent)` }} />
    </div>
  );
}

/* ============================== SIGNATURE: animated flow rail ============================== */
function FlowRail({ active, setActive }) {
  const railRef = useRef(null);
  const pct = STEPS.length > 1 ? (active / (STEPS.length - 1)) * 100 : 0;

  return (
    <div ref={railRef} style={{ position: "relative", padding: "8px 0 28px" }}>
      <div style={{ position: "absolute", top: 27, left: 0, right: 0, height: 2, background: T.border, borderRadius: 1 }} />
      <motion.div
        style={{ position: "absolute", top: 27, left: 0, height: 2, borderRadius: 1, background: `linear-gradient(90deg,${STEPS[0].color},${STEPS[active].color})` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        {STEPS.map((s, i) => {
          const isActive = active === i;
          const isDone = i < active;
          return (
            <button
              key={s.num}
              onClick={() => setActive(i)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                width: `${100 / STEPS.length}%`, fontFamily: "inherit",
              }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.25 : 1,
                  backgroundColor: isActive || isDone ? s.color : T.bgRaised,
                  borderColor: isActive || isDone ? s.color : T.border,
                }}
                transition={{ duration: 0.3 }}
                style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid", boxShadow: isActive ? `0 0 16px ${s.color}aa` : "none", zIndex: 2 }}
              />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: isActive ? s.color : T.td, fontFamily: T.mono, marginBottom: 3 }}>Stage {s.num}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: isActive ? T.t1 : T.tm, lineHeight: 1.3, maxWidth: 100 }}>{s.title}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== CODE BLOCK ============================== */
function CodeBlock({ step }) {
  const highlighted = step.code
    .replace(/(def |class |for |if |return |import |from |async |await )/g, "##KW##$1##/KW##")
    .split("##KW##")
    .map((part, i) => {
      if (part.includes("##/KW##")) {
        const [kw, rest] = part.split("##/KW##");
        return <span key={i}><span style={{ color: T.violet }}>{kw}</span>{rest}</span>;
      }
      return <span key={i}>{part}</span>;
    });

  return (
    <div style={{ background: "#07080b", border: `1px solid ${T.border}`, borderRadius: T.r2, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid ${T.border}`, background: T.bgCard }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b77f" }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: T.td, fontFamily: T.mono }}>Python · Stage {step.num}</span>
        <div style={{ width: 60 }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.pre
          key={step.num}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: "22px 24px", margin: 0, fontSize: 12.5, lineHeight: 1.8, color: "#c4cee0", fontFamily: T.mono, overflowX: "auto", whiteSpace: "pre-wrap", flex: 1 }}
        >
          {highlighted}
        </motion.pre>
      </AnimatePresence>
    </div>
  );
}

/* ============================== PAGE ============================== */
export default function PipelinePage() {
  useLenisScroll({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.t1, fontFamily: T.body, position: "relative" }}>
      {/* AMBIENT MESH BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${T.teal}1e, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "5%", right: "-15%", width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${T.blue}1c, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "35%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${T.violet}16, transparent 70%)`, filter: "blur(40px)" }} />
      </div>

      {/* NAV */}
      <SiteHeader active="Pipeline" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HERO */}
        <section style={{ padding: "72px 48px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.28)", borderRadius: 999, padding: "6px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#22d3ee", marginBottom: 22 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, display: "inline-block", animation: "pulse 2s infinite", boxShadow: `0 0 8px ${T.teal}` }} />
              Analytical intelligence pipeline
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(38px,5.5vw,66px)", fontWeight: 800, lineHeight: 1.02, margin: "0 0 18px", letterSpacing: -0.6 }}>
              From raw market data<br />
              <span style={{ background: `linear-gradient(90deg,${T.teal},${T.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>to actionable 12-week forecasts.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontSize: 16, color: T.t2, maxWidth: 640, lineHeight: 1.8, margin: 0 }}>
              A seven-stage production pipeline covering market data ingestion, signal engineering, validation protocol, model training, ensemble optimisation, forecast explainability, and live API delivery. Every stage is designed for commercial reliability and decision-maker transparency.
            </p>
          </Reveal>
        </section>

        {/* FLOW RAIL */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 20px" }}>
          <Reveal delay={0.1}>
            <SpotlightCard accent={`${step.color}14`} style={{ padding: "24px 32px 8px" }}>
              <FlowRail active={active} setActive={setActive} />
            </SpotlightCard>
          </Reveal>
        </section>

        {/* STEP DETAIL */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 48px 64px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
            >
              <SpotlightCard accent={`${step.color}18`} style={{ padding: "30px 34px" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${step.color},${step.color}00)` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${step.color}18`, border: `1px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.display, fontSize: 24, fontWeight: 800, color: step.color, flexShrink: 0 }}>{step.num}</div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: step.color, marginBottom: 4, fontFamily: T.mono }}>{step.sub}</div>
                    <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 800, color: T.t1 }}>{step.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: T.t2, lineHeight: 1.85, marginBottom: 24 }}>{step.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {step.bullets.map((b, i) => (
                    <motion.div
                      key={b}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                    >
                      <span style={{ color: step.color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13.5, color: T.t2, lineHeight: 1.6 }}>{b}</span>
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 7, background: `${step.color}12`, border: `1px solid ${step.color}30`, borderRadius: 999, padding: "5px 14px" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: step.color, display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: step.color, letterSpacing: 0.5, fontFamily: T.mono }}>{step.tag}</span>
                </div>
              </SpotlightCard>

              <CodeBlock step={step} />
            </motion.div>
          </AnimatePresence>

          {/* nav buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <button
              onClick={() => setActive(Math.max(0, active - 1))}
              disabled={active === 0}
              style={{ background: active === 0 ? T.bgRaised : T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "10px 22px", color: active === 0 ? T.td : T.t2, fontSize: 13, fontWeight: 600, cursor: active === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: active === 0 ? 0.5 : 1, transition: "all .2s" }}
            >
              ← Previous stage
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {STEPS.map((_, i) => (
                <div key={i} onClick={() => setActive(i)} style={{ width: active === i ? 20 : 6, height: 6, borderRadius: 3, background: active === i ? step.color : T.border, cursor: "pointer", transition: "all .25s" }} />
              ))}
            </div>
            <button
              onClick={() => setActive(Math.min(STEPS.length - 1, active + 1))}
              disabled={active === STEPS.length - 1}
              style={{ background: active === STEPS.length - 1 ? T.bgRaised : `linear-gradient(135deg,${T.blue},${T.violet})`, border: "none", borderRadius: T.r, padding: "10px 22px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: active === STEPS.length - 1 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: active === STEPS.length - 1 ? 0.5 : 1, boxShadow: active === STEPS.length - 1 ? "none" : "0 6px 18px rgba(79,110,247,.32)", transition: "all .2s" }}
            >
              Next stage →
            </button>
          </div>
        </section>

        {/* ALL STAGES OVERVIEW */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 110px" }}>
          <Reveal><SectionLabel>Complete pipeline at a glance</SectionLabel></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.04}>
                <SpotlightCard
                  accent={active === i ? `${s.color}1c` : "rgba(255,255,255,.04)"}
                  onClick={() => setActive(i)}
                  style={{ padding: "18px 20px", border: `1px solid ${active === i ? s.color + "55" : T.border}` }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: active === i ? s.color : "transparent" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <div style={{ fontFamily: T.display, fontSize: 24, fontWeight: 800, color: active === i ? s.color : T.td }}>{s.num}</div>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}88` }} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: active === i ? T.t1 : T.t2, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: T.td }}>{s.sub}</div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        @media (max-width: 860px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}