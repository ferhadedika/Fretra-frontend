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
                {w} weeks
              </button>
            ))}
          </div>
        </div>

        <button
          className="controls-run-btn"
          onClick={onRunForecast}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 12, height: 12, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,.3)",
                borderTopColor: "#fff",
                display: "inline-block",
                animation: "spin .7s linear infinite",
              }} />
              Refreshing
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Refresh Forecast
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
