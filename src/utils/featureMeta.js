// src/utils/featureMeta.js
// Single source of truth for all feature metadata.
// Mirrors backend/model_artifacts/feature_config.json's `ml_features`
// list exactly (68 features) - every key here is a real model input.

export const FEATURE_META = {

  // ── Core exogenous levels ─────────────────────────────────────────────────
  Brent_Oil: {
    label:   "Brent Crude Oil Price (USD/bbl)",
    source:  "EIA / FRED (DCOILBRENTEU)",
    meaning: "Spot price of Brent crude oil in USD per barrel, the global oil benchmark.",
    why:     "Bunker fuel is the largest variable cost for container shipping. Rising oil prices squeeze carrier margins and are frequently passed through as fuel surcharges, pushing freight rates up.",
    color:   "#f59e0b",
  },
  CNY_USD: {
    label:   "CNY / USD Exchange Rate",
    source:  "FRED (DEXCHUS)",
    meaning: "Chinese yuan per US dollar. A higher number means a weaker yuan.",
    why:     "China is the origin of most containerized exports. A weaker yuan makes Chinese goods cheaper for foreign buyers, boosting export volumes and demand for shipping capacity.",
    color:   "#10b981",
  },
  World_PMI: {
    label:   "Manufacturing PMI (Global)",
    source:  "S&P Global / JPMorgan",
    meaning: "Purchasing Managers' Index for manufacturing. Above 50 = expansion, below 50 = contraction. (Only the manufacturing series feeds the model - services PMI is scraped but not used here.)",
    why:     "Manufacturing activity directly drives demand for containerized goods. A rising PMI signals more factory output and therefore more cargo to ship.",
    color:   "#3b82f6",
  },
  Trade_Volume_Index: {
    label:   "World Trade Volume Index",
    source:  "CPB Netherlands Bureau for Economic Policy Analysis",
    meaning: "A monthly index of global merchandise trade volumes, rebased to a reference period and forward-filled to weekly.",
    why:     "Directly measures the physical volume of goods crossing borders. When trade volume rises, container demand rises with it, pushing freight rates up.",
    color:   "#ec4899",
  },
  Trade_Volume_YoY: {
    label:   "World Trade Volume YoY Growth (%)",
    source:  "CPB Netherlands Bureau for Economic Policy Analysis",
    meaning: "Year-on-year percentage change in world trade volume, computed on the monthly series before weekly resampling.",
    why:     "The growth rate of trade captures acceleration or deceleration in demand, which is often more informative than the level alone for forecasting rate direction.",
    color:   "#f43f5e",
  },

  // ── Calendar ───────────────────────────────────────────────────────────────
  year: {
    label:   "Year",
    source:  "Derived (calendar)",
    meaning: "Calendar year of the observation.",
    why:     "Captures long-term structural trend in freight rates across years (e.g. post-pandemic capacity growth).",
    color:   "#94a3b8",
  },
  month: {
    label:   "Month",
    source:  "Derived (calendar)",
    meaning: "Calendar month (1-12).",
    why:     "Monthly seasonality - Chinese New Year in Jan/Feb causes a well-known freight rate dip-then-spike pattern.",
    color:   "#94a3b8",
  },
  week_of_year: {
    label:   "Week of Year",
    source:  "Derived (calendar)",
    meaning: "ISO week number (1-52).",
    why:     "Fine-grained seasonal signal capturing intra-year rate patterns tied to shipping schedules and holidays.",
    color:   "#64748b",
  },
  Q2: { label: "Q2 Dummy (Apr-Jun)", source: "Derived (calendar)", meaning: "1 if the week falls in Q2, else 0.", why: "Q2 is historically the start of the shipping peak season as retailers begin restocking for summer.", color: "#334155" },
  Q3: { label: "Q3 Dummy (Jul-Sep)", source: "Derived (calendar)", meaning: "1 if the week falls in Q3, else 0.", why: "Q3 is peak season - typically the highest freight rate quarter of the year.", color: "#334155" },
  Q4: { label: "Q4 Dummy (Oct-Dec)", source: "Derived (calendar)", meaning: "1 if the week falls in Q4, else 0.", why: "Q4 carries mixed signals: an early holiday-inventory rush followed by year-end capacity cuts (blank sailings).", color: "#334155" },

  Month_Feb: { label: "February Dummy",  source: "Derived (calendar)", meaning: "1 if the week falls in February, else 0.",  why: "Chinese New Year effect - freight rates typically spike before and dip after factories close.", color: "#475569" },
  Month_Mar: { label: "March Dummy",     source: "Derived (calendar)", meaning: "1 if the week falls in March, else 0.",     why: "Post-CNY restocking surge often visible in March rates.", color: "#475569" },
  Month_Apr: { label: "April Dummy",     source: "Derived (calendar)", meaning: "1 if the week falls in April, else 0.",     why: "Q2 start - early peak season preparation begins.", color: "#475569" },
  Month_May: { label: "May Dummy",       source: "Derived (calendar)", meaning: "1 if the week falls in May, else 0.",       why: "Pre-summer peak - US/EU importers stock up ahead of summer retail season.", color: "#475569" },
  Month_Jun: { label: "June Dummy",      source: "Derived (calendar)", meaning: "1 if the week falls in June, else 0.",      why: "Peak season onset - one of the busiest months for Trans-Pacific trade.", color: "#475569" },
  Month_Jul: { label: "July Dummy",      source: "Derived (calendar)", meaning: "1 if the week falls in July, else 0.",      why: "Core peak season - high demand for back-to-school and holiday inventory.", color: "#475569" },
  Month_Aug: { label: "August Dummy",    source: "Derived (calendar)", meaning: "1 if the week falls in August, else 0.",    why: "Late peak season - final push before Q4 holiday inventory cutoffs.", color: "#475569" },
  Month_Sep: { label: "September Dummy", source: "Derived (calendar)", meaning: "1 if the week falls in September, else 0.", why: "Transition month - peak season winds down, Golden Week preparation begins.", color: "#475569" },
  Month_Oct: { label: "October Dummy",   source: "Derived (calendar)", meaning: "1 if the week falls in October, else 0.",   why: "Golden Week in China causes scheduling disruptions and rate volatility.", color: "#475569" },
  Month_Nov: { label: "November Dummy",  source: "Derived (calendar)", meaning: "1 if the week falls in November, else 0.",  why: "Pre-holiday final push - Black Friday/Cyber Monday import wave.", color: "#475569" },
  Month_Dec: { label: "December Dummy",  source: "Derived (calendar)", meaning: "1 if the week falls in December, else 0.",  why: "Year-end slowdown - blank sailings increase as carriers reduce capacity.", color: "#475569" },

  // ── Lags: SCFI's own WEEK-OVER-WEEK CHANGE (not the level - the model
  //    predicts ΔSCFI, so its own past changes are autoregressive inputs) ────
  DSCFI_lag1:  { label: "SCFI Weekly Change — 1 Week Lag",  source: "Derived", meaning: "The week-over-week CHANGE in SCFI (not the level) from 1 week ago.", why: "Immediate momentum signal - the single strongest short-term predictor of next week's change.", color: "#6366f1" },
  DSCFI_lag2:  { label: "SCFI Weekly Change — 2 Week Lag",  source: "Derived", meaning: "The week-over-week change in SCFI from 2 weeks ago.", why: "Captures short-term trend continuation or reversal in the rate of change itself.", color: "#7c3aed" },
  DSCFI_lag3:  { label: "SCFI Weekly Change — 3 Week Lag",  source: "Derived", meaning: "The week-over-week change in SCFI from 3 weeks ago.", why: "Bridges short and medium-term momentum signals in the change series.", color: "#8b5cf6" },
  DSCFI_lag4:  { label: "SCFI Weekly Change — 4 Week Lag",  source: "Derived", meaning: "The week-over-week change in SCFI from 4 weeks ago (≈1 month).", why: "Monthly momentum anchor - captures the typical booking-to-sailing lag in container shipping.", color: "#a78bfa" },
  DSCFI_lag8:  { label: "SCFI Weekly Change — 8 Week Lag",  source: "Derived", meaning: "The week-over-week change in SCFI from 8 weeks ago (≈2 months).", why: "Captures medium-term supply-demand cycles including vessel scheduling and blank-sailing announcements.", color: "#c4b5fd" },
  DSCFI_lag12: { label: "SCFI Weekly Change — 12 Week Lag", source: "Derived", meaning: "The week-over-week change in SCFI from 12 weeks ago (≈1 quarter).", why: "Quarterly cycle reference - useful for detecting seasonal momentum patterns and regime persistence.", color: "#ddd6fe" },

  // ── Lags: Brent Crude ──────────────────────────────────────────────────────
  Brent_Oil_lag1: { label: "Brent Crude — 1 Week Lag", source: "Derived", meaning: "Brent crude price from 1 week prior.", why: "Oil price changes feed into bunker surcharges with a short lag.", color: "#fbbf24" },
  Brent_Oil_lag2: { label: "Brent Crude — 2 Week Lag", source: "Derived", meaning: "Brent crude price from 2 weeks prior.", why: "Captures delayed pass-through of fuel cost changes into freight rates.", color: "#f59e0b" },
  Brent_Oil_lag4: { label: "Brent Crude — 4 Week Lag", source: "Derived", meaning: "Brent crude price from 4 weeks prior.", why: "Monthly fuel cost signal - aligns with typical contract surcharge review cycles.", color: "#d97706" },
  Brent_Oil_lag8: { label: "Brent Crude — 8 Week Lag", source: "Derived", meaning: "Brent crude price from 8 weeks prior.", why: "Medium-term oil trend signal, capturing sustained price moves that affect carrier profitability.", color: "#b45309" },

  // ── Lags: CNY/USD ──────────────────────────────────────────────────────────
  CNY_USD_lag1: { label: "CNY/USD — 1 Week Lag", source: "Derived", meaning: "CNY/USD rate from 1 week prior.", why: "Near-term FX momentum affecting Chinese export competitiveness.", color: "#34d399" },
  CNY_USD_lag2: { label: "CNY/USD — 2 Week Lag", source: "Derived", meaning: "CNY/USD rate from 2 weeks prior.", why: "Short-term FX trend - exporters adjust pricing with a brief delay.", color: "#10b981" },
  CNY_USD_lag4: { label: "CNY/USD — 4 Week Lag", source: "Derived", meaning: "CNY/USD rate from 4 weeks prior.", why: "Monthly FX signal - purchase orders placed a month ago reflect current shipping demand.", color: "#059669" },

  // ── Lags: Manufacturing PMI ────────────────────────────────────────────────
  World_PMI_lag1: { label: "Manufacturing PMI — 1 Week Lag", source: "Derived", meaning: "Manufacturing PMI from 1 week prior.", why: "Immediate factory activity signal feeding into near-term shipping demand.", color: "#60a5fa" },
  World_PMI_lag4: { label: "Manufacturing PMI — 4 Week Lag", source: "Derived", meaning: "Manufacturing PMI from 4 weeks prior.", why: "Monthly production cycle anchor - typical lead time from factory to port booking.", color: "#2563eb" },
  World_PMI_lag8: { label: "Manufacturing PMI — 8 Week Lag", source: "Derived", meaning: "Manufacturing PMI from 8 weeks prior.", why: "Medium-term demand pipeline signal.", color: "#1d4ed8" },

  // ── Lags: World Trade Volume Index ─────────────────────────────────────────
  Trade_Volume_Index_lag1: { label: "Trade Volume Index — 1 Week Lag", source: "Derived", meaning: "World trade volume index from 1 week prior.", why: "Immediate global trade momentum signal.", color: "#f472b6" },
  Trade_Volume_Index_lag4: { label: "Trade Volume Index — 4 Week Lag", source: "Derived", meaning: "World trade volume index from 4 weeks prior.", why: "Monthly trade volume anchor - aligns with vessel scheduling cycles.", color: "#db2777" },
  Trade_Volume_Index_lag8: { label: "Trade Volume Index — 8 Week Lag", source: "Derived", meaning: "World trade volume index from 8 weeks prior.", why: "Medium-term trade demand signal.", color: "#be185d" },

  // ── Engineered: SCFI momentum, volatility & rolling trend ─────────────────
  SCFI_pct_chg_4w:     { label: "SCFI 4-Week % Change",          source: "Derived", meaning: "Percentage change in SCFI level over the trailing 4 weeks.", why: "Consistently the single most important feature across every model - captures recent momentum/acceleration better than any raw lag alone.", color: "#14b8a6" },
  SCFI_rolling_mean4:  { label: "SCFI 4-Week Rolling Average",   source: "Derived", meaning: "Simple average of SCFI over the trailing 4 weeks.", why: "Smooths short-term noise to reveal the underlying near-term trend level.", color: "#14b8a6" },
  SCFI_rolling_std4:   { label: "SCFI 4-Week Rolling Volatility",source: "Derived", meaning: "Standard deviation of SCFI over the trailing 4 weeks.", why: "Measures how turbulent the market has been recently - high-volatility periods behave differently than calm ones.", color: "#0d9488" },
  SCFI_rolling_mean8:  { label: "SCFI 8-Week Rolling Average",   source: "Derived", meaning: "Average SCFI over the trailing 8 weeks.", why: "A slower-moving trend line than the 4-week average, filtering more noise.", color: "#14b8a6" },
  SCFI_rolling_mean13: { label: "SCFI 13-Week Rolling Average",  source: "Derived", meaning: "Average SCFI over the trailing 13 weeks (≈1 quarter).", why: "Approximates a quarterly trend baseline for detecting longer structural shifts.", color: "#14b8a6" },
  SCFI_rolling_std8:   { label: "SCFI 8-Week Rolling Volatility",source: "Derived", meaning: "Standard deviation of SCFI over the trailing 8 weeks.", why: "A slower volatility measure than the 4-week version, useful for distinguishing short blips from sustained turbulence.", color: "#0d9488" },

  // ── Engineered: SCFI regime / positioning vs. 52-week range ───────────────
  SCFI_z52:       { label: "SCFI 52-Week Z-Score",          source: "Derived", meaning: "How many standard deviations the current SCFI is from its trailing 52-week mean.", why: "Identifies whether rates are currently in an unusually high or low regime relative to the past year.", color: "#fb923c" },
  SCFI_dist_hi52: { label: "Distance From 52-Week High",     source: "Derived", meaning: "(Current SCFI − 52-week rolling max) ÷ 52-week rolling max.", why: "Captures how far current rates have pulled back from their recent peak - a proxy for market cooling.", color: "#fb923c" },
  SCFI_dist_lo52: { label: "Distance From 52-Week Low",      source: "Derived", meaning: "(Current SCFI − 52-week rolling min) ÷ 52-week rolling min.", why: "Captures how far current rates have climbed above their recent trough - a proxy for market recovery strength.", color: "#fb923c" },
  SCFI_regime:    { label: "Market Regime Label",            source: "Derived", meaning: "A 0/1/2 label (low / normal / high) derived from thresholding SCFI_z52.", why: "Lets the tree models split their behavior depending on whether the market is currently depressed, normal, or overheated.", color: "#f97316" },

  // ── Engineered: SCFI exponential moving averages ──────────────────────────
  SCFI_EMA4:          { label: "SCFI 4-Week Exponential Moving Average",  source: "Derived", meaning: "Exponentially weighted average of SCFI, more responsive to recent weeks than a simple average.", why: "A faster-reacting trend signal than the simple rolling mean.", color: "#a855f7" },
  SCFI_EMA12:         { label: "SCFI 12-Week Exponential Moving Average", source: "Derived", meaning: "Exponentially weighted average of SCFI over a longer span.", why: "A slower, more stable trend reference line.", color: "#a855f7" },
  SCFI_EMA4_vs_EMA12: { label: "EMA4 vs EMA12 Crossover",                 source: "Derived", meaning: "Difference between the fast (4-week) and slow (12-week) EMA.", why: "A classic trend-following signal - positive means short-term momentum is outpacing the longer trend (bullish), negative means the reverse.", color: "#9333ea" },

  // ── Engineered: rate-of-change on exogenous drivers ───────────────────────
  Brent_Oil_delta1: { label: "Brent Crude 1-Week Change",     source: "Derived", meaning: "Absolute change in Brent price over 1 week.", why: "Sudden oil price moves feed into bunker surcharges faster than the level alone suggests.", color: "#eab308" },
  Brent_Oil_delta4: { label: "Brent Crude 4-Week Change",     source: "Derived", meaning: "Absolute change in Brent price over 4 weeks.", why: "Captures a sustained monthly move in fuel costs, distinct from single-week noise.", color: "#eab308" },
  Brent_Oil_pct4:   { label: "Brent Crude 4-Week % Change",   source: "Derived", meaning: "Percentage change in Brent price over 4 weeks.", why: "Normalizes the oil price move to make it comparable across different price levels and years.", color: "#eab308" },
  Brent_z13:        { label: "Brent Crude 13-Week Z-Score",   source: "Derived", meaning: "How many standard deviations Brent's price is from its trailing 13-week mean.", why: "Flags unusually high or low oil prices relative to the recent quarter, beyond what the raw level shows.", color: "#ca8a04" },

  World_PMI_delta1: { label: "Manufacturing PMI 1-Week Change",   source: "Derived", meaning: "Change in PMI over 1 week (the underlying monthly series is forward-filled to weekly).", why: "Flags a sudden shift in manufacturing sentiment as soon as it's reflected in the series.", color: "#38bdf8" },
  World_PMI_delta4: { label: "Manufacturing PMI 4-Week Change",   source: "Derived", meaning: "Change in PMI over 4 weeks.", why: "Captures a genuine monthly shift in factory activity rather than noise.", color: "#38bdf8" },
  World_PMI_pct4:   { label: "Manufacturing PMI 4-Week % Change", source: "Derived", meaning: "Percentage change in PMI over 4 weeks.", why: "Normalizes PMI momentum for comparison across different PMI levels.", color: "#38bdf8" },

  Trade_Volume_Index_delta1: { label: "Trade Volume 1-Week Change",   source: "Derived", meaning: "Change in the trade volume index over 1 week.", why: "Early signal of a shift in global trade flow.", color: "#f472b6" },
  Trade_Volume_Index_delta4: { label: "Trade Volume 4-Week Change",   source: "Derived", meaning: "Change in the trade volume index over 4 weeks.", why: "Confirms whether a trade volume shift is a sustained monthly move.", color: "#f472b6" },
  Trade_Volume_Index_pct4:   { label: "Trade Volume 4-Week % Change", source: "Derived", meaning: "Percentage change in trade volume over 4 weeks.", why: "Normalizes trade volume momentum for cross-period comparison.", color: "#f472b6" },

  // ── Engineered: cross-feature interactions ────────────────────────────────
  brent_x_pmi:    { label: "Oil Price × Manufacturing PMI",       source: "Derived", meaning: "Brent crude price multiplied by Manufacturing PMI.", why: "Captures the compounding effect of expensive fuel arriving during a high-demand manufacturing environment - a combination that stresses freight rates more than either factor alone.", color: "#22d3ee" },
  brent_x_cny:    { label: "Oil Price × CNY/USD",                 source: "Derived", meaning: "Brent crude price multiplied by the CNY/USD rate.", why: "Captures how currency-adjusted fuel cost pressure shapes carrier economics differently than oil price alone.", color: "#22d3ee" },
  trade_x_pmi:    { label: "Trade Volume × Manufacturing PMI",    source: "Derived", meaning: "World trade volume index multiplied by Manufacturing PMI.", why: "Captures compounding demand pressure when physical trade flows AND factory output are both running high at the same time.", color: "#22d3ee" },
  DSCFI_x_regime: { label: "Weekly Change × Market Regime",       source: "Derived", meaning: "Last week's SCFI change multiplied by the current market regime label.", why: "Lets the model treat the same momentum signal differently depending on whether the market is currently depressed, normal, or overheated.", color: "#06b6d4" },
};

