import "../styles/kpi.css";
import { useScfi } from "../hooks/useScfi";

function fmt(value, decimals = 2, suffix = "") {
  if (value === null || value === undefined) return "N/A";
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function Tooltip({ text }) {
  return (
    <span className="kpi-tooltip">
      i
      <span className="kpi-tooltip__bubble">{text}</span>
    </span>
  );
}

export function KpiRow({ forecast, metrics, activeModelId, models }) {
  // ── Hooks must always be first, before any early return ──
  const { currentScfi: liveScfi, latestDate: liveDate } = useScfi();

  if (!forecast) return null;

  const { current_scfi: fc_scfi, forecast: points, model } = forecast;

  // Use live Supabase value if available, fall back to forecast payload
  const current_scfi = liveScfi ?? fc_scfi;
  const cutoff_date  = liveDate  ?? forecast.cutoff_date;

  const wPlus1 = points[0];
  const wLast  = points[points.length - 1];

  const w1Delta  = wPlus1.forecast - current_scfi;
  const w1Pct    = (w1Delta / current_scfi) * 100;
  const trajPct  = ((wLast.forecast - current_scfi) / current_scfi) * 100;
  const trajLabel = trajPct >= 0 ? "Bullish outlook" : "Bearish outlook";

  // Pull per-model metrics from the metrics JSON if available
  const modelMetrics = metrics?.models?.find((m) => m.id === activeModelId);
  const mae  = modelMetrics?.MAE          ?? model.mae;
  const rmse = modelMetrics?.RMSE         ?? model.rmse;
  const mape = modelMetrics?.["MAPE(%)"]  ?? model.mape_pct;
  const r2   = modelMetrics?.["R²"]       ?? model.r2;

  const nSplits    = metrics?.cv_config?.n_splits ?? "?";
  const ensWeights = metrics?.ensemble_weights;
  const isEnsemble = activeModelId === "ensemble";

  return (
    <>
      {/* Row 1 — headline */}
      <div className="kpi-grid kpi-grid--headline">
        <div className="kpi-card kpi-card--neutral">
          <div className="kpi-card__title">Current SCFI Index</div>
          <div className="kpi-card__value">{fmt(current_scfi)}</div>
          <div className="kpi-card__sub">Ground truth — {cutoff_date}</div>
        </div>

        <div className="kpi-card kpi-card--blue">
          <div className="kpi-card__title">W+1 Forecast</div>
          <div className="kpi-card__value kpi-card__value--blue">{fmt(wPlus1.forecast)}</div>
          <div className="kpi-card__sub">{model.label}</div>
          <div className={`kpi-card__delta ${w1Delta >= 0 ? "is-pos" : "is-neg"}`}>
            {w1Delta >= 0 ? "+" : ""}{fmt(w1Delta)} / {w1Pct >= 0 ? "+" : ""}{fmt(w1Pct, 2, "%")}
          </div>
        </div>

        <div className="kpi-card kpi-card--green">
          <div className="kpi-card__title">{points.length}-Week Trajectory</div>
          <div className={`kpi-card__value ${trajPct >= 0 ? "kpi-card__value--green" : ""}`}>
            {trajPct >= 0 ? "+" : ""}{fmt(trajPct, 1, "%")}
          </div>
          <div className="kpi-card__sub">Projected cumulative move</div>
          <div className={`kpi-card__delta ${trajPct >= 0 ? "is-pos" : "is-neg"}`}>{trajLabel}</div>
        </div>
      </div>

      {/* Row 2 — accuracy KPIs */}
      <div className="section-header" style={{ marginBottom: 14 }}>
        <span className="section-title">Model Accuracy — {model.label} (Cross-Validated)</span>
        <div className="section-line" />
      </div>

      <div className="kpi-grid kpi-grid--accuracy">
        <div className="kpi-card kpi-card--mini">
          <div className="kpi-card__title">
            MAE
            <Tooltip text="Mean Absolute Error — the average size of the model's miss, in SCFI index points, ignoring direction. Lower is better." />
          </div>
          <div className="kpi-card__value kpi-card__value--orange">{fmt(mae, 1)}</div>
          <div className="kpi-card__sub">Avg. error, original SCFI scale</div>
        </div>

        <div className="kpi-card kpi-card--mini">
          <div className="kpi-card__title">
            RMSE
            <Tooltip text="Root Mean Squared Error — like MAE, but penalizes large misses more heavily. A big gap between RMSE and MAE means occasional very large errors." />
          </div>
          <div className="kpi-card__value kpi-card__value--orange">{fmt(rmse, 1)}</div>
          <div className="kpi-card__sub">Penalizes large misses more</div>
        </div>

        <div className="kpi-card kpi-card--mini">
          <div className="kpi-card__title">
            MAPE
            <Tooltip text="Mean Absolute Percentage Error — the average error as a percentage of actual SCFI value. Easier to compare across different rate levels than MAE." />
          </div>
          <div className="kpi-card__value kpi-card__value--orange">{fmt(mape, 2, "%")}</div>
          <div className="kpi-card__sub">Error as % of actual rate</div>
        </div>

        <div className="kpi-card kpi-card--mini">
          <div className="kpi-card__title">
            R²
            <Tooltip text="R-squared — the share of week-to-week SCFI movement the model explains, from 0 to 1. Closer to 1 is better." />
          </div>
          <div className="kpi-card__value kpi-card__value--orange">{fmt(r2, 3)}</div>
          <div className="kpi-card__sub">Variance explained (0–1)</div>
        </div>

        {/* 5th card: ensemble blend or CV config */}
        {isEnsemble && ensWeights ? (
          <div className="kpi-card kpi-card--mini" style={{ borderColor: "rgba(236,72,153,.35)" }}>
            <div className="kpi-card__title" style={{ color: "#ec4899" }}>
              Ensemble Blend
              <Tooltip text="How much weight the final forecast gives to each underlying model. Weights are optimised automatically to minimise overall error." />
            </div>
            <div className="kpi-card__value" style={{ color: "#ec4899" }}>
              {ensWeights.xgboost?.toFixed(3)}
            </div>
            <div className="kpi-card__sub">
              XGB {ensWeights.xgboost?.toFixed(3)} &nbsp;/&nbsp;{" "}
              {Object.entries(ensWeights)
                .filter(([k]) => k !== "xgboost")
                .map(([k, v]) => `${k.toUpperCase()} ${v.toFixed(3)}`)
                .join(" ")}
            </div>
          </div>
        ) : (
          <div className="kpi-card kpi-card--mini" style={{ borderColor: "rgba(164,99,242,.35)" }}>
            <div className="kpi-card__title" style={{ color: "#a463f2" }}>
              CV Configuration
              <Tooltip text="How the model's accuracy above was actually measured — see the Fold-Level CV Metrics tab for the full breakdown." />
            </div>
            <div className="kpi-card__value" style={{ color: "#a463f2" }}>{nSplits}</div>
            <div className="kpi-card__sub">{nSplits} expanding walk-forward folds</div>
          </div>
        )}
      </div>

      {/* CV explainer strip */}
      <div className="cv-strip">
        <div className="cv-strip__item">
          <strong>TimeSeriesSplit</strong>
          <Tooltip text="A cross-validation method built for time-ordered data: each fold trains only on the past and tests on the period right after it — never on future data." />
        </div>
        <div className="cv-strip__item">
          <strong>Expanding Walk-Forward Folds</strong>
          <Tooltip text="Each successive fold adds more historical data to the training set and then tests on the next unseen chunk of weeks, mimicking real-world retraining." />
        </div>
        <div className="cv-strip__item">
          <strong>Number of Folds: {nSplits}</strong>
          <Tooltip text="How many separate train/test splits were run. More folds give a more reliable accuracy estimate." />
        </div>
        <div className="cv-strip__item">
          <strong>Why CV Matters</strong>
          <Tooltip text="Without proper cross-validation, a model can look highly accurate just by memorizing patterns it already saw. Walk-forward CV tests the model only on weeks it never saw during training." />
        </div>
      </div>
    </>
  );
}
