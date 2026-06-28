import { useState, useMemo } from "react";
import { FEATURE_META } from "../utils/featureMeta";

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

const SOURCE_COLORS = {
  "Shanghai Shipping Exchange":                          { bg: "rgba(79,110,247,.1)",  border: "rgba(79,110,247,.3)",  color: "#4f6ef7" },
  "EIA / FRED (DCOILBRENTEU)":                          { bg: "rgba(245,158,11,.1)",  border: "rgba(245,158,11,.3)",  color: "#f59e0b" },
  "FRED (DEXCHUS)":                                     { bg: "rgba(16,183,127,.1)",  border: "rgba(16,183,127,.3)",  color: "#10b77f" },
  "S&P Global / JPMorgan":                              { bg: "rgba(139,92,246,.1)",  border: "rgba(139,92,246,.3)",  color: "#8b5cf6" },
  "CPB Netherlands Bureau for Economic Policy Analysis":{ bg: "rgba(236,72,153,.1)",  border: "rgba(236,72,153,.3)",  color: "#ec4899" },
  "Derived":                                            { bg: "rgba(122,127,150,.1)", border: "rgba(122,127,150,.3)", color: "#7a7f96" },
  "Derived (calendar)":                                 { bg: "rgba(122,127,150,.1)", border: "rgba(122,127,150,.3)", color: "#7a7f96" },
};

const ALL_SOURCES = [
  "All Sources",
  "Shanghai Shipping Exchange",
  "EIA / FRED (DCOILBRENTEU)",
  "FRED (DEXCHUS)",
  "S&P Global / JPMorgan",
  "CPB Netherlands Bureau for Economic Policy Analysis",
  "Derived",
  "Derived (calendar)",
];

