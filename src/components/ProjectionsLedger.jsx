import { motion } from "framer-motion";
import "../styles/ledger.css";

export function ProjectionsLedger({ forecast }) {
  if (!forecast) return null;

  // Pre-compute deltas so each row can scale its magnitude bar
  let prev = forecast.current_scfi;
  const rows = forecast.forecast.map((point) => {
    const delta = point.forecast - prev;
    prev = point.forecast;
    return { ...point, delta };
  });
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.delta)), 1e-9);

  return (
    <div className="ledger-card">
      <div className="ledger-card__head">
        <div className="ledger-card__title">Projections Ledger</div>
        <span className="ledger-card__count">{rows.length} weeks</span>
      </div>
      {rows.map((point, i) => {
        const pct = Math.min(Math.abs(point.delta) / maxAbs, 1) * 100;
        return (
          <motion.div
            className="ledger-row"
            key={point.week}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.035, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ledger-row__left">
              <div className="ledger-row__week">Week +{point.week}</div>
              <div className="ledger-row__date">{point.date}</div>
            </div>
            <div className="ledger-row__right">
              <div className="ledger-row__val">
                {point.forecast.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`ledger-row__delta ${point.delta >= 0 ? "is-pos" : "is-neg"}`}>
                {point.delta >= 0 ? "▲ +" : "▼ "}{point.delta.toFixed(1)}
              </div>
            </div>
            <div
              className={`ledger-row__bar ${point.delta >= 0 ? "is-pos" : "is-neg"}`}
              style={{ width: `${pct}%` }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
