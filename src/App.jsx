import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import LoginPage from "./LoginPage";
import LandingPage from "./LandingPage";
import AboutPage from "./AboutPage";
import ModelsPage from "./ModelsPage";
import PipelinePage from "./PipelinePage";
import FeaturesPage from "./FeaturesPage";
import "./styles/app.css";
import "./styles/tabs.css";

/* ── Design tokens — mirrors LandingPage exactly ── */
const T = {
  bg:       "#0c0d11",
  bgCard:   "#13141a",
  bgRaised: "#1a1c24",
  border:   "#22242e",
  borderH:  "#323546",
  t1:       "#edeef2",
  t2:       "#b0b4c4",
  tm:       "#7a7f96",
  td:       "#44475a",
  blue:     "#4f6ef7",
  violet:   "#8b5cf6",
  green:    "#10b77f",
  r:        "10px",
  r2:       "14px",
  shCard:   "0 2px 8px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.035)",
  shHover:  "0 8px 28px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.05)",
};

/* ── Shared card (identical to LandingPage) ── */
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
        position: "absolute", top: 0, left: 10, right: 10, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
};

const TABS = [
  { id: "forecast",   label: "Core Forecast",    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "comparison", label: "Model Compare",    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "baselines",  label: "Baselines",        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { id: "shap",       label: "Interpretability", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "folds",      label: "CV Folds",         icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { id: "features",   label: "Features",         icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
];

/* ── Styled tab bar ── */
const TabBar = ({ tabs, activeTab, onChange }) => (
  <div style={{
    display: "flex", gap: 3,
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: T.r2,
    padding: 4,
    boxShadow: T.shCard,
    width: "fit-content",
  }}>
    {tabs.map(t => {
      const active = activeTab === t.id;
      return (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: active ? T.bgRaised : "transparent",
            border: active ? `1px solid ${T.borderH}` : "1px solid transparent",
            borderRadius: T.r,
            color: active ? T.t1 : T.tm,
            fontWeight: active ? 700 : 500,
            fontSize: 12.5,
            padding: "7px 14px",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background .15s, color .15s, border-color .15s",
            boxShadow: active ? T.shCard : "none",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.t2; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.tm; }}
        >
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
        </button>
      );
    })}
  </div>
);

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

  const {
    models, historical, activeModelId, horizonWeeks,
    forecast, shap, metrics, loadingInitial, loadingForecast,
    error, setHorizonWeeks, generateForecast,
  } = useForecast();

  if (session === undefined) return null;

  const isAuthenticated = !!session;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const ForecastApp = () => {
    if (loadingInitial) {
      return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.t1, fontFamily: "'Barlow','Inter',sans-serif" }}>
          <Header />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100vh", flexDirection: "column", gap: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: `3px solid ${T.border}`,
              borderTopColor: T.blue,
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 11, color: T.tm, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              Loading Fretra…
            </div>
          </div>
          <style>{`
            @keyframes spin  { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
          `}</style>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.t1,
        fontFamily: "'Barlow','Inter',sans-serif",
        overflowX: "hidden",
      }}>
        <Header />

        {/* Ambient glow layers — same as landing hero */}
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 900, height: 500,
          background: "radial-gradient(ellipse,rgba(79,110,247,.07) 0%,transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: 0, right: 0,
          width: 500, height: 500,
          background: "radial-gradient(circle,rgba(139,92,246,.04) 0%,transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <main style={{
          position: "relative", zIndex: 1,
          maxWidth: 1300, margin: "0 auto",
          padding: "82px 40px 60px",
        }}>

          {/* Error banner */}
          {error && (
            <Card style={{
              padding: "12px 20px", marginBottom: 20,
              borderColor: "rgba(239,68,68,.35)",
              background: "rgba(239,68,68,.07)",
            }} hover={false}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#f87171" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            </Card>
          )}

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: 2.5,
              textTransform: "uppercase", color: T.td, marginBottom: 8,
            }}>
              Freight Intelligence Platform
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <h1 style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 34, fontWeight: 800, letterSpacing: -.5,
                margin: 0, color: T.t1, lineHeight: 1.1,
              }}>
                SCFI Forecast{" "}
                <span style={{
                  background: "linear-gradient(90deg,#4f6ef7,#8b5cf6)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  Engine
                </span>
              </h1>
              <p style={{ color: T.tm, fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
                Shanghai Containerized Freight Index · Walk-forward CV · SHAP explained
              </p>
            </div>
          </div>

          {/* Controls */}
          <Card style={{ padding: "20px 24px", marginBottom: 20 }} hover={false}>
            <ForecastControls
              models={models} activeModelId={activeModelId}
              horizonWeeks={horizonWeeks} onHorizonChange={setHorizonWeeks}
              onModelSelect={(id) => generateForecast(id, horizonWeeks)}
              onRunForecast={() => generateForecast(activeModelId, horizonWeeks)}
              loading={loadingForecast}
            />
          </Card>

          {/* KPI row */}
          <div style={{ marginBottom: 24 }}>
            <KpiRow forecast={forecast} metrics={metrics} activeModelId={activeModelId} models={models} />
          </div>

          {/* Tab bar */}
          <div style={{ marginBottom: 16, overflowX: "auto" }}>
            <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab panel */}
          <Card style={{ padding: "28px 24px", minHeight: 460 }} hover={false}>
            {activeTab === "forecast" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
                <ForecastChart historical={historical} forecast={forecast} modelId={activeModelId} />
                <ProjectionsLedger forecast={forecast} />
              </div>
            )}
            {activeTab === "comparison" && (
              <ModelComparison models={models} metrics={metrics} historical={historical} forecast={forecast} activeModelId={activeModelId} />
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
          </Card>

          {/* Footer */}
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
        </main>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
          @keyframes spin  { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/models"   element={<ModelsPage />} />
      <Route path="/pipeline" element={<PipelinePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about"    element={<AboutPage />} />
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/app" /> : <LoginPage />} />
      <Route path="/app"      element={isAuthenticated ? <ForecastApp /> : <Navigate to="/login" />} />
      <Route path="*"         element={<Navigate to="/" />} />
    </Routes>
  );
}