const CATEGORIES = [
  { id: "all",      label: "All",      icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { id: "core",     label: "Core",     icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "lags",     label: "Lags",     icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { id: "calendar", label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

function getCategory(key) {
  if (key.includes("_lag")) return "lags";
  const src = FEATURE_META[key]?.source ?? "";
  if (src.includes("calendar")) return "calendar";
  if (key.startsWith("Month_") || key.startsWith("Q_") || ["Year","Quarter","Month","Week_of_Year"].includes(key)) return "calendar";
  return "core";
}

/* ── Shared Card — identical to App.jsx ── */
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

/* ── Pill-style filter bar — identical pattern to App.jsx TabBar ── */
const FilterBar = ({ items, activeId, onChange }) => (
  <div style={{
    display: "flex", gap: 3,
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: T.r2,
    padding: 4,
    boxShadow: T.shCard,
    width: "fit-content",
  }}>
    {items.map(it => {
      const active = activeId === it.id;
      return (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
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
            <path d={it.icon} />
          </svg>
          {it.label}
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

function SourcePill({ source }) {
  const s = SOURCE_COLORS[source] ?? SOURCE_COLORS["Derived"];
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 600,
      padding: "2px 8px", borderRadius: 5, lineHeight: 1.6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {source}
    </span>
  );
}

export function FeatureDictionary({ metrics }) {
  const [search, setSearch]     = useState("");
  const [source, setSource]     = useState("All Sources");
  const [category, setCategory] = useState("all");

  const activeFeatures = useMemo(() => {
    const set = new Set();
    if (!metrics) return set;
    Object.values(metrics.shap_global ?? {}).forEach((arr) =>
      arr.forEach((d) => set.add(d.Feature || d.feature))
    );
    return set;
  }, [metrics]);

  const entries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return Object.entries(FEATURE_META).filter(([key, meta]) => {
      if (source !== "All Sources" && meta.source !== source) return false;
      if (category !== "all" && getCategory(key) !== category) return false;
      if (!q) return true;
      return (
        key.toLowerCase().includes(q) ||
        meta.label.toLowerCase().includes(q) ||
        meta.meaning.toLowerCase().includes(q) ||
        meta.source.toLowerCase().includes(q) ||
        meta.why.toLowerCase().includes(q)
      );
    });
  }, [search, source, category]);

  const STATS = [
    { label: "Total Features", value: Object.keys(FEATURE_META).length },
    { label: "Core Features",  value: Object.keys(FEATURE_META).filter(k => getCategory(k) === "core").length },
    { label: "Lag Features",   value: Object.keys(FEATURE_META).filter(k => getCategory(k) === "lags").length },
    { label: "Calendar",       value: Object.keys(FEATURE_META).filter(k => getCategory(k) === "calendar").length },
  ];

  return (
    <div style={{ fontFamily: "'Barlow','Inter',sans-serif", color: T.t1 }}>

      {/* Page header — matches App.jsx page-header pattern */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: 2.5,
          textTransform: "uppercase", color: T.td, marginBottom: 8,
        }}>
          Feature Dictionary
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 28, fontWeight: 800, letterSpacing: -.5,
            margin: 0, color: T.t1, lineHeight: 1.1,
          }}>
            Model{" "}
            <span style={{
              background: "linear-gradient(90deg,#4f6ef7,#8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Inputs
            </span>
          </h2>
          <p style={{ color: T.tm, fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
            Every variable the model sees, where it comes from, and why it matters
          </p>
        </div>
      </div>

      {/* Stats row — hoverable Cards like App.jsx */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {STATS.map(s => (
          <Card key={s.label} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", color: T.td, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: T.t1, lineHeight: 1 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="🔍  Search features, sources, meanings…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: "1 1 240px",
            background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: T.r, color: T.t1, fontSize: 12.5,
            padding: "9px 14px", outline: "none", fontFamily: "inherit",
          }}
          onFocus={e => e.target.style.borderColor = T.borderH}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          style={{
            background: T.bgRaised, border: `1px solid ${T.border}`,
            borderRadius: T.r, color: T.t2, fontSize: 12,
            padding: "9px 12px", cursor: "pointer", fontFamily: "inherit", outline: "none",
          }}
        >
          {ALL_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <FilterBar items={CATEGORIES} activeId={category} onChange={setCategory} />
      </div>

      {/* Table */}
      <Card style={{ overflow: "hidden" }} hover={false}>
        {/* Header row */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.2fr 2.5fr 2.5fr",
          padding: "10px 18px",
          borderBottom: `1px solid ${T.border}`,
          background: T.bgRaised,
        }}>
          {["Feature Name", "Data Source", "Business Meaning", "Why It Affects Forecasts"].map(h => (
            <div key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", color: T.td }}>{h}</div>
          ))}
        </div>

        {entries.length === 0 && (
          <div style={{ padding: "28px 18px", color: T.tm, fontSize: 13 }}>No features match your search.</div>
        )}

        {entries.map(([key, meta], i) => {
          const isActive = activeFeatures.has(key);
          return (
            <div key={key} style={{
              display: "grid", gridTemplateColumns: "2fr 1.2fr 2.5fr 2.5fr",
              padding: "14px 18px",
              borderBottom: i < entries.length - 1 ? `1px solid ${T.border}` : "none",
              borderLeft: isActive ? `3px solid ${T.blue}` : "3px solid transparent",
              transition: "background .15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.bgRaised}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: meta.color ?? T.t1, marginBottom: 3 }}>
                  {meta.label}
                  {isActive && (
                    <span style={{
                      marginLeft: 8, fontSize: 9, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 4, verticalAlign: "middle",
                      background: "rgba(79,110,247,.15)", color: "#6f9af8",
                      border: "1px solid rgba(79,110,247,.3)",
                    }}>IN MODEL</span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: T.td, fontFamily: "monospace" }}>{key}</div>
              </div>
              <div><SourcePill source={meta.source} /></div>
              <div style={{ fontSize: 12.5, color: T.tm, lineHeight: 1.6 }}>{meta.meaning}</div>
              <div style={{ fontSize: 12.5, color: T.tm, lineHeight: 1.6 }}>{meta.why}</div>
            </div>
          );
        })}
      </Card>

      <div style={{ fontSize: 11, color: T.td, marginTop: 10 }}>
        Showing {entries.length} of {Object.keys(FEATURE_META).length} features.
        Features marked <strong style={{ color: "#6f9af8" }}>IN MODEL</strong> appear in the current model's SHAP output.
      </div>
    </div>
  );
}