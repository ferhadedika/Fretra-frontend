import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine, LabelList,
} from "recharts";
import { FEATURE_META, humanize } from "../utils/featureMeta";
import "../styles/shap.css";

// Value label for the diverging (positive/negative) local chart. Placing
// every label OUTSIDE its bar doesn't work here: negative bars grow toward
// the Y-axis category column, which has no breathing room, so long
// negative bars' labels collided with the axis text. Instead: a bar wide
// enough to hold its own label gets it placed INSIDE, near the tip
// (light text on the solid fill); a bar too short for that gets its label
// placed just outside instead - and being short, that's near the zero
// line in the middle of the chart, not against the axis, so there's no
// collision risk there.
function DivergingValueLabel({ x, y, width, height, value }) {
  if (value === undefined || value === null) return null;
  const isNeg = value < 0;
  const text = value.toFixed(2);
  const estTextWidth = text.length * 5.6 + 4;
  const fitsInside = width > estTextWidth + 8;

  if (fitsInside) {
    const labelX = isNeg ? x + 5 : x + width - 5;
    return (
      <text x={labelX} y={y + height / 2} dy={3.5} fontSize={10} fontWeight={700} fill="#0c0d11" textAnchor={isNeg ? "start" : "end"}>
        {text}
      </text>
    );
  }

  const labelX = isNeg ? x - 5 : x + width + 5;
  return (
    <text x={labelX} y={y + height / 2} dy={3.5} fontSize={10} fill="#8ba0be" textAnchor={isNeg ? "end" : "start"}>
      {text}
    </text>
  );
}

// ensemble_weights keys -> shap_global keys
const ENSEMBLE_COMPONENTS = { xgboost: "xgboost", rf: "random_forest", sarimax: "sarimax", lstm: "lstm" };

// Training only saves global SHAP for the four base models. The ensemble's
// prediction is a fixed weighted sum of theirs, so its global importance is
// derived as the same weighted blend of the components' mean |SHAP| (all in
// SCFI index points). Strictly an upper bound - per-row SHAP values from
// different models can partly cancel - hence labelled as a blend in the UI.
function blendEnsembleGlobalShap(metrics) {
  const weights = metrics?.ensemble_weights;
  const perModel = metrics?.shap_global;
  if (!weights || !perModel) return [];
  const totals = {};
  for (const [wKey, shapKey] of Object.entries(ENSEMBLE_COMPONENTS)) {
    const w = weights[wKey];
    for (const row of perModel[shapKey] || []) {
      const v = row["Mean|SHAP|"] ?? row.value;
      if (w == null || v == null) continue;
      const f = row.Feature || row.feature;
      totals[f] = (totals[f] ?? 0) + w * v;
    }
  }
  return Object.entries(totals).map(([Feature, v]) => ({ Feature, "Mean|SHAP|": v }));
}

