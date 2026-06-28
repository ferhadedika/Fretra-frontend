import { useState, useCallback, useEffect } from "react";
import { fetchModels, fetchHistoricalSeries, runForecast, fetchShap, fetchMetrics } from "../services/api";

export function useForecast() {
  const [models, setModels] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [activeModelId, setActiveModelId] = useState("xgboost");
  const [horizonWeeks, setHorizonWeeks] = useState(8);
  const [forecast, setForecast] = useState(null);
  const [shap, setShap] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoadingInitial(true);
        const [modelsRes, historicalRes, metricsRes] = await Promise.all([
          fetchModels(),
          fetchHistoricalSeries(),
          fetchMetrics().catch(() => null),
        ]);
        if (cancelled) return;
        setModels(modelsRes);
        setHistorical(historicalRes);
        setMetrics(metricsRes);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const generateForecast = useCallback(async (modelId = activeModelId, weeks = horizonWeeks) => {
    setLoadingForecast(true);
    setError(null);
    try {
      const [forecastRes, shapRes] = await Promise.all([
        runForecast({ modelId, horizonWeeks: weeks }),
        fetchShap(modelId, weeks),
      ]);
      setForecast(forecastRes);
      setShap(shapRes);
      setActiveModelId(modelId);
      setHorizonWeeks(weeks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingForecast(false);
    }
  }, [activeModelId, horizonWeeks]);

  useEffect(() => {
    if (!loadingInitial && models.length > 0 && !forecast) {
      generateForecast(activeModelId, horizonWeeks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingInitial, models.length]);

  return {
    models,
    historical,
    activeModelId,
    horizonWeeks,
    forecast,
    shap,
    metrics,
    loadingInitial,
    loadingForecast,
    error,
    setHorizonWeeks,
    generateForecast,
  };
}