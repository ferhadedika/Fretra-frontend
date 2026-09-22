import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LOGO_ICON from "../assets/logo-icon.png";
import { T } from "./ui/fx";

/* ============================================================
   SiteHeader — the one nav bar used by every marketing page
   (About / Features / Models / Pipeline). Same height, same
   blur-on-scroll behaviour, same pill nav, same CTA everywhere,
   so the site no longer has five slightly-different headers.
   ============================================================ */

const EASE = [0.16, 1, 0.3, 1];

const NAV_LINKS = [
  ["Models",   "/models"],
  ["Pipeline", "/pipeline"],
  ["Features", "/features"],
  ["About",    "/about"],
];

export function SiteHeader({ active }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        position: "sticky", top: 0, zIndex: 200, height: 68,
        display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
        padding: "0 32px",
        background: scrolled ? "rgba(8,9,12,.78)" : "rgba(8,9,12,.4)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        transition: "background .3s, border-color .3s",
      }}
    >
      <div
        onClick={() => navigate("/")}
        style={{ display: "flex", alignItems: "center", gap: 13, cursor: "pointer", justifySelf: "start" }}
      >
        <img
          src={LOGO_ICON}
          alt="Fretra"
          style={{ height: 40, width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(79,110,247,.5))" }}
          onError={(e) => (e.target.style.display = "none")}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{
            fontFamily: T.displayFont, fontWeight: 800, fontSize: 19,
            letterSpacing: 2.2, textTransform: "uppercase", lineHeight: 1,
            background: "linear-gradient(90deg, #edeef2 0%, #b9c3ff 55%, #d9b8ff 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            FRETRA
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600, letterSpacing: 2.6,
            color: T.td, textTransform: "uppercase", lineHeight: 1,
          }}>
            SCFI Rate Forecasting Engine
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", gap: 2, justifySelf: "center", position: "relative",
        background: "rgba(255,255,255,.03)", border: `1px solid ${T.border}`,
        borderRadius: 999, padding: 4,
      }}>
        {NAV_LINKS.map(([label, path]) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                position: "relative", background: "none", border: "none",
                padding: "7px 16px", borderRadius: 999,
                color: isActive ? T.t1 : T.tm, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: T.bodyFont, transition: "color .2s", zIndex: 1,
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = T.t2; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = T.tm; }}
            >
              {isActive && (
                <motion.span
                  layoutId="site-nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  style={{
                    position: "absolute", inset: 0, borderRadius: 999,
                    background: "rgba(255,255,255,.08)", border: `1px solid ${T.borderH}`, zIndex: -1,
                  }}
                />
              )}
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ justifySelf: "end" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${T.blue} 0%, ${T.violet} 100%)`,
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 999, color: "#fff", fontWeight: 700, fontSize: 13,
            padding: "9px 22px", cursor: "pointer", fontFamily: T.bodyFont,
            boxShadow: "0 4px 16px rgba(79,110,247,.3), inset 0 1px 0 rgba(255,255,255,.16)",
            transition: "transform .15s, box-shadow .2s, filter .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.filter = "brightness(1.08)";
            e.currentTarget.style.boxShadow = "0 6px 22px rgba(79,110,247,.42), inset 0 1px 0 rgba(255,255,255,.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.filter = "none";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,110,247,.3), inset 0 1px 0 rgba(255,255,255,.16)";
          }}
        >
          Launch App &rarr;
        </button>
      </div>
    </motion.nav>
  );
}
