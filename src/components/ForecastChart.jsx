import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import "../styles/chart.css";

const MODEL_COLORS = {
  xgboost: "#2171f5",
  random_forest: "#39e07b",
  sarimax: "#e07b39",
  lstm: "#e0c239",
  ensemble: "#ec4899",
};

function buildChartData(historical, forecast) {
  const histPoints = historical.map((p) => ({
    date: p.date,
    historical: p.scfi,
  }));

  if (!forecast) return histPoints;

  const cutoffDate = forecast.cutoff_date;
  const merged = histPoints.map((p) =>
    p.date === cutoffDate ? { ...p, forecast: p.historical } : p
  );

  forecast.forecast.forEach((fp) => {
    merged.push({ date: fp.date, forecast: fp.forecast });
  });

  return merged;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: entry.color }} />
          {entry.name}: {entry.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      ))}
    </div>
  );
}

export function ForecastChart({ historical, forecast, modelId }) {
  const data = buildChartData(historical, forecast);
  const color = MODEL_COLORS[modelId] || "#2171f5";

  return (
    <div className="chart-card">
      <div className="chart-card__title">
        SCFI Composite — Actuals &amp; {forecast?.model.label || ""} Forecast
      </div>
      <div className="chart-card__sub">Original scale · Index points (800–5,000)</div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4f6180", fontSize: 10 }}
            tickLine={{ stroke: "#1e2d4a" }}
            axisLine={{ stroke: "#1e2d4a" }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#4f6180", fontSize: 10 }}
            tickLine={{ stroke: "#1e2d4a" }}
            axisLine={{ stroke: "#1e2d4a" }}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8ba0be" }} />
          {forecast && (
            <ReferenceLine
              x={forecast.cutoff_date}
              stroke="#c93a3a"
              strokeDasharray="4 4"
              label={{ value: "Cutoff", fill: "#c93a3a", fontSize: 10, position: "top" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="historical"
            name="Historical SCFI"
            stroke="#e8ecf4"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name={forecast?.model.label || "Forecast"}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#fff", stroke: color, strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
