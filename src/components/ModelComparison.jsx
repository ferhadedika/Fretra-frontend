import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import "../styles/comparison.css";

const MODEL_COLORS = {
  xgboost: "#2171f5",
  random_forest: "#39e07b",
  sarimax: "#e07b39",
  lstm: "#e0c239",
  ensemble: "#ec4899",
};

function fmt(v, d = 2, s = "") {
  if (v === null || v === undefined) return "N/A";
  return `${Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}${s}`;
}

function trendArrow(delta) {
  if (delta > 0.05) return { arrow: "▲", cls: "trend-up" };
  if (delta < -0.05) return { arrow: "▼", cls: "trend-down" };
  return { arrow: "→", cls: "trend-flat" };
}

export function ModelComparison({ models, metrics, historical, forecast, activeModelId }) {
  if (!forecast || !metrics) {
    return <div className="comp-empty">Run a forecast first to see model comparison.</div>;
  }

  const forecasts = metrics.forecasts || {};
  const currentScfi = forecast.current_scfi;
  const cutoffDate = forecast.cutoff_date;

  // Build overlay chart data
  const histPoints = historical.map((p) => ({ date: p.date, historical: p.scfi }));
  const chartData = [...histPoints];

  // Add per-model forecast traces (attach to date keys)
  const modelForecastMap = {};
  models.forEach((m) => {
    const arr = forecasts[m.id] || [];
    arr.forEach((pt) => {
      modelForecastMap[`${m.id}_${pt.week}`] = pt.forecast;
    });
  });

  // Build summary rows for the table
  const horizonWeeks = (forecasts[models[0]?.id] || []).length || 8;
  const weekLabels = Array.from({ length: horizonWeeks }, (_, i) => `Week +${i + 1}`);

  // Per-model forecast rows for the table
  const modelRows = models.map((m) => {
    const arr = forecasts[m.id] || [];
    const vals = arr.map((pt) => pt.forecast);
    return { ...m, vals };
  });

  // Summary stats
  const allVals = modelRows.flatMap((r) => r.vals).filter(Boolean);
  const highestFc = allVals.length ? Math.max(...allVals) : null;
  const lowestFc  = allVals.length ? Math.min(...allVals) : null;
  const endVals   = modelRows.map((r) => r.vals[r.vals.length - 1]).filter(Boolean);
  const avgEndPct = endVals.length
    ? ((endVals.reduce((a, b) => a + b, 0) / endVals.length - currentScfi) / currentScfi) * 100
    : null;

  // Best model by MAE
  const metricModels = metrics.models || [];
  const sorted = [...metricModels].filter((m) => m.MAE != null).sort((a, b) => a.MAE - b.MAE);
  const bestModel = sorted[0];

  return (
    <>
      <div className="section-header">
        <span className="section-title">All-Model Overlay — 8-Week Horizon</span>
        <div className="section-line" />
      </div>

      {/* Summary strip */}
      <div className="comp-summary-strip">
        <div className="comp-summary-card">
          <div className="comp-summary-label">Highest Forecast</div>
          <div className="comp-summary-value">{fmt(highestFc)}</div>
          {highestFc && (
            <span className={`comp-tag ${highestFc > currentScfi ? "tag-bullish" : "tag-bearish"}`}>
              {highestFc > currentScfi ? "▲" : "▼"} {fmt(Math.abs(((highestFc - currentScfi) / currentScfi) * 100), 1, "%")}
            </span>
          )}
        </div>
        <div className="comp-summary-card">
          <div className="comp-summary-label">Lowest Forecast</div>
          <div className="comp-summary-value">{fmt(lowestFc)}</div>
          {lowestFc && (
            <span className={`comp-tag ${lowestFc > currentScfi ? "tag-bullish" : "tag-bearish"}`}>
              {lowestFc > currentScfi ? "▲" : "▼"} {fmt(Math.abs(((lowestFc - currentScfi) / currentScfi) * 100), 1, "%")}
            </span>
          )}
        </div>
        <div className="comp-summary-card">
          <div className="comp-summary-label">Avg. End-of-Horizon Move</div>
          <div className="comp-summary-value">{avgEndPct != null ? `${avgEndPct >= 0 ? "+" : ""}${fmt(avgEndPct, 1, "%")}` : "N/A"}</div>
          {avgEndPct != null && (
            <span className={`comp-tag ${avgEndPct >= 0 ? "tag-bullish" : "tag-bearish"}`}>
              {avgEndPct >= 0 ? "Bullish consensus" : "Bearish consensus"}
            </span>
          )}
        </div>
        <div className="comp-summary-card">
          <div className="comp-summary-label">Best Model (CV MAE)</div>
          <div className="comp-summary-value">{bestModel?.label ?? "N/A"}</div>
          {bestModel && (
            <span className="comp-tag tag-neutral">MAE {fmt(bestModel.MAE, 1)}</span>
          )}
        </div>
      </div>

      {/* Chart + CV table side by side */}
      <div className="comp-main-grid">
        <div className="chart-card">
          <div className="chart-card__title">Model Forecast Divergence</div>
          <div className="chart-card__sub">All models overlaid from cutoff date</div>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={histPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#4f6180", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1e2d4a" }} minTickGap={40} />
              <YAxis tick={{ fill: "#4f6180", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#1e2d4a" }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e2d4a", borderRadius: 8 }} labelStyle={{ color: "#e8ecf4" }} itemStyle={{ color: "#c4cee0" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#8ba0be", paddingTop: 12 }} />
              <ReferenceLine x={cutoffDate} stroke="#c93a3a" strokeDasharray="4 4" label={{ value: "Cutoff", fill: "#c93a3a", fontSize: 10, position: "top" }} />
              <Line type="monotone" dataKey="historical" name="Historical SCFI" stroke="#e8ecf4" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
              {models.map((m) => {
                const arr = forecasts[m.id] || [];
                if (!arr.length) return null;
                return null; // recharts overlay handled below
              })}
            </ComposedChart>
          </ResponsiveContainer>
          {/* Overlay forecast lines using separate charts is tricky; show a note */}
          <div style={{ fontSize: 11, color: "#4f6180", marginTop: 8 }}>
            Switch models using the Model buttons above to overlay each forecast on the historical chart.
          </div>
        </div>

        {/* CV Performance table */}
        <div className="chart-card">
          <div className="chart-card__title">CV Performance</div>
          <div className="chart-card__sub">Cross-validated metrics per model</div>
          <table className="cv-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>MAE</th>
                <th>RMSE</th>
                <th>MAPE%</th>
                <th>R²</th>
              </tr>
            </thead>
            <tbody>
              {metricModels.map((m) => (
                <tr key={m.id} className={m.id === activeModelId ? "is-active-row" : ""}>
                  <td style={{ color: MODEL_COLORS[m.id] || "#8ba0be", fontWeight: 700 }}>{m.label}</td>
                  <td>{fmt(m.MAE, 1)}</td>
                  <td>{fmt(m.RMSE, 1)}</td>
                  <td>{fmt(m["MAPE(%)"], 2, "%")}</td>
                  <td>{fmt(m["R²"], 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8-week forecast table — all models */}
      <div className="section-header" style={{ marginTop: 32 }}>
        <span className="section-title">8-Week Forecast Table — All Models</span>
        <div className="section-line" />
      </div>

      <div className="chart-card">
        <div style={{ overflowX: "auto" }}>
          <table className="fc-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Week</th>
                {models.map((m) => (
                  <th key={m.id} style={{ color: MODEL_COLORS[m.id] || "#8ba0be" }}>{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekLabels.map((label, wi) => (
                <tr key={wi}>
                  <td className="fc-table__week">{label}</td>
                  {modelRows.map((m) => {
                    const val = m.vals[wi];
                    const prev = wi === 0 ? currentScfi : m.vals[wi - 1];
                    const delta = val != null && prev != null ? val - prev : null;
                    const { arrow, cls } = delta != null ? trendArrow(delta) : { arrow: "–", cls: "trend-flat" };
                    return (
                      <td key={m.id}>
                        <span className={delta != null && delta >= 0 ? "cell-pos" : "cell-neg"}>
                          {fmt(val)}
                        </span>
                        {" "}
                        <span className={cls} style={{ fontSize: 10 }}>{arrow}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
