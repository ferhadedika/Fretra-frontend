import { useState, useCallback, useEffect, useMemo } from "react";
import {
  fetchModels, fetchHistoricalSeries, fetchMetrics,
  fetchRollingLatest, runRollingForecast,
} from "../services/api";

/**
 * Reshapes a RollingForecastResponse (all models, one shared run) into the
 * same ForecastResponse shape the dashboard's charts already expect
 * (model/current_scfi/cutoff_date/forecast[]), so ForecastChart,
 * ProjectionsLedger, and KpiRow don't need to change at all - only where
 * the data comes from changes (the always-current rolling pipeline
 * instead of an on-demand /api/forecast call).
 */
export function adaptRollingToForecast(rolling, modelId, models, historical) {
  if (!rolling) return null;
  const modelData = rolling.models.find((m) => m.model_name === modelId);
  if (!modelData) return null;

  const modelMeta = models.find((m) => m.id === modelId) || {};
  const lastHist = historical[historical.length - 1];

  let prev = lastHist ? lastHist.scfi : 0;
  const points = modelData.points
    .slice()
    .sort((a, b) => a.week_ahead - b.week_ahead)
    .map((p) => {
      const delta = Math.round((p.predicted_scfi - prev) * 100) / 100;
      prev = p.predicted_scfi;
      return {
        week: p.week_ahead, date: p.target_week, forecast: p.predicted_scfi, delta,
        // Approximate confidence band - see backend orchestrator.py's
        // _confidence_interval() docstring. Not a rigorous statistical
        // interval; widens with horizon via sqrt(week_ahead) scaling.
        lowerBound: p.lower_bound ?? null,
        upperBound: p.upper_bound ?? null,
      };
    });

  return {
    model: {
      id: modelId,
      label: modelData.label,
      mae: modelMeta.mae ?? null,
      rmse: modelMeta.rmse ?? null,
      mape_pct: modelMeta.mape_pct ?? null,
      r2: modelMeta.r2 ?? null,
    },
    current_scfi: lastHist ? lastHist.scfi : 0,
    cutoff_date: rolling.latest_actual_week,
    forecast: points,
  };
}

/**
 * Same rolling run, but ALL models at once (not just activeModelId) in the
 * simple {date, forecast} shape ModelComparison's overlay chart / all-model
 * table expect - so that view stops reading the frozen training-time
 * `metrics.forecasts` snapshot and shows the live rolling forecast too.
 */
export function adaptRollingToForecastsByModel(rolling, horizonWeeks) {
  if (!rolling) return {};
  const out = {};
  for (const modelData of rolling.models) {
    out[modelData.model_name] = modelData.points
      .filter((p) => p.week_ahead <= horizonWeeks)
      .slice()
      .sort((a, b) => a.week_ahead - b.week_ahead)
      .map((p) => ({ date: p.target_week, forecast: p.predicted_scfi }));
  }
  return out;
}

/** Live local SHAP for the newest rolling prediction. Global importance is
 * intentionally left empty here - ShapPanel already falls back to the
 * static training-time global importance in `metrics`, which is correct:
 * global importance isn't meant to shift with new data, only local is. */
export function adaptRollingToShap(rolling, modelId) {
  if (!rolling) return null;
  const modelData = rolling.models.find((m) => m.model_name === modelId);
  if (!modelData) return null;
  return {
    model_id: modelId,
    global_importance: [],
    local_importance: modelData.local_importance,
  };
}

// `enabled` should track whether the user is signed in: every endpoint here
// requires a session, so fetching while logged out just 401s - and since this
// hook lives at the App root, it would otherwise fire on every public page and
// never retry after a login that doesn't reload the page.
export function useForecast(enabled = true) {
  const [models, setModels] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [activeModelId, setActiveModelId] = useState("xgboost");
  const [horizonWeeks, setHorizonWeeks] = useState(8);
  const [rolling, setRolling] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    async function init() {
      try {
        setLoadingInitial(true);
        setError(null);
        const [modelsRes, historicalRes, metricsRes, rollingRes] = await Promise.all([
          fetchModels(),
          fetchHistoricalSeries(),
          fetchMetrics().catch(() => null),
          fetchRollingLatest(12).catch(() => null),
        ]);
        if (cancelled) return;
        setModels(modelsRes);
        setHistorical(historicalRes);
        setMetrics(metricsRes);
        setRolling(rollingRes);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [enabled]);

  // Force-generate a rolling forecast (e.g. no run exists yet, or the user
  // clicked "Refresh") and reload the latest run afterward.
  const refreshForecast = useCallback(async () => {
    setLoadingForecast(true);
    setError(null);
    try {
      await runRollingForecast(true);
      const rollingRes = await fetchRollingLatest(12);
      setRolling(rollingRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingForecast(false);
    }
  }, []);

  // If nothing's ever been generated yet (e.g. fresh deployment, poller
  // hasn't ticked), kick off the first run automatically.
  useEffect(() => {
    if (!loadingInitial && models.length > 0 && !rolling && !loadingForecast) {
      refreshForecast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingInitial, models.length, rolling]);

  const forecast = useMemo(() => {
    const full = adaptRollingToForecast(rolling, activeModelId, models, historical);
    if (!full) return null;
    return { ...full, forecast: full.forecast.filter((p) => p.week <= horizonWeeks) };
  }, [rolling, activeModelId, models, historical, horizonWeeks]);

  const shap = useMemo(
    () => adaptRollingToShap(rolling, activeModelId),
    [rolling, activeModelId]
  );

  const forecastsByModel = useMemo(
    () => adaptRollingToForecastsByModel(rolling, horizonWeeks),
    [rolling, horizonWeeks]
  );

  const rollingMeta = rolling
    ? {
        runId: rolling.run_id,
        forecastCreatedAt: rolling.forecast_created_at,
        latestActualWeek: rolling.latest_actual_week,
      }
    : null;

  return {
    models,
    historical,
    activeModelId,
    horizonWeeks,
    forecast,
    shap,
    forecastsByModel,
    metrics,
    rollingMeta,
    loadingInitial,
    loadingForecast,
    error,
    setHorizonWeeks,
    setActiveModelId,
    refreshForecast,
  };
}
