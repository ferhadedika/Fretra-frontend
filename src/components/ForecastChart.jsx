import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Brush,
} from "recharts";
import { RangeSelector, sliceByRange } from "./ui/fx";
import { MODEL_COLORS } from "../utils/modelMeta";
import "../styles/chart.css";

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
    const point = { date: fp.date, forecast: fp.forecast };
    // Approximate confidence band (see backend orchestrator.py) - Recharts
    // renders a [min, max] tuple as a filled band for a single Area.
    if (fp.lowerBound != null && fp.upperBound != null) {
      point.band = [fp.lowerBound, fp.upperBound];
    }
    merged.push(point);
  });

  return merged;
}

function compactNumber(v) {
  if (v === null || v === undefined) return "";
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__label">
            <span className="chart-tooltip__dot" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="chart-tooltip__val">
            {entry.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ForecastChart({ historical, forecast, modelId }) {
  const [range, setRange] = useState("all");
  const fullData = useMemo(() => buildChartData(historical, forecast), [historical, forecast]);
  const data = useMemo(() => sliceByRange(fullData, range), [fullData, range]);
  const color = MODEL_COLORS[modelId] || "#2171f5";

  const brushStart = Math.max(0, data.length - Math.min(data.length, 60));

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="chart-card__meta">
          <div className="chart-card__title">
            SCFI Composite: Actuals &amp; {forecast?.model.label || ""} Forecast
          </div>
          <div className="chart-card__sub">Original scale · Index points (800 to 5,000) · Drag the handles below to zoom</div>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 10, right: 24, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8ecf4" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#e8ecf4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2d4a" strokeWidth={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4f6180", fontSize: 10.5 }}
            tickLine={{ stroke: "#1e2d4a" }}
            axisLine={{ stroke: "#1e2d4a" }}
            minTickGap={44}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tick={{ fill: "#4f6180", fontSize: 10.5 }}
            tickLine={{ stroke: "#1e2d4a" }}
            axisLine={{ stroke: "#1e2d4a" }}
            domain={["auto", "auto"]}
            tickFormatter={compactNumber}
            width={54}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#3d4a68", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8ba0be", paddingTop: 10 }} iconType="plainline" />
          {forecast && (
            <ReferenceLine
              x={forecast.cutoff_date}
              stroke="#c93a3a"
              strokeDasharray="4 4"
              label={{ value: "Cutoff", fill: "#c93a3a", fontSize: 10, position: "top" }}
            />
          )}
          <Area
            type="monotone"
            dataKey="historical"
            name="Historical SCFI"
            stroke="#e8ecf4"
            strokeWidth={1.5}
            fill="url(#histFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#e8ecf4", stroke: "#0c0d11", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
            legendType="line"
          />
          {forecast && (
            <Area
              type="monotone"
              dataKey="band"
              name="~95% approx. range"
              stroke="none"
              fill={color}
              fillOpacity={0.12}
              connectNulls
              isAnimationActive={false}
              legendType="none"
              tooltipType="none"
            />
          )}
          <Area
            type="monotone"
            dataKey="forecast"
            name={forecast?.model.label || "Forecast"}
            stroke={color}
            strokeWidth={2.5}
            fill="url(#fcFill)"
            dot={{ r: 3, fill: "#fff", stroke: color, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color, stroke: "#0c0d11", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
            legendType="line"
          />
          <Brush
            dataKey="date"
            height={26}
            travellerWidth={9}
            startIndex={brushStart}
            stroke="#323546"
            fill="#13141a"
            tickFormatter={() => ""}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
