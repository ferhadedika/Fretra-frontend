const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : detail;
    } catch { /* keep statusText */ }
    throw new Error(`${res.status} ${detail}`);
  }

  return res.json();
}

export async function fetchModels() {
  return request("/api/models");
}

export async function fetchHistoricalSeries() {
  return request("/api/forecast/historical");
}

export async function runForecast({ modelId, horizonWeeks, saveToHistory = true }) {
  return request("/api/forecast", {
    method: "POST",
    body: JSON.stringify({
      model_id: modelId,
      horizon_weeks: horizonWeeks,
      save_to_history: saveToHistory,
    }),
  });
}

export async function fetchForecastHistory(limit = 50) {
  return request(`/api/forecast/history?limit=${limit}`);
}

export async function fetchShap(modelId, horizonWeeks = 8) {
  return request(`/api/shap/${modelId}?horizon_weeks=${horizonWeeks}`);
}

export async function fetchMetrics() {
  return request("/api/metrics");
}

export async function fetchHealth() {
  return request("/api/health");
}
