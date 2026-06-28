import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine,
} from "recharts";
import { FEATURE_META, humanize } from "../utils/featureMeta";
import "../styles/shap.css";

export function ShapPanel({ shap, activeModelId, metrics }) {
  const globalShapData = metrics?.shap_global?.[activeModelId] || [];
  const localShapData  = metrics?.shap_last_prediction?.[activeModelId] || [];

  const globalRaw = globalShapData.length
    ? globalShapData.map((d) => ({ feature: d.Feature || d.feature, value: d["Mean|SHAP|"] || d.value }))
    : shap?.global_importance || [];

  const localRaw = localShapData.length
    ? localShapData.map((d) => ({ feature: d.feature || d.Feature, value: d.shap_value || d.value }))
    : shap?.local_importance || [];

  const globalData = [...globalRaw]
    .map((d) => ({ ...d, label: humanize(d.feature || d.label) }))
    .sort((a, b) => a.value - b.value)
    .slice(-15);

  const localData = [...localRaw]
    .map((d) => ({ ...d, label: humanize(d.feature || d.label) }))
    .sort((a, b) => a.value - b.value);

  const pushedUp   = [...localData].filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const pushedDown = [...localData].filter((d) => d.value < 0).sort((a, b) => a.value - b.value).slice(0, 5);

  const topDriver = [...localData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];

  return (
    <>
      <div className="section-header">
        <span className="section-title">Feature Importance & Explainability</span>
        <div className="section-line" />
      </div>

      <div className="shap-grid">
        <div className="chart-card">
          <div className="chart-card__title">Global Feature Importance</div>
          <div className="chart-card__sub">Mean |SHAP| — what matters across all forecasts</div>
          {globalData.length ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={globalData} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: "#4f6180", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#8ba0be", fontSize: 11 }} width={160} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#16213d", border: "1px solid #2a3a5c", borderRadius: 8 }} labelStyle={{ color: "#e8ecf4" }} itemStyle={{ color: "#c4cee0" }} formatter={(v) => v.toFixed(4)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {globalData.map((_, i) => <Cell key={i} fill="#2171f5" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="shap-empty">No global SHAP data available for this model.</div>}
        </div>

        <div className="chart-card">
          <div className="chart-card__title">Local Decision Explanation</div>
          <div className="chart-card__sub">What drove this specific forecast — green pushes up, red pulls down</div>
          {localData.length ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={localData} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: "#4f6180", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#8ba0be", fontSize: 11 }} width={160} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#16213d", border: "1px solid #2a3a5c", borderRadius: 8 }} labelStyle={{ color: "#e8ecf4" }} itemStyle={{ color: "#c4cee0" }} formatter={(v) => v.toFixed(4)} />
                <ReferenceLine x={0} stroke="#263454" />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {localData.map((d, i) => <Cell key={i} fill={d.value < 0 ? "#e2615f" : "#0d9e6a"} />)}
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
              this forecast was <strong>{topDriver.label}</strong> — {getMeaning(topDriver.feature)}.
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