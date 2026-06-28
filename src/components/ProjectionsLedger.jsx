import "../styles/ledger.css";

export function ProjectionsLedger({ forecast }) {
  if (!forecast) return null;

  let prev = forecast.current_scfi;

  return (
    <div className="ledger-card">
      <div className="ledger-card__title">Projections Ledger</div>
      {forecast.forecast.map((point) => {
        const delta = point.forecast - prev;
        prev = point.forecast;
        return (
          <div className="ledger-row" key={point.week}>
            <div className="ledger-row__left">
              <div className="ledger-row__week">Week +{point.week}</div>
              <div className="ledger-row__date">{point.date}</div>
            </div>
            <div className="ledger-row__right">
              <div className="ledger-row__val">
                {point.forecast.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`ledger-row__delta ${delta >= 0 ? "is-pos" : "is-neg"}`}>
                {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
