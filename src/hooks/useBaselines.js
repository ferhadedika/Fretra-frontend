/**
 * src/hooks/useBaselines.js
 * ==========================
 * Fetches recent SCFI history from Supabase and computes live baseline
 * forecasts for the current week:
 *   - Naïve (last value)
 *   - MA4 (last 4 rows' average)
 *   - EWM (exponential weighted mean, α=0.3, over fetched history)
 *   - Seasonal Naïve (value from exactly 52 calendar weeks ago, found by
 *     date - NOT by counting back 52 rows, since scfi_weekly's row
 *     cadence isn't consistently 1-row-per-week throughout its history)
 */

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

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

/**
 * Finds the row whose date is closest to `targetDate`. Needed because
 * scfi_weekly's row cadence isn't reliably 1-row-per-week throughout its
 * history (a stretch of the table has alternating 3/4-day gaps instead of
 * 7 - a scraper data artifact), so "N rows back" is NOT the same as
 * "N weeks back". Only a real calendar-date lookup is robust to that.
 */
function closestRowByDate(sortedRows, targetDate) {
  let best = null;
  let bestDiffMs = Infinity;
  for (const row of sortedRows) {
    const diff = Math.abs(new Date(row.date) - targetDate);
    if (diff < bestDiffMs) {
      bestDiffMs = diff;
      best = row;
    }
  }
  return best;
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

        // Fetch a generous 200-row window (descending), then re-sort
        // ascending. Deliberately NOT just "52 rows" - part of this
        // table's history has doubled row density (alternating 3/4-day
        // gaps instead of 7), so counting rows back doesn't reliably land
        // 52 CALENDAR weeks back. 200 rows comfortably covers 52 weeks
        // even through that denser stretch; the actual 52-week lookup
        // below is done by calendar date, not row count.
        const { data, error: sbErr } = await supabase
          .from("scfi_weekly")
          .select("date, scfi")
          .order("date", { ascending: false })
          .limit(200);

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

        // True "52 weeks ago" by calendar date, not row count (see
        // closestRowByDate's docstring for why row count isn't safe here).
        const latestDate = new Date(sorted[sorted.length - 1].date);
        const targetDate = new Date(latestDate);
        targetDate.setDate(targetDate.getDate() - 364);
        const earliestDate = new Date(sorted[0].date);
        const seasonal = earliestDate <= targetDate
          ? closestRowByDate(sorted, targetDate).scfi
          : last;

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