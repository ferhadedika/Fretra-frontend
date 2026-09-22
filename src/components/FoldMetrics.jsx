import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, LineChart, Line, Legend, Cell,
} from "recharts";
import { MODEL_COLORS } from "../utils/modelMeta";
import "../styles/folds.css";

function fmt(v, d = 2) {
  if (v === null || v === undefined) return "N/A";
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function FoldMetrics({ metrics, models, activeModelId }) {
  if (!metrics) {
    return <div className="fold-empty">No metrics data available. Ensure SCFI_model_metrics.json is loaded by the backend.</div>;
  }

  const foldData = metrics.fold_metrics?.[activeModelId] || [];
  const nSplits  = metrics.cv_config?.n_splits ?? "?";
  const activeModel = models.find((m) => m.id === activeModelId);

  const foldRows = foldData.map((f, i) => ({
    name: f.Model || `Fold ${i + 1}`,
    MAE:  f.MAE,
    RMSE: f.RMSE,
    MAPE: f["MAPE(%)"] ?? f["MAPE%"],
    R2:   f["R²"] ?? f.R2,
  }));

  const meanMae = foldRows.length
    ? foldRows.reduce((s, r) => s + (r.MAE ?? 0), 0) / foldRows.length
    : null;

  return (
    <>
      <div className="section-header">
        <span className="section-title">Cross-Validation Fold Breakdown</span>
        <div className="section-line" />
      </div>

      {foldRows.length === 0 ? (
        <div className="fold-empty">
          '{activeModel?.label}' doesn't produce per-fold metrics (e.g. the Ensemble blends other models' outputs rather than being cross-validated on its own). Switch the active model above to see fold-level detail.
        </div>
      ) : (
        <>
          <div className="chart-card">
            <div className="chart-card__title">Fold-by-Fold MAE · {activeModel?.label}</div>
            <div className="chart-card__sub">Expanding walk-forward CV · {nSplits} folds</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={foldRows} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#4f6180", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis tick={{ fill: "#4f6180", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,.75)" }}
                  labelStyle={{ color: "#e8ecf4", fontWeight: 700, marginBottom: 6 }}
                  itemStyle={{ color: "#c4cee0" }}
                  cursor={{ fill: "rgba(255,255,255,.03)" }}
                  formatter={(v) => fmt(v)}
                />
                {meanMae != null && (
                  <ReferenceLine
                    y={meanMae}
                    stroke="#3d8bff"
                    strokeDasharray="4 4"
                    label={{ value: `Mean: ${fmt(meanMae, 1)}`, fill: "#3d8bff", fontSize: 10, position: "top" }}
                  />
                )}
                <Bar dataKey="MAE" radius={[4, 4, 0, 0]}>
                  {foldRows.map((r, i) => {
                    const ratio = meanMae ? r.MAE / (meanMae * 2) : 0.5;
                    const color = ratio < 0.4 ? "#0d9e6a" : ratio < 0.7 ? "#e07b39" : "#c93a3a";
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" style={{ marginTop: 16 }}>
            <table className="cv-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Fold</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>MAPE%</th>
                  <th>R²</th>
                </tr>
              </thead>
              <tbody>
                {foldRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "left", color: "#8ba0be", fontWeight: 600 }}>{r.name}</td>
                    <td>{fmt(r.MAE, 1)}</td>
                    <td>{fmt(r.RMSE, 1)}</td>
                    <td>{fmt(r.MAPE, 2)}%</td>
                    <td>{fmt(r.R2, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {Object.keys(metrics.fold_metrics || {}).length > 1 && (
        <>
          <div className="section-header" style={{ marginTop: 32 }}>
            <span className="section-title">Cross-Model Fold MAE Comparison</span>
            <div className="section-line" />
          </div>

          <div className="chart-card">
            <div className="chart-card__sub">Walk-forward fold MAE across all models</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} vertical={false} />
                <XAxis type="number" dataKey="fold" domain={[1, nSplits]} tickCount={nSplits} tick={{ fill: "#4f6180", fontSize: 10.5 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} label={{ value: "Fold", fill: "#4f6180", fontSize: 10, position: "bottom" }} />
                <YAxis tick={{ fill: "#4f6180", fontSize: 10.5 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} label={{ value: "MAE", fill: "#4f6180", fontSize: 10, angle: -90, position: "insideLeft" }} width={54} />
                <Tooltip contentStyle={{ background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,.75)" }} labelStyle={{ color: "#e8ecf4", fontWeight: 700 }} itemStyle={{ color: "#c4cee0" }} cursor={{ stroke: "#3d4a68", strokeWidth: 1, strokeDasharray: "3 3" }} formatter={(v) => fmt(v, 1)} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8ba0be", paddingTop: 8 }} iconType="plainline" />
                {models.map((m) => {
                  const folds = metrics.fold_metrics?.[m.id] || [];
                  if (!folds.length) return null;
                  const data = folds.map((f, i) => ({ fold: i + 1, MAE: f.MAE }));
                  return (
                    <Line
                      key={m.id}
                      data={data}
                      type="monotone"
                      dataKey="MAE"
                      name={m.label}
                      stroke={MODEL_COLORS[m.id] || "#8ba0be"}
                      strokeWidth={m.id === activeModelId ? 3 : 1.75}
                      strokeOpacity={m.id === activeModelId ? 1 : 0.65}
                      dot={{ r: 3.5, fill: "#fff", stroke: MODEL_COLORS[m.id] || "#8ba0be", strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: MODEL_COLORS[m.id] || "#8ba0be", stroke: "#0c0d11", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}