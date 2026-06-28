import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { useBaselines } from "../hooks/useBaselines";

const MODEL_COLOR = {
  xgboost:       "#2171f5",
  random_forest: "#39e07b",
  sarimax:       "#e07b39",
  lstm:          "#e0c239",
  ensemble:      "#ec4899",
};

function fmt(v, d = 2, s = "") {
  if (v === null || v === undefined) return "N/A";
  return `${Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}${s}`;
}

function ImprovementBadge({ value }) {
  if (value === null || value === undefined) return <span style={{ color: "var(--text-dim)" }}>—</span>;
  const positive = value > 0;
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 5,
      background: positive ? "rgba(13,158,106,.12)" : "rgba(201,58,58,.12)",
      color: positive ? "#0d9e6a" : "#e2615f",
      border: `1px solid ${positive ? "rgba(13,158,106,.3)" : "rgba(201,58,58,.3)"}`,
    }}>
      {positive ? "+" : ""}{fmt(value, 1, "%")}
    </span>
  );
}

export function BaselineComparison({ forecast, metrics, activeModelId, models }) {
  const { baselines, history, loading } = useBaselines();

  const currentScfi   = forecast?.current_scfi;
  const modelForecast = forecast?.forecast?.[0]?.forecast;
  const modelLabel    = forecast?.model?.label ?? activeModelId;
  const modelColor    = MODEL_COLOR[activeModelId] ?? "#2171f5";

  // Build chart data: last 12 weeks of history + W+1 forecast point
  const chartData = useMemo(() => {
    if (!history.length) return [];
    const hist = history.slice(-12).map((r) => ({
      date:       r.date,
      historical: r.scfi,
    }));

    // Add a forecast point one week after the last date
    if (baselines && currentScfi !== undefined) {
      const lastDate = new Date(history[history.length - 1].date);
      lastDate.setDate(lastDate.getDate() + 7);
      const forecastDate = lastDate.toISOString().split("T")[0];

      hist.push({
        date:           forecastDate,
        model:          modelForecast,
        naive:          baselines.naive.forecast,
        ma4:            baselines.ma4.forecast,
        ewm:            baselines.ewm.forecast,
        seasonal_naive: baselines.seasonal_naive.forecast,
      });
    }

    return hist;
  }, [history, baselines, modelForecast, currentScfi]);

  // Naive MAE from CV metrics for improvement calculation
  const naiveMae = metrics?.baselines?.find((b) => b.id === "naive")?.["MAE"];

  // Build comparison rows: ML models + baselines
  const mlRows = (metrics?.models ?? []).map((m) => ({
    id:      m.id,
    label:   m.label,
    mae:     m.MAE,
    rmse:    m.RMSE,
    mape:    m["MAPE(%)"],
    r2:      m["R²"],
    vsNaive: naiveMae ? ((naiveMae - m.MAE) / naiveMae) * 100 : null,
    isModel: true,
    color:   MODEL_COLOR[m.id] ?? "#8ba0be",
  }));

  const baselineRows = (metrics?.baselines ?? []).map((b) => ({
    id:      b.id,
    label:   b.label,
    mae:     b.MAE,
    rmse:    b.RMSE,
    mape:    b["MAPE(%)"],
    r2:      b["R²"],
    vsNaive: b.id === "naive" ? 0 : naiveMae ? ((naiveMae - b.MAE) / naiveMae) * 100 : null,
    isModel: false,
    color:   baselines?.[b.id]?.color ?? "#94a3b8",
  }));

  // If no CV baseline metrics yet, show live-only rows
  const liveBaselineRows = baselines
    ? Object.entries(baselines).map(([id, b]) => ({
        id,
        label:    b.label,
        mae:      null,
        rmse:     null,
        mape:     null,
        r2:       null,
        vsNaive:  null,
        isModel:  false,
        color:    b.color,
        liveOnly: true,
      }))
    : [];

  const tableRows = baselineRows.length > 0
    ? [...mlRows, ...baselineRows]
    : [...mlRows, ...liveBaselineRows];

  const cutoffDate  = history.length ? history[history.length - 1].date : null;
  // Force XAxis to include the forecast date by using all dates as the domain
  const xDomain     = chartData.map((d) => d.date);

  return (
    <>
      <div className="section-header">
        <span className="section-title">Baseline Comparison — Live W+1 Forecasts</span>
        <div className="section-line" />
      </div>

      {/* Live forecast summary strip */}
      {baselines && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}>
          {/* Active model card */}
          <div style={{
            background: "var(--bg-card)",
            border: `1px solid ${modelColor}`,
            borderRadius: "var(--radius)",
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: modelColor, marginBottom: 6 }}>
              {modelLabel} ★
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: modelColor, fontFamily: "var(--font-display)" }}>
              {fmt(modelForecast)}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 4 }}>Active model W+1</div>
          </div>

          {/* Baseline cards */}
          {Object.entries(baselines).map(([id, b]) => {
            const diff = modelForecast != null ? modelForecast - b.forecast : null;
            return (
              <div key={id} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "14px 16px",
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: b.color, marginBottom: 6 }}>
                  {b.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {fmt(b.forecast)}
                </div>
                {diff !== null && (
                  <div style={{ fontSize: 11, marginTop: 4, color: diff >= 0 ? "#0d9e6a" : "#e2615f", fontWeight: 600 }}>
                    Model {diff >= 0 ? "+" : ""}{fmt(diff, 1)} vs this
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{ color: "var(--text-dim)", fontSize: 13, padding: "12px 0" }}>
          Loading live baseline data from Supabase…
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-card__title">W+1 Forecast — Model vs All Baselines</div>
          <div className="chart-card__sub">Last 12 weeks of actuals + next-week forecast for each method</div>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} vertical={false} />
              <XAxis
                dataKey="date"
                type="category"
                domain={xDomain}
                allowDuplicatedCategory={false}
                tick={{ fill: "#4f6180", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#1e2d4a" }}
                minTickGap={30}
              />
              <YAxis
                tick={{ fill: "#4f6180", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#1e2d4a" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1e2d4a", borderRadius: 8 }}
                labelStyle={{ color: "#e8ecf4" }}
                itemStyle={{ color: "#c4cee0" }}
                formatter={(v) => fmt(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#8ba0be", paddingTop: 12 }} />
              {cutoffDate && (
                <ReferenceLine
                  x={cutoffDate}
                  stroke="#c93a3a"
                  strokeDasharray="4 4"
                  label={{ value: "Cutoff", fill: "#c93a3a", fontSize: 10, position: "top" }}
                />
              )}
              <Line type="monotone" dataKey="historical" name="Historical SCFI" stroke="#e8ecf4" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
              <Line type="monotone" dataKey="model" name={`${modelLabel} (W+1)`} stroke={modelColor} strokeWidth={2.5} dot={{ r: 5, fill: "#fff", stroke: modelColor, strokeWidth: 2 }} connectNulls isAnimationActive={false} />
              {baselines && Object.entries(baselines).map(([id, b]) => (
                <Line key={id} type="monotone" dataKey={id} name={b.label} stroke={b.color} strokeWidth={1.5} strokeDasharray="5 3" dot={{ r: 4, fill: "#fff", stroke: b.color, strokeWidth: 2 }} connectNulls isAnimationActive={false} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Metrics comparison table */}
      <div className="chart-card">
        <div className="chart-card__title">CV Performance — Models vs Baselines</div>
        <div className="chart-card__sub">
          {baselineRows.length > 0
            ? "Walk-forward cross-validated metrics. % improvement is vs Naïve benchmark."
            : "Run compute_baselines.py to populate CV metrics for baselines. Live W+1 forecasts shown above."}
        </div>
        <table className="cv-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Method</th>
              <th>MAE</th>
              <th>RMSE</th>
              <th>MAPE%</th>
              <th>R²</th>
              <th>vs Naïve</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((r) => (
              <tr key={r.id} className={r.id === activeModelId ? "is-active-row" : ""}>
                <td>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.label}</span>
                  {r.isModel && (
                    <span style={{
                      marginLeft: 6, fontSize: 9, fontWeight: 700,
                      padding: "1px 5px", borderRadius: 4,
                      background: "rgba(33,113,245,.12)",
                      color: "var(--accent-blue-bright)",
                      border: "1px solid rgba(33,113,245,.25)",
                    }}>ML</span>
                  )}
                  {r.liveOnly && (
                    <span style={{
                      marginLeft: 6, fontSize: 9, fontWeight: 700,
                      padding: "1px 5px", borderRadius: 4,
                      background: "rgba(139,160,190,.08)",
                      color: "var(--text-dim)",
                      border: "1px solid var(--border)",
                    }}>Live only</span>
                  )}
                </td>
                <td>{fmt(r.mae, 1)}</td>
                <td>{fmt(r.rmse, 1)}</td>
                <td>{fmt(r.mape, 2, "%")}</td>
                <td>{fmt(r.r2, 3)}</td>
                <td><ImprovementBadge value={r.vsNaive} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Methodology note */}
      <div style={{
        marginTop: 14, padding: "12px 16px",
        background: "#0d1424", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--text-muted)" }}>Methodology:</strong> Live W+1 forecasts are computed in real-time from the last 52 weeks of SCFI data in Supabase.
        CV metrics (MAE, RMSE, MAPE, R²) use the same {metrics?.baseline_cv_config?.n_splits ?? metrics?.cv_config?.n_splits ?? 5}-fold expanding walk-forward validation as the ML models, ensuring a fair comparison with no future data leakage.
      </div>
    </>
  );
}