import { describe, it, expect } from "vitest";
import {
  adaptRollingToForecast,
  adaptRollingToForecastsByModel,
  adaptRollingToShap,
} from "./useForecast";

const MODELS = [
  { id: "xgboost", label: "XGBoost", mae: 50.08, rmse: 76.28, mape_pct: 2.64, r2: 0.9963 },
];

const HISTORICAL = [
  { date: "2026-07-03", scfi: 3121.6868 },
  { date: "2026-07-10", scfi: 3326.8718 },
];

function makeRolling(overrides = {}) {
  return {
    run_id: "run-1",
    forecast_created_at: "2026-07-09T20:00:00Z",
    latest_actual_week: "2026-07-10",
    horizon_weeks: 12,
    models: [
      {
        model_name: "xgboost",
        label: "XGBoost",
        points: [
          { target_week: "2026-07-17", week_ahead: 1, predicted_scfi: 3346.57, lower_bound: 3197.06, upper_bound: 3496.08 },
          { target_week: "2026-07-24", week_ahead: 2, predicted_scfi: 3256.41, lower_bound: 3044.97, upper_bound: 3467.85 },
          { target_week: "2026-07-31", week_ahead: 3, predicted_scfi: 3156.64, lower_bound: 2897.68, upper_bound: 3415.60 },
        ],
        local_importance: [{ feature: "SCFI_pct_chg_4w", label: "SCFI Pct Chg 4w", value: 59.91 }],
      },
      {
        model_name: "random_forest",
        label: "Random Forest",
        points: [
          { target_week: "2026-07-17", week_ahead: 1, predicted_scfi: 3300.0, lower_bound: null, upper_bound: null },
        ],
        local_importance: [],
      },
    ],
    ...overrides,
  };
}

describe("adaptRollingToForecast", () => {
  it("returns null when rolling is null", () => {
    expect(adaptRollingToForecast(null, "xgboost", MODELS, HISTORICAL)).toBeNull();
  });

  it("returns null when the requested model isn't in the run", () => {
    const rolling = makeRolling();
    expect(adaptRollingToForecast(rolling, "sarimax", MODELS, HISTORICAL)).toBeNull();
  });

  it("computes week-over-week delta starting from the last historical value", () => {
    const rolling = makeRolling();
    const result = adaptRollingToForecast(rolling, "xgboost", MODELS, HISTORICAL);

    expect(result.current_scfi).toBe(3326.8718);
    expect(result.cutoff_date).toBe("2026-07-10");
    expect(result.forecast).toHaveLength(3);
    // week 1 delta = predicted - last historical actual
    expect(result.forecast[0].delta).toBeCloseTo(3346.57 - 3326.8718, 2);
    // week 2 delta = predicted[1] - predicted[0], not vs. the historical value again
    expect(result.forecast[1].delta).toBeCloseTo(3256.41 - 3346.57, 2);
  });

  it("carries the approximate confidence bounds through, and null stays null", () => {
    const rolling = makeRolling();
    const xgbResult = adaptRollingToForecast(rolling, "xgboost", MODELS, HISTORICAL);
    expect(xgbResult.forecast[0].lowerBound).toBe(3197.06);
    expect(xgbResult.forecast[0].upperBound).toBe(3496.08);

    const rfResult = adaptRollingToForecast(rolling, "random_forest", MODELS, HISTORICAL);
    expect(rfResult.forecast[0].lowerBound).toBeNull();
    expect(rfResult.forecast[0].upperBound).toBeNull();
  });

  it("falls back to null CV metrics when the model isn't in the models list", () => {
    const rolling = makeRolling();
    const result = adaptRollingToForecast(rolling, "random_forest", [], HISTORICAL);
    expect(result.model.mae).toBeNull();
    expect(result.model.label).toBe("Random Forest");
  });
});

describe("adaptRollingToForecastsByModel", () => {
  it("returns an empty object when rolling is null", () => {
    expect(adaptRollingToForecastsByModel(null, 8)).toEqual({});
  });

  it("includes every model, filtered to the requested horizon", () => {
    const rolling = makeRolling();
    const result = adaptRollingToForecastsByModel(rolling, 2);

    expect(Object.keys(result).sort()).toEqual(["random_forest", "xgboost"]);
    expect(result.xgboost).toHaveLength(2); // week 3 filtered out by horizon=2
    expect(result.xgboost[0]).toEqual({ date: "2026-07-17", forecast: 3346.57 });
  });

  it("respects a horizon smaller than any model has data for", () => {
    const rolling = makeRolling();
    const result = adaptRollingToForecastsByModel(rolling, 12);
    expect(result.xgboost).toHaveLength(3); // only 3 points exist in the fixture
  });
});

describe("adaptRollingToShap", () => {
  it("returns null when rolling is null or model not found", () => {
    expect(adaptRollingToShap(null, "xgboost")).toBeNull();
    expect(adaptRollingToShap(makeRolling(), "lstm")).toBeNull();
  });

  it("always returns an empty global_importance (global stays training-time, not live)", () => {
    const result = adaptRollingToShap(makeRolling(), "xgboost");
    expect(result.global_importance).toEqual([]);
  });

  it("passes local_importance through unchanged", () => {
    const result = adaptRollingToShap(makeRolling(), "xgboost");
    expect(result.local_importance).toEqual([
      { feature: "SCFI_pct_chg_4w", label: "SCFI Pct Chg 4w", value: 59.91 },
    ]);
  });
});
