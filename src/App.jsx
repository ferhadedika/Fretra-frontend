import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import { Header } from "./components/Header";
import { ForecastControls } from "./components/ForecastControls";
import { KpiRow } from "./components/KpiRow";
import { ForecastChart } from "./components/ForecastChart";
import { ProjectionsLedger } from "./components/ProjectionsLedger";
import { ShapPanel } from "./components/ShapPanel";
import { ModelComparison } from "./components/ModelComparison";
import { FoldMetrics } from "./components/FoldMetrics";
import { FeatureDictionary } from "./components/FeatureDictionary";
import { BaselineComparison } from "./components/BaselinesComparison";
import { useForecast } from "./hooks/useForecast";
import { T, GlowCard, Reveal, AuroraBackdrop, useSmoothScroll } from "./components/ui/fx";
import LoginPage from "./LoginPage";
import LandingPage from "./LandingPage";
import AboutPage from "./AboutPage";
import ModelsPage from "./ModelsPage";
import PipelinePage from "./PipelinePage";
import FeaturesPage from "./FeaturesPage";
import "./styles/app.css";
import "./styles/tabs.css";

const TABS = [
  { id: "forecast",   label: "Core Forecast",    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "comparison", label: "Model Compare",    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "baselines",  label: "Baselines",        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { id: "shap",       label: "Interpretability", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "folds",      label: "CV Folds",         icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { id: "features",   label: "Features",         icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
];

/* Floating glass tab bar with a sliding active pill */
const TabBar = ({ tabs, activeTab, onChange }) => (
  <div style={{
    display: "flex", gap: 3,
    background: "rgba(19,20,26,.82)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${T.border}`,
    borderRadius: T.r2,
    padding: 4,
    boxShadow: T.shCard,
    width: "fit-content",
    maxWidth: "100%",
    overflowX: "auto",
  }}>
    {tabs.map(t => {
      const active = activeTab === t.id;
      return (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            position: "relative",
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: T.r,
            color: active ? T.t1 : T.tm,
            fontWeight: active ? 700 : 500,
            fontSize: 12.5,
            padding: "7px 14px",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "color .15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.t2; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.tm; }}
        >
          {active && (
            <motion.span
              layoutId="tab-pill"
              transition={{ type: "spring", stiffness: 480, damping: 38 }}
              style={{
                position: "absolute", inset: 0,
                background: T.bgRaised,
                border: `1px solid ${T.borderH}`,
                borderRadius: T.r,
                boxShadow: T.shCard,
                zIndex: 0,
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
              style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>
              <path d={t.icon} />
            </svg>
            {t.label}
            {active && (
              <span style={{
                width: 4, height: 4, borderRadius: "50%",
                background: T.blue, display: "inline-block",
                boxShadow: `0 0 5px ${T.blue}`,
              }} />
            )}
          </span>
        </button>
      );
    })}
  </div>
);

/* Premium skeleton loading state */
const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", background: T.bg, color: T.t1, fontFamily: "'Barlow','Inter',sans-serif" }}>
    <Header />
    <AuroraBackdrop />
    <main style={{ position: "relative", zIndex: 1, maxWidth: 1300, margin: "0 auto", padding: "82px 40px 60px" }}>
      <div className="skeleton" style={{ width: 180, height: 12, marginBottom: 14 }} />
      <div className="skeleton" style={{ width: 340, height: 34, marginBottom: 32 }} />
      <div className="skeleton" style={{ width: "100%", height: 76, borderRadius: 14, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: 118, borderRadius: 14 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 92, borderRadius: 14 }} />
        ))}
      </div>
      <div className="skeleton" style={{ width: "100%", height: 420, borderRadius: 14 }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 28,
        fontSize: 11, color: T.tm, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700,
      }}>
        <span style={{
          width: 14, height: 14, borderRadius: "50%",
          border: `2px solid ${T.border}`, borderTopColor: T.blue,
          display: "inline-block", animation: "spin .8s linear infinite",
        }} />
        Loading Fretra
      </div>
    </main>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* Hoisted dashboard so it keeps its identity across App re-renders */
function ForecastApp({ activeTab, setActiveTab, forecastState }) {
  const {
    models, historical, activeModelId, horizonWeeks,
    forecast, shap, forecastsByModel, metrics, rollingMeta, loadingInitial, loadingForecast,
    error, setActiveModelId, setHorizonWeeks, refreshForecast,
  } = forecastState;

  useSmoothScroll();

  if (loadingInitial) return <LoadingScreen />;

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.t1,
      fontFamily: "'Barlow','Inter',sans-serif",
      overflowX: "hidden",
    }}>
      <Header />
      <AuroraBackdrop />

      <main style={{
        position: "relative", zIndex: 1,
        maxWidth: 1300, margin: "0 auto",
        padding: "82px 40px 60px",
      }}>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <GlowCard style={{
                padding: "12px 20px", marginBottom: 20,
                borderColor: "rgba(239,68,68,.35)",
                background: "rgba(239,68,68,.07)",
              }} hover={false} glow={false}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#f87171" }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              </GlowCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page header */}
        <Reveal>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 9.5, fontWeight: 700, letterSpacing: 2.5,
              textTransform: "uppercase", color: T.tm, marginBottom: 10,
              padding: "4px 11px",
              background: "rgba(79,110,247,.07)",
              border: "1px solid rgba(79,110,247,.18)",
              borderRadius: 999,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: T.green,
                boxShadow: `0 0 6px ${T.green}`, display: "inline-block",
                animation: "pulse 2.4s ease infinite",
              }} />
              Freight Intelligence Platform
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <h1 style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 36, fontWeight: 800, letterSpacing: -.5,
                margin: 0, color: T.t1, lineHeight: 1.1,
              }}>
                SCFI Forecast{" "}
                <span style={{
                  background: "linear-gradient(90deg,#4f6ef7,#8b5cf6,#ec4899)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  animation: "gradient-pan 7s ease infinite",
                }}>
                  Engine
                </span>
              </h1>
              <p style={{ color: T.tm, fontSize: 12.5, margin: 0, lineHeight: 1.6, textAlign: "right" }}>
                Shanghai Containerized Freight Index · 10 Years of Data
                {rollingMeta && (
                  <>
                    <br />
                    <span style={{ color: T.td }}>
                      Rolling forecast · data through {rollingMeta.latestActualWeek} · generated{" "}
                      {new Date(rollingMeta.forecastCreatedAt).toLocaleString()}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Controls */}
        <Reveal delay={0.05}>
          <GlowCard style={{ padding: "20px 24px", marginBottom: 20 }} hover={false}>
            <ForecastControls
              models={models} activeModelId={activeModelId}
              horizonWeeks={horizonWeeks} onHorizonChange={setHorizonWeeks}
              onModelSelect={setActiveModelId}
              onRunForecast={refreshForecast}
              loading={loadingForecast}
            />
          </GlowCard>
        </Reveal>

        {/* KPI row */}
        <Reveal delay={0.1}>
          <div style={{ marginBottom: 24 }}>
            <KpiRow forecast={forecast} metrics={metrics} activeModelId={activeModelId} models={models} />
          </div>
        </Reveal>

        {/* Tab bar, sticky under the header */}
        <div style={{
          marginBottom: 16,
          position: "sticky", top: 66, zIndex: 40,
        }}>
          <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab panel */}
        <GlowCard style={{ padding: "28px 24px", minHeight: 460 }} hover={false} glow={false}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "forecast" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}
                  className="forecast-split">
                  <ForecastChart historical={historical} forecast={forecast} modelId={activeModelId} />
                  <ProjectionsLedger forecast={forecast} />
                </div>
              )}
              {activeTab === "comparison" && (
                <ModelComparison
                  models={models} metrics={metrics} historical={historical} forecast={forecast}
                  activeModelId={activeModelId} forecastsByModel={forecastsByModel} horizonWeeks={horizonWeeks}
                />
              )}
              {activeTab === "baselines" && (
                <BaselineComparison forecast={forecast} metrics={metrics} activeModelId={activeModelId} models={models} />
              )}
              {activeTab === "shap" && (
                <ShapPanel shap={shap} activeModelId={activeModelId} metrics={metrics} />
              )}
              {activeTab === "folds" && (
                <FoldMetrics metrics={metrics} models={models} activeModelId={activeModelId} />
              )}
              {activeTab === "features" && (
                <FeatureDictionary metrics={metrics} />
              )}
            </motion.div>
          </AnimatePresence>
        </GlowCard>

        {/* Footer */}
        <Reveal delay={0.05}>
          <footer style={{
            marginTop: 48, paddingTop: 24,
            borderTop: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 10,
            color: T.td, fontSize: 11,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                letterSpacing: 1.5, textTransform: "uppercase", fontSize: 12, color: T.tm,
              }}>Fretra</span>
              <span style={{ color: T.border }}>·</span>
              <span>SCFI Forecasting Intelligence Platform</span>
            </div>
            <span>Built with XGBoost · FastAPI · React · Supabase</span>
            <span>FYP · Universiti Teknologi PETRONAS</span>
          </footer>
        </Reveal>
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes gradient-pan {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
        @media (max-width: 980px) {
          .forecast-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [activeTab, setActiveTab] = useState("forecast");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const forecastState = useForecast(!!session);

  if (session === undefined) return null;

  const isAuthenticated = !!session;

  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/models"   element={<ModelsPage />} />
      <Route path="/pipeline" element={<PipelinePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about"    element={<AboutPage />} />
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/app" /> : <LoginPage />} />
      <Route
        path="/app"
        element={
          isAuthenticated
            ? <ForecastApp activeTab={activeTab} setActiveTab={setActiveTab} forecastState={forecastState} />
            : <Navigate to="/login" />
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
