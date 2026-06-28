import "../styles/header.css";

import LOGO_ICON from "../assests/logo-icon.png";

export function Header({ firestoreMode }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img
          src={LOGO_ICON}
          alt="Fretra"
          className="app-header__logo-img"
          onError={e => e.target.style.display = "none"}
        />
        <div>
          <div className="app-header__title">FRETRA</div>
          <div className="app-header__subtitle">SCFI Rate Forecasting Engine</div>
        </div>
      </div>
      <div className="app-header__status">
        <span className="app-header__dot" />
        Live
        {firestoreMode && (
          <span className="app-header__mode" title="Forecast history storage backend">
            {firestoreMode}
          </span>
        )}
      </div>
    </header>
  );
}