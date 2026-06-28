/**
 * src/hooks/useBaselines.js
 * ==========================
 * Fetches the last 52 weeks of SCFI from Supabase and computes
 * live baseline forecasts for the current week:
 *   - Naïve (last value)
 *   - MA4 (4-week moving average)
 *   - EWM (exponential weighted mean, α=0.3)
 *   - Seasonal Naïve (value from 52 weeks ago)
 */

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

function ewm(values, alpha = 0.3) {
  if (!values.length) return null;
  let result = values[0];
  for (let i = 1; i < values.length; i++) {
    result = alpha * values[i] + (1 - alpha) * result;
  }
  return result;
}

function ma(values, n = 4) {
  const slice = values.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function useBaselines() {
  const [baselines, setBaselines] = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch the most recent 52 weeks (descending), then re-sort ascending
        const { data, error: sbErr } = await supabase
          .from("scfi_weekly")
          .select("date, scfi")
          .order("date", { ascending: false })
          .limit(52);

        if (sbErr) throw sbErr;
        if (!data || data.length === 0) {
          setLoading(false);
          return;
        }

        // Re-sort chronologically for display and calculations
        const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        setHistory(sorted);

        const values   = sorted.map((r) => r.scfi);
        const last     = values[values.length - 1];
        const seasonal = values.length >= 52 ? values[0] : last;

        setBaselines({
          naive:          { label: "Naïve",                   forecast: last,          color: "#94a3b8" },
          ma4:            { label: "Moving Avg (4-week)",     forecast: ma(values, 4), color: "#f59e0b" },
          ewm:            { label: "Exp. Smoothing (α=0.3)",  forecast: ewm(values),   color: "#10b981" },
          seasonal_naive: { label: "Seasonal Naïve",          forecast: seasonal,      color: "#8b5cf6" },
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { baselines, history, loading, error };
}