// src/utils/featureMeta.js
// Single source of truth for all feature metadata.
// Covers every column in cleaned_dataset_raw.csv.

export const FEATURE_META = {

  // ── Core targets & price inputs ──────────────────────────────────────────
  SCFI: {
    label:   "SCFI Composite Index",
    source:  "Shanghai Shipping Exchange",
    meaning: "The Shanghai Containerized Freight Index — a weighted composite of spot container freight rates across major global trade lanes.",
    why:     "The primary target variable. Its own recent history is the strongest predictor of near-term direction.",
    color:   "#2171f5",
  },
  Brent_Crude: {
    label:   "Brent Crude Oil Price (USD/bbl)",
    source:  "EIA / FRED (DCOILBRENTEU)",
    meaning: "Spot price of Brent crude oil in USD per barrel, the global oil benchmark.",
    why:     "Bunker fuel is the largest variable cost for container shipping. Rising oil prices compress margins and are often passed through as surcharges, pushing freight rates up.",
    color:   "#f59e0b",
  },
  CNY_USD: {
    label:   "CNY / USD Exchange Rate",
    source:  "FRED (DEXCHUS)",
    meaning: "Chinese yuan per US dollar. A higher number means a weaker yuan.",
    why:     "China is the origin of most containerized exports. A weaker yuan makes Chinese goods cheaper for foreign buyers, boosting export volumes and demand for shipping capacity.",
    color:   "#10b981",
  },
  PMI_Manufacturing: {
    label:   "Global Manufacturing PMI",
    source:  "S&P Global / JPMorgan",
    meaning: "Purchasing Managers' Index for manufacturing — a survey-based leading indicator. Above 50 = expansion, below 50 = contraction.",
    why:     "Manufacturing activity directly drives demand for containerized goods. A rising PMI signals more factory output and therefore more cargo to ship.",
    color:   "#3b82f6",
  },
  PMI_Services: {
    label:   "Global Services PMI",
    source:  "S&P Global / JPMorgan",
    meaning: "Purchasing Managers' Index for the services sector. Above 50 = expansion.",
    why:     "Services PMI captures consumer confidence and retail demand, which drives imports of finished goods — a significant component of containerized trade.",
    color:   "#8b5cf6",
  },
  Trade_Volume_Index: {
    label:   "World Trade Volume Index",
    source:  "CPB Netherlands Bureau for Economic Policy Analysis",
    meaning: "A monthly index of global merchandise trade volumes, rebased to a reference period.",
    why:     "Directly measures the physical volume of goods crossing borders. When trade volume rises, container demand rises with it, pushing freight rates up.",
    color:   "#ec4899",
  },
  Trade_Volume_YoY: {
    label:   "World Trade Volume YoY Growth (%)",
    source:  "CPB Netherlands Bureau for Economic Policy Analysis",
    meaning: "Year-on-year percentage change in world trade volume.",
    why:     "The growth rate of trade captures acceleration or deceleration in demand, which is often more informative than the level alone for forecasting rate direction.",
    color:   "#f43f5e",
  },

  // ── SCFI lags ─────────────────────────────────────────────────────────────
  SCFI_lag1:  { label: "SCFI — 1 Week Lag",  source: "Derived", meaning: "SCFI value from 1 week prior.",  why: "Short-term momentum — last week's rate is the single strongest predictor of this week's rate.", color: "#6366f1" },
  SCFI_lag2:  { label: "SCFI — 2 Week Lag",  source: "Derived", meaning: "SCFI value from 2 weeks prior.", why: "Captures short-term trend continuation or mean reversion signals.", color: "#7c3aed" },
  SCFI_lag3:  { label: "SCFI — 3 Week Lag",  source: "Derived", meaning: "SCFI value from 3 weeks prior.", why: "Bridges short and medium-term momentum signals.", color: "#8b5cf6" },
  SCFI_lag4:  { label: "SCFI — 4 Week Lag",  source: "Derived", meaning: "SCFI value from 4 weeks prior (≈ 1 month).", why: "Monthly rate cycle anchor — captures the typical booking-to-sailing lag in container shipping.", color: "#a78bfa" },
  SCFI_lag8:  { label: "SCFI — 8 Week Lag",  source: "Derived", meaning: "SCFI value from 8 weeks prior (≈ 2 months).", why: "Captures medium-term supply-demand cycles including vessel scheduling and blank sailing announcements.", color: "#c4b5fd" },
  SCFI_lag12: { label: "SCFI — 12 Week Lag", source: "Derived", meaning: "SCFI value from 12 weeks prior (≈ 1 quarter).", why: "Quarterly cycle reference — useful for detecting seasonal patterns and regime persistence.", color: "#ddd6fe" },

  // ── Brent Crude lags ──────────────────────────────────────────────────────
  Brent_Crude_lag1:  { label: "Brent Crude — 1 Week Lag",  source: "Derived", meaning: "Brent crude price from 1 week prior.",         why: "Oil price changes feed into bunker surcharges with a short lag.", color: "#fbbf24" },
  Brent_Crude_lag2:  { label: "Brent Crude — 2 Week Lag",  source: "Derived", meaning: "Brent crude price from 2 weeks prior.",        why: "Captures delayed pass-through of fuel cost changes into freight rates.", color: "#f59e0b" },
  Brent_Crude_lag4:  { label: "Brent Crude — 4 Week Lag",  source: "Derived", meaning: "Brent crude price from 4 weeks prior.",        why: "Monthly fuel cost signal — aligns with typical contract surcharge review cycles.", color: "#d97706" },
  Brent_Crude_lag8:  { label: "Brent Crude — 8 Week Lag",  source: "Derived", meaning: "Brent crude price from 8 weeks prior.",        why: "Medium-term oil trend signal, capturing sustained price moves that affect carrier profitability.", color: "#b45309" },
  Brent_Crude_lag12: { label: "Brent Crude — 12 Week Lag", source: "Derived", meaning: "Brent crude price from 12 weeks prior.",       why: "Quarterly oil cost reference — helps model detect structural shifts in energy costs.", color: "#92400e" },

  // ── CNY/USD lags ──────────────────────────────────────────────────────────
  CNY_USD_lag1:  { label: "CNY/USD — 1 Week Lag",  source: "Derived", meaning: "CNY/USD rate from 1 week prior.",  why: "Near-term FX momentum affecting Chinese export competitiveness.", color: "#34d399" },
  CNY_USD_lag2:  { label: "CNY/USD — 2 Week Lag",  source: "Derived", meaning: "CNY/USD rate from 2 weeks prior.", why: "Short-term FX trend — exporters adjust pricing with a brief delay.", color: "#10b981" },
  CNY_USD_lag4:  { label: "CNY/USD — 4 Week Lag",  source: "Derived", meaning: "CNY/USD rate from 4 weeks prior.", why: "Monthly FX signal — purchase orders placed a month ago reflect current shipping demand.", color: "#059669" },
  CNY_USD_lag8:  { label: "CNY/USD — 8 Week Lag",  source: "Derived", meaning: "CNY/USD rate from 8 weeks prior.", why: "Medium-term FX trend affecting export order books and container bookings.", color: "#047857" },
  CNY_USD_lag12: { label: "CNY/USD — 12 Week Lag", source: "Derived", meaning: "CNY/USD rate from 12 weeks prior.", why: "Quarterly FX reference — captures structural currency trends that shape trade flows.", color: "#065f46" },

  // ── PMI Manufacturing lags ────────────────────────────────────────────────
  PMI_Manufacturing_lag1:  { label: "Manufacturing PMI — 1 Week Lag",  source: "Derived", meaning: "Manufacturing PMI from 1 week prior.",  why: "Immediate factory activity signal feeding into near-term shipping demand.", color: "#60a5fa" },
  PMI_Manufacturing_lag2:  { label: "Manufacturing PMI — 2 Week Lag",  source: "Derived", meaning: "Manufacturing PMI from 2 weeks prior.", why: "Short-term production momentum — goods produced now ship within 2–4 weeks.", color: "#3b82f6" },
  PMI_Manufacturing_lag4:  { label: "Manufacturing PMI — 4 Week Lag",  source: "Derived", meaning: "Manufacturing PMI from 4 weeks prior.", why: "Monthly production cycle anchor — typical lead time from factory to port booking.", color: "#2563eb" },
  PMI_Manufacturing_lag8:  { label: "Manufacturing PMI — 8 Week Lag",  source: "Derived", meaning: "Manufacturing PMI from 8 weeks prior.", why: "Medium-term demand pipeline signal.", color: "#1d4ed8" },
  PMI_Manufacturing_lag12: { label: "Manufacturing PMI — 12 Week Lag", source: "Derived", meaning: "Manufacturing PMI from 12 weeks prior.", why: "Quarterly manufacturing trend — useful for detecting seasonal production surges.", color: "#1e40af" },

  // ── PMI Services lags ─────────────────────────────────────────────────────
  PMI_Services_lag1:  { label: "Services PMI — 1 Week Lag",  source: "Derived", meaning: "Services PMI from 1 week prior.",  why: "Near-term consumer demand signal driving import volumes.", color: "#a78bfa" },
  PMI_Services_lag2:  { label: "Services PMI — 2 Week Lag",  source: "Derived", meaning: "Services PMI from 2 weeks prior.", why: "Short-term retail demand trend influencing container bookings.", color: "#8b5cf6" },
  PMI_Services_lag4:  { label: "Services PMI — 4 Week Lag",  source: "Derived", meaning: "Services PMI from 4 weeks prior.", why: "Monthly consumer confidence signal — retail orders placed ≈1 month before shipping.", color: "#7c3aed" },
  PMI_Services_lag8:  { label: "Services PMI — 8 Week Lag",  source: "Derived", meaning: "Services PMI from 8 weeks prior.", why: "Medium-term consumer demand trend.", color: "#6d28d9" },
  PMI_Services_lag12: { label: "Services PMI — 12 Week Lag", source: "Derived", meaning: "Services PMI from 12 weeks prior.", why: "Quarterly consumer sentiment reference.", color: "#5b21b6" },

  // ── Trade Volume Index lags ───────────────────────────────────────────────
  Trade_Volume_Index_lag1:  { label: "Trade Volume Index — 1 Week Lag",  source: "Derived", meaning: "World trade volume index from 1 week prior.",  why: "Immediate global trade momentum signal.", color: "#f472b6" },
  Trade_Volume_Index_lag2:  { label: "Trade Volume Index — 2 Week Lag",  source: "Derived", meaning: "World trade volume index from 2 weeks prior.", why: "Short-term trade flow trend.", color: "#ec4899" },
  Trade_Volume_Index_lag4:  { label: "Trade Volume Index — 4 Week Lag",  source: "Derived", meaning: "World trade volume index from 4 weeks prior.", why: "Monthly trade volume anchor — aligns with vessel scheduling cycles.", color: "#db2777" },
  Trade_Volume_Index_lag8:  { label: "Trade Volume Index — 8 Week Lag",  source: "Derived", meaning: "World trade volume index from 8 weeks prior.", why: "Medium-term trade demand signal.", color: "#be185d" },
  Trade_Volume_Index_lag12: { label: "Trade Volume Index — 12 Week Lag", source: "Derived", meaning: "World trade volume index from 12 weeks prior.", why: "Quarterly trade volume reference for seasonal pattern detection.", color: "#9d174d" },

  // ── Trade Volume YoY lags ─────────────────────────────────────────────────
  Trade_Volume_YoY_lag1:  { label: "Trade Volume YoY — 1 Week Lag",  source: "Derived", meaning: "YoY trade growth rate from 1 week prior.",  why: "Near-term growth acceleration signal.", color: "#fb7185" },
  Trade_Volume_YoY_lag2:  { label: "Trade Volume YoY — 2 Week Lag",  source: "Derived", meaning: "YoY trade growth rate from 2 weeks prior.", why: "Short-term growth trend confirmation.", color: "#f43f5e" },
  Trade_Volume_YoY_lag4:  { label: "Trade Volume YoY — 4 Week Lag",  source: "Derived", meaning: "YoY trade growth rate from 4 weeks prior.", why: "Monthly growth momentum — captures demand acceleration or deceleration.", color: "#e11d48" },
  Trade_Volume_YoY_lag8:  { label: "Trade Volume YoY — 8 Week Lag",  source: "Derived", meaning: "YoY trade growth rate from 8 weeks prior.", why: "Medium-term growth cycle signal.", color: "#be123c" },
  Trade_Volume_YoY_lag12: { label: "Trade Volume YoY — 12 Week Lag", source: "Derived", meaning: "YoY trade growth rate from 12 weeks prior.", why: "Quarterly growth reference — useful for regime detection.", color: "#9f1239" },

  // ── Calendar features ─────────────────────────────────────────────────────
  Year: {
    label:   "Year",
    source:  "Derived (calendar)",
    meaning: "Calendar year of the observation.",
    why:     "Captures long-term structural trends in freight rates across years.",
    color:   "#94a3b8",
  },
  Quarter: {
    label:   "Quarter",
    source:  "Derived (calendar)",
    meaning: "Calendar quarter (1–4).",
    why:     "Quarterly seasonality — Q4 is typically peak season driven by pre-Christmas retail restocking.",
    color:   "#94a3b8",
  },
  Month: {
    label:   "Month",
    source:  "Derived (calendar)",
    meaning: "Calendar month (1–12).",
    why:     "Monthly seasonality — Chinese New Year in Jan/Feb causes a well-known freight rate spike pattern.",
    color:   "#94a3b8",
  },
  Week_of_Year: {
    label:   "Week of Year",
    source:  "Derived (calendar)",
    meaning: "ISO week number (1–52).",
    why:     "Fine-grained seasonal signal capturing intra-year rate patterns tied to shipping schedules and holidays.",
    color:   "#64748b",
  },

  // ── Month dummies ─────────────────────────────────────────────────────────
  Month_2:  { label: "February Dummy",   source: "Derived (calendar)", meaning: "1 if the week falls in February, else 0.",   why: "Chinese New Year effect — freight rates typically spike before and dip after.", color: "#475569" },
  Month_3:  { label: "March Dummy",      source: "Derived (calendar)", meaning: "1 if the week falls in March, else 0.",      why: "Post-CNY restocking surge often visible in March rates.", color: "#475569" },
  Month_4:  { label: "April Dummy",      source: "Derived (calendar)", meaning: "1 if the week falls in April, else 0.",      why: "Q2 start — early peak season preparation begins.", color: "#475569" },
  Month_5:  { label: "May Dummy",        source: "Derived (calendar)", meaning: "1 if the week falls in May, else 0.",        why: "Pre-summer peak — US/EU importers stock up ahead of summer retail season.", color: "#475569" },
  Month_6:  { label: "June Dummy",       source: "Derived (calendar)", meaning: "1 if the week falls in June, else 0.",       why: "Peak season onset — one of the busiest months for Trans-Pacific trade.", color: "#475569" },
  Month_7:  { label: "July Dummy",       source: "Derived (calendar)", meaning: "1 if the week falls in July, else 0.",       why: "Core peak season — high demand for back-to-school and holiday inventory.", color: "#475569" },
  Month_8:  { label: "August Dummy",     source: "Derived (calendar)", meaning: "1 if the week falls in August, else 0.",     why: "Late peak season — final push before Q4 holiday inventory cutoffs.", color: "#475569" },
  Month_9:  { label: "September Dummy",  source: "Derived (calendar)", meaning: "1 if the week falls in September, else 0.",  why: "Transition month — peak season winds down, Golden Week preparation begins.", color: "#475569" },
  Month_10: { label: "October Dummy",    source: "Derived (calendar)", meaning: "1 if the week falls in October, else 0.",    why: "Golden Week in China causes scheduling disruptions and rate volatility.", color: "#475569" },
  Month_11: { label: "November Dummy",   source: "Derived (calendar)", meaning: "1 if the week falls in November, else 0.",   why: "Pre-holiday final push — Black Friday/Cyber Monday import wave.", color: "#475569" },
  Month_12: { label: "December Dummy",   source: "Derived (calendar)", meaning: "1 if the week falls in December, else 0.",   why: "Year-end slowdown — blank sailings increase as carriers reduce capacity.", color: "#475569" },

  // ── Quarter dummies ───────────────────────────────────────────────────────
  Q_2: { label: "Q2 Dummy", source: "Derived (calendar)", meaning: "1 if the week falls in Q2 (Apr–Jun), else 0.", why: "Q2 is historically the start of the shipping peak season.", color: "#334155" },
  Q_3: { label: "Q3 Dummy", source: "Derived (calendar)", meaning: "1 if the week falls in Q3 (Jul–Sep), else 0.", why: "Q3 is peak season — the highest freight rate quarter in most years.", color: "#334155" },
  Q_4: { label: "Q4 Dummy", source: "Derived (calendar)", meaning: "1 if the week falls in Q4 (Oct–Dec), else 0.", why: "Q4 has mixed signals — early holiday rush followed by year-end capacity cuts.", color: "#334155" },
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