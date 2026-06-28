import "../styles/controls.css";

const HORIZON_OPTIONS = [4, 8, 12];

export function ForecastControls({
  models,
  activeModelId,
  horizonWeeks,
  onHorizonChange,
  onModelSelect,
  onRunForecast,
  loading,
}) {
  return (
    <div className="controls-card">
      <div className="controls-row">
        <div className="controls-group">
          <span className="controls-label">Model</span>
          <div className="controls-pills">
            {models.map((m) => (
              <button
                key={m.id}
                className={`controls-pill ${m.id === activeModelId ? "is-active" : ""}`}
                onClick={() => onModelSelect(m.id)}
                disabled={loading}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="controls-group">
          <span className="controls-label">Horizon</span>
          <div className="controls-pills">
            {HORIZON_OPTIONS.map((w) => (
              <button
                key={w}
                className={`controls-pill ${w === horizonWeeks ? "is-active" : ""}`}
                onClick={() => onHorizonChange(w)}
                disabled={loading}
              >
                {w}wk
              </button>
            ))}
          </div>
        </div>

        <button
          className="controls-run-btn"
          onClick={onRunForecast}
          disabled={loading}
        >
          {loading ? "Forecasting…" : "Run Forecast"}
        </button>
      </div>
    </div>
  );
}
