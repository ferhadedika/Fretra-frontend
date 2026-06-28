/**
 * src/hooks/useScfi.js
 * ====================
 * Fetches the latest SCFI value directly from Supabase so the
 * "Current SCFI Index" KPI card always reflects the most recent
 * pipeline upload rather than whatever the backend last saw.
 *
 * Setup:
 *   Add to your frontend .env:
 *     VITE_SUPABASE_URL=https://xxxx.supabase.co
 *     VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 *   Install:
 *     npm install @supabase/supabase-js
 */

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  ?? "";
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY:", supabaseKey);

// Only create the client if credentials are configured
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Returns { currentScfi, latestDate, loading, error }
 * currentScfi is null if Supabase is not configured — the app
 * falls back to whatever the forecast API returns in that case.
 */
export function useScfi() {
  const [currentScfi,  setCurrentScfi]  = useState(null);
  const [latestDate,   setLatestDate]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!supabase) {
      // Supabase not configured — silently skip, app uses fallback
      setLoading(false);
      return;
    }

    async function fetchLatest() {
      try {
        setLoading(true);
        const { data, error: sbError } = await supabase
          .from("scfi_weekly")
          .select("date, scfi")
          .order("date", { ascending: false })
          .limit(1)
          .single();

        if (sbError) throw sbError;

        setCurrentScfi(data.scfi);
        setLatestDate(data.date);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLatest();

    // Re-fetch every 5 minutes in case the pipeline ran
    const interval = setInterval(fetchLatest, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { currentScfi, latestDate, loading, error };
}