export function ShapPanel({ shap, activeModelId, metrics }) {
  const isBlendedEnsemble = activeModelId === "ensemble" && !metrics?.shap_global?.ensemble?.length;
  const globalShapData = isBlendedEnsemble
    ? blendEnsembleGlobalShap(metrics)
    : metrics?.shap_global?.[activeModelId] || [];
  const localShapData  = metrics?.shap_last_prediction?.[activeModelId] || [];

  // `??` (not `||`) matters here: a feature can have a genuine Mean|SHAP|
  // of exactly 0 (several calendar dummies do), and `0 || d.value` would
  // wrongly discard that real zero in favor of `d.value` (undefined),
  // which broke both the bar (undefined can't be plotted) and its sort
  // position (undefined comparisons are unstable in Array.sort).
  const globalRaw = globalShapData.length
    ? globalShapData.map((d) => ({ feature: d.Feature || d.feature, value: d["Mean|SHAP|"] ?? d.value }))
    : shap?.global_importance || [];

  // Prefer the live local explanation (from the rolling forecast pipeline,
  // recomputed for the current prediction) over the static training-time
  // snapshot in metrics - local importance is meant to reflect the newest
  // forecast, unlike global importance which stays training-time.
  const localRaw = shap?.local_importance?.length
    ? shap.local_importance
    : localShapData.map((d) => ({ feature: d.feature || d.Feature, value: d.shap_value ?? d.value }));

  const globalData = [...globalRaw]
    .map((d) => ({ ...d, label: humanize(d.feature || d.label) }))
    .sort((a, b) => a.value - b.value)
    .slice(-15);

  // Full, untruncated set - the "why" bullets and top driver always read
  // from this, so they're correct regardless of how much the chart below
  // gets trimmed for readability.
  const localDataFull = [...localRaw]
    .map((d) => ({ ...d, label: humanize(d.feature || d.label) }))
    .sort((a, b) => a.value - b.value);

  // Chart-only: top 15 by absolute magnitude, mirroring globalData's own
  // slice(-15) above. A model can have 60+ features - rendering all of
  // them as bars in a fixed 380px chart makes each one a few px tall with
  // overlapping labels, which looks like it disagrees with the "why"
  // bullets even though the underlying data always matched.
  const localData = [...localDataFull]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 15)
    .sort((a, b) => a.value - b.value);

  const pushedUp   = [...localDataFull].filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const pushedDown = [...localDataFull].filter((d) => d.value < 0).sort((a, b) => a.value - b.value).slice(0, 5);

  const topDriver = [...localDataFull].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  return (
    <>
      <div className="section-header">
        <span className="section-title">Feature Importance & Explainability</span>
        <div className="section-line" />
      </div>

      <div className="shap-grid">
        <div className="chart-card">
          <div className="chart-card__title">Global Feature Importance</div>
          <div className="chart-card__sub">
            {isBlendedEnsemble
              ? "Weighted blend of the four models' mean |SHAP|, using the ensemble weights"
              : "Mean |SHAP| impact: what matters across all forecasts"}
          </div>
          {globalData.length ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={globalData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: "#4f6180", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#8ba0be", fontSize: 11 }} width={160} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,.75)" }} labelStyle={{ color: "#e8ecf4", fontWeight: 700 }} itemStyle={{ color: "#c4cee0" }} cursor={{ fill: "rgba(255,255,255,.03)" }} formatter={(v) => v.toFixed(4)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={2}>
                  {globalData.map((_, i) => <Cell key={i} fill="#2171f5" />)}
                  <LabelList dataKey="value" position="right" formatter={(v) => v.toFixed(2)} style={{ fill: "#8ba0be", fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="shap-empty">No global SHAP data available for this model.</div>}
        </div>

        <div className="chart-card">
          <div className="chart-card__title">Local Decision Explanation</div>
          <div className="chart-card__sub">What drove this specific forecast: green pushes up, red pulls down</div>
          {localData.length ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={localData} layout="vertical" margin={{ left: 30, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: "#4f6180", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#8ba0be", fontSize: 11 }} width={160} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,.75)" }} labelStyle={{ color: "#e8ecf4", fontWeight: 700 }} itemStyle={{ color: "#c4cee0" }} cursor={{ fill: "rgba(255,255,255,.03)" }} formatter={(v) => v.toFixed(4)} />
                <ReferenceLine x={0} stroke="#263454" />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={2}>
                  {localData.map((d, i) => <Cell key={i} fill={d.value < 0 ? "#e2615f" : "#0d9e6a"} />)}
                  <LabelList dataKey="value" content={<DivergingValueLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="shap-empty">No local SHAP data available for this model.</div>}
        </div>
      </div>

      {localData.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 32 }}>
            <span className="section-title">Why The Model Made This Forecast</span>
            <div className="section-line" />
          </div>

          <div className="shap-narrative-grid">
            <div className="shap-narrative-card">
              <div className="shap-narrative-head shap-narrative-head--up">▲ What Increased The Forecast</div>
              {pushedUp.length ? pushedUp.map((d, i) => (
                <div key={i} className="shap-bullet">
                  <span className="shap-arrow shap-arrow--up">▲</span>
                  <span><strong>{d.label}</strong> pushed the forecast up (impact: +{d.value.toFixed(1)} index pts)</span>
                </div>
              )) : <div className="shap-bullet">No upward drivers identified.</div>}
            </div>

            <div className="shap-narrative-card">
              <div className="shap-narrative-head shap-narrative-head--down">▼ What Decreased The Forecast</div>
              {pushedDown.length ? pushedDown.map((d, i) => (
                <div key={i} className="shap-bullet">
                  <span className="shap-arrow shap-arrow--down">▼</span>
                  <span><strong>{d.label}</strong> pulled the forecast down (impact: {d.value.toFixed(1)} index pts)</span>
                </div>
              )) : <div className="shap-bullet">No downward drivers identified.</div>}
            </div>
          </div>

          {topDriver && (
            <div className="shap-plain-summary">
              <strong style={{ color: "#e8ecf4" }}>In plain terms:</strong> the single biggest factor behind
              this forecast was <strong>{topDriver.label}</strong>, meaning {getMeaning(topDriver.feature)}.
              That pushed the forecast {topDriver.value > 0 ? "higher" : "lower"} than it otherwise would have been.
            </div>
          )}
        </>
      )}
    </>
  );
}

function getMeaning(rawName) {
  return FEATURE_META[rawName]?.meaning ?? "a model input derived from the underlying pipeline data";
}