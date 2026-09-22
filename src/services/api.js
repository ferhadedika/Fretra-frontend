import { supabase } from "../supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
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

export async function fetchMetrics() {
  return request("/api/metrics");
}

export async function fetchRollingLatest(horizonWeeks = 12) {
  return request(`/api/rolling-forecast/latest?horizon_weeks=${horizonWeeks}`);
}

export async function runRollingForecast(force = true) {
  return request("/api/rolling-forecast/run", {
    method: "POST",
    body: JSON.stringify({ force }),
  });
}
