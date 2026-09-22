// src/utils/modelMeta.js
// Single source of truth for per-model display color, used by every chart
// that plots more than one model (ForecastChart, ModelComparison,
// FoldMetrics, BaselinesComparison). Previously copy-pasted identically
// into each of those files - keeping it here means a color change or a
// new model only needs to happen in one place.

export const MODEL_COLORS = {
  xgboost: "#2171f5",
  random_forest: "#39e07b",
  sarimax: "#e07b39",
  lstm: "#e0c239",
  ensemble: "#ec4899",
};