/**
 * Explicit category per feature - kept separate from naming heuristics
 * because the "engineered" bucket (momentum/regime/EMA/rate-of-change/
 * interactions) has no single consistent naming pattern to detect it by.
 */
export const FEATURE_CATEGORY = {
  Brent_Oil: "core", CNY_USD: "core", World_PMI: "core",
  Trade_Volume_Index: "core", Trade_Volume_YoY: "core",

  year: "calendar", month: "calendar", week_of_year: "calendar",
  Q2: "calendar", Q3: "calendar", Q4: "calendar",
  Month_Feb: "calendar", Month_Mar: "calendar", Month_Apr: "calendar", Month_May: "calendar",
  Month_Jun: "calendar", Month_Jul: "calendar", Month_Aug: "calendar", Month_Sep: "calendar",
  Month_Oct: "calendar", Month_Nov: "calendar", Month_Dec: "calendar",

  DSCFI_lag1: "lags", DSCFI_lag2: "lags", DSCFI_lag3: "lags", DSCFI_lag4: "lags",
  DSCFI_lag8: "lags", DSCFI_lag12: "lags",
  Brent_Oil_lag1: "lags", Brent_Oil_lag2: "lags", Brent_Oil_lag4: "lags", Brent_Oil_lag8: "lags",
  CNY_USD_lag1: "lags", CNY_USD_lag2: "lags", CNY_USD_lag4: "lags",
  World_PMI_lag1: "lags", World_PMI_lag4: "lags", World_PMI_lag8: "lags",
  Trade_Volume_Index_lag1: "lags", Trade_Volume_Index_lag4: "lags", Trade_Volume_Index_lag8: "lags",

  SCFI_pct_chg_4w: "engineered", SCFI_rolling_mean4: "engineered", SCFI_rolling_std4: "engineered",
  SCFI_z52: "engineered", SCFI_dist_hi52: "engineered", SCFI_dist_lo52: "engineered", SCFI_regime: "engineered",
  SCFI_rolling_mean8: "engineered", SCFI_rolling_mean13: "engineered", SCFI_rolling_std8: "engineered",
  SCFI_EMA4: "engineered", SCFI_EMA12: "engineered", SCFI_EMA4_vs_EMA12: "engineered",
  Brent_Oil_delta1: "engineered", Brent_Oil_delta4: "engineered", Brent_Oil_pct4: "engineered",
  World_PMI_delta1: "engineered", World_PMI_delta4: "engineered", World_PMI_pct4: "engineered",
  Trade_Volume_Index_delta1: "engineered", Trade_Volume_Index_delta4: "engineered", Trade_Volume_Index_pct4: "engineered",
  Brent_z13: "engineered", brent_x_pmi: "engineered", brent_x_cny: "engineered",
  trade_x_pmi: "engineered", DSCFI_x_regime: "engineered",
};

/**
 * Convert a raw column name to a human-readable label.
 * Falls back to title-casing the key if not in FEATURE_META.
 */
export function humanize(key) {
  if (!key) return "";
  if (FEATURE_META[key]) return FEATURE_META[key].label;
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get the color for a feature, with a sensible default.
 */
export function featureColor(key) {
  return FEATURE_META[key]?.color ?? "#8ba0be";
}
