import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";

/* ────────────────────────────────────────────────────────────
   Shared premium FX primitives: scroll reveal, mouse-follow
   glow cards, aurora backdrop, smooth scrolling.
   Pure presentation. No business logic lives here.
   ──────────────────────────────────────────────────────────── */

export const T = {
  bg:       "#0c0d11",
  bgCard:   "#13141a",
  bgRaised: "#1a1c24",
  border:   "#22242e",
  borderH:  "#323546",
  t1:       "#edeef2",
  t2:       "#b0b4c4",
  tm:       "#7a7f96",
  td:       "#44475a",
  blue:     "#4f6ef7",
  violet:   "#8b5cf6",
  green:    "#10b77f",
  r:        "10px",
  r2:       "14px",
  shCard:   "0 2px 8px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.035)",
  shHover:  "0 8px 28px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.05)",
};

/* ── Smooth scrolling (Lenis) ── */
export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}

/* ── Scroll reveal wrapper ── */
export function Reveal({ children, delay = 0, y = 16, style, once = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── Mouse-follow glow card (glass surface) ── */
export function GlowCard({ children, style, hover = true, glow = true }) {
  const ref = useRef(null);
  const [hov, setHov] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const onMove = useCallback((e) => {
    if (!glow || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [glow]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      onMouseMove={onMove}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,.015), transparent 30%), " + T.bgCard,
        border: `1px solid ${hov ? T.borderH : T.border}`,
        borderRadius: T.r2,
        boxShadow: hov ? T.shHover : T.shCard,
        position: "relative",
        overflow: "hidden",
        transition: "border-color .18s, box-shadow .18s, transform .18s",
        transform: hov ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      {/* top edge shimmer */}
      <div style={{
        position: "absolute", top: 0, left: 10, right: 10, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)",
        pointerEvents: "none", zIndex: 2,
      }} />
      {/* mouse-follow glow */}
      {glow && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          opacity: hov ? 1 : 0,
          transition: "opacity .3s ease",
          background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, rgba(79,110,247,.08), transparent 55%)`,
        }} />
      )}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

/* ── Chart zoom range presets ──────────────────────────────────────────
   Pure UI: given a full array of {date,...} points and a window label,
   returns the sliced window to render. Charts stay controlled by their
   own data + a Brush for fine scrubbing; this just gives quick presets. */
export const RANGE_PRESETS = [
  { id: "6m",  label: "6M",  weeks: 26 },
  { id: "1y",  label: "1Y",  weeks: 52 },
  { id: "2y",  label: "2Y",  weeks: 104 },
  { id: "5y",  label: "5Y",  weeks: 260 },
  { id: "all", label: "All", weeks: null },
];

export function sliceByRange(data, rangeId) {
  const preset = RANGE_PRESETS.find((r) => r.id === rangeId);
  if (!preset || preset.weeks == null || data.length <= preset.weeks) return data;
  return data.slice(-preset.weeks);
}

export function RangeSelector({ value, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 2, padding: 3,
      background: T.bg, border: `1px solid ${T.border}`,
      borderRadius: 8, flexShrink: 0,
    }}>
      {RANGE_PRESETS.map((r) => {
        const active = value === r.id;
        return (
          <button
            key={r.id}
            onClick={() => onChange(r.id)}
            style={{
              position: "relative",
              fontSize: 10.5, fontWeight: 700,
              padding: "4px 10px", borderRadius: 5,
              border: active ? `1px solid ${T.borderH}` : "1px solid transparent",
              background: active ? T.bgRaised : "transparent",
              color: active ? T.t1 : T.tm,
              boxShadow: active ? T.shCard : "none",
              cursor: "pointer", fontFamily: "inherit",
              transition: "color .15s, background .15s",
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.t2; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.tm; }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Aurora / mesh gradient backdrop ── */
export function AuroraBackdrop() {
  return (
    <>
      <div aria-hidden style={{
        position: "fixed", top: -220, left: "50%", transform: "translateX(-50%)",
        width: 1100, height: 620, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(79,110,247,.10) 0%, rgba(139,92,246,.05) 40%, transparent 68%)",
        filter: "blur(10px)",
        animation: "aurora-drift 16s ease-in-out infinite alternate",
      }} />
      <div aria-hidden style={{
        position: "fixed", bottom: -160, right: -120,
        width: 640, height: 640, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(circle, rgba(139,92,246,.06) 0%, transparent 62%)",
        animation: "aurora-drift 22s ease-in-out infinite alternate-reverse",
      }} />
      <div aria-hidden style={{
        position: "fixed", top: "38%", left: -180,
        width: 520, height: 520, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(circle, rgba(16,183,127,.04) 0%, transparent 60%)",
        animation: "aurora-drift 26s ease-in-out infinite alternate",
      }} />
      <style>{`
        @keyframes aurora-drift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(28px,16px) scale(1.06); }
        }
      `}</style>
    </>
  );
}
