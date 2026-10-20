import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LOGO_ICON from "./assets/logo-icon.png";
import { T } from "./components/ui/fx";

const SUPABASE_ERRORS = {
  "Invalid login credentials":           "Invalid email or password.",
  "Email not confirmed":                 "Please confirm your email before signing in.",
  "User already registered":             "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 6 characters.",
  "Unable to validate email address":    "Please enter a valid email address.",
  "Email rate limit exceeded":           "Too many attempts. Please wait a moment.",
  "Signup is disabled":                  "New registrations are currently disabled.",
};

const friendlyError = (msg = "") => {
  for (const [key, val] of Object.entries(SUPABASE_ERRORS)) {
    if (msg.includes(key)) return val;
  }
  return msg || "Something went wrong. Please try again.";
};

const Field = ({ label, type, placeholder, value, onChange, disabled }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
    <label style={{ fontSize:11.5, fontWeight:700, letterSpacing:.5, color:T.tm, textTransform:"uppercase" }}>{label}</label>
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{
        background:T.bgRaised, border:`1px solid ${T.border}`,
        borderRadius:T.r, padding:"11px 14px",
        color:T.t1, fontSize:14, fontFamily:"inherit",
        outline:"none", transition:"border-color .15s",
        opacity: disabled ? .5 : 1,
      }}
      onFocus={e => e.target.style.borderColor = T.blue}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  </div>
);

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [tab, setTab]             = useState("signin");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [resetMode, setResetMode] = useState(false);

  // sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPass,  setSiPass]  = useState("");

  // sign up
  const [suFirst, setSuFirst] = useState("");
  const [suLast,  setSuLast]  = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suOrg,   setSuOrg]   = useState("");
  const [suPass,  setSuPass]  = useState("");

  // reset
  const [rstEmail, setRstEmail] = useState("");

  const clear = () => { setError(""); setSuccess(""); };

  const afterLogin = () => {
    if (onLoginSuccess) onLoginSuccess();
    navigate("/app");
  };

  // ── Sign In ──────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!siEmail || !siPass) { setError("Please enter your email and password."); return; }
    clear(); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: siEmail,
      password: siPass,
    });
    if (err) { setError(friendlyError(err.message)); setLoading(false); return; }
    afterLogin();
  };

  // ── Sign Up ──────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!suFirst || !suEmail || !suPass) { setError("Please fill in all required fields."); return; }
    clear(); setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: suEmail,
      password: suPass,
      options: {
        data: {
          first_name:   suFirst,
          last_name:    suLast,
          organisation: suOrg,
        },
      },
    });
    if (err) { setError(friendlyError(err.message)); setLoading(false); return; }
    // Supabase sends a confirmation email by default.
    // If you've disabled email confirmation in Supabase dashboard, call afterLogin() instead.
    setSuccess("Account created! Check your email to confirm before signing in.");
    setLoading(false);
  };

  // ── Google OAuth ─────────────────────────────────────────────
  const handleGoogle = async () => {
    clear(); setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`, // redirects back here after Google auth
      },
    });
    if (err) { setError(friendlyError(err.message)); setLoading(false); }
    // no afterLogin() needed — Supabase handles the redirect automatically
  };

  // ── Password Reset ───────────────────────────────────────────
  const handleReset = async () => {
    if (!rstEmail) { setError("Please enter your email address."); return; }
    clear(); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(rstEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) { setError(friendlyError(err.message)); setLoading(false); return; }
    setSuccess("Reset link sent — check your inbox.");
    setLoading(false);
  };

  const onEnter = (e, fn) => { if (e.key === "Enter") fn(); };

  // ── shared button style ──────────────────────────────────────
  const primaryBtn = (disabled) => ({
    background: T.blue, border:"none", borderRadius:T.r,
    color:"#fff", fontWeight:700, fontSize:14,
    padding:"13px", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily:"inherit", opacity: disabled ? .7 : 1,
    boxShadow:"0 4px 14px rgba(79,110,247,.3)",
    transition:"opacity .15s, transform .15s", marginTop:4, width:"100%",
  });

  return (
    <div style={{ minHeight:"100vh", display:"grid", gridTemplateColumns:"1fr 1fr", background:T.bg, fontFamily:"'Barlow','Inter',sans-serif", color:T.t1 }}>

      {/* ── LEFT BRAND PANEL ── */}
      <div style={{ position:"relative", background:"linear-gradient(160deg,#0f1120 0%,#0c0d11 60%)", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"48px 52px", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-180, left:-100, width:500, height:500, background:"radial-gradient(circle,rgba(79,110,247,.13) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-150, right:-100, width:400, height:400, background:"radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize:"56px 56px", pointerEvents:"none" }}/>

        {/* brand */}
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:13 }}>
          <img src={LOGO_ICON} alt="Fretra" style={{ height:40, width:"auto", objectFit:"contain", filter:"drop-shadow(0 0 12px rgba(79,110,247,.5))" }} onError={e => e.target.style.display="none"}/>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <div style={{
              fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:19, letterSpacing:2.2, lineHeight:1, textTransform:"uppercase",
              background:"linear-gradient(90deg, #edeef2 0%, #b9c3ff 55%, #d9b8ff 100%)",
              WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>
              FRETRA
            </div>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:2.6, color:T.td, textTransform:"uppercase", lineHeight:1 }}>SCFI Rate Forecasting Engine</div>
          </div>
        </div>

        {/* headline */}
        <div style={{ position:"relative", zIndex:1 }}>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(34px,4vw,52px)", fontWeight:800, lineHeight:1.05, margin:"0 0 20px", letterSpacing:-.5 }}>
            Predict freight rates<br/>before the<br/>
            <span style={{ background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>market moves.</span>
          </h1>
          <p style={{ fontSize:14.5, color:T.tm, lineHeight:1.75, maxWidth:380 }}>
            A production-grade machine learning ensemble trained on the Shanghai Containerized Freight Index — delivering 12-week forecasts with full SHAP-driven market intelligence.
          </p>
        </div>

        {/* stats */}
        <div style={{ position:"relative", zIndex:1, display:"flex", gap:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.r2, overflow:"hidden" }}>
          {[{ val:"0.997", lbl:"XGBoost R²" },{ val:"12W", lbl:"Forecast Horizon" },{ val:"10+", lbl:"Years of Data" }].map(({ val, lbl }, i) => (
            <div key={lbl} style={{ flex:1, textAlign:"center", padding:"20px 12px", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800, color:T.blue, lineHeight:1, marginBottom:4 }}>{val}</div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:T.td }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* forecast card: static snapshot of a real rolling-forecast run (data through
            2026-07-03, generated 2026-09-08; current SCFI 3,326.87) - does not fetch live */}
        <div style={{ position:"relative", zIndex:1, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.r2, padding:"18px 20px", boxShadow:T.shCard }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)" }}/>
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:T.td, marginBottom:4 }}>SCFI Ensemble Forecast · W+1 · Data to 3 Jul 2026</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:8 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:800, color:T.t1, lineHeight:1 }}>3,393</div>
            <div style={{ fontSize:13, fontWeight:700, color:T.green }}>↑ +2.0% WoW</div>
          </div>
          <div style={{ height:4, background:T.bgRaised, borderRadius:2, overflow:"hidden", marginBottom:14, border:`1px solid ${T.border}` }}>
            <div style={{ height:"100%", width:"68%", background:"linear-gradient(90deg,#4f6ef7,#8b5cf6)", borderRadius:2 }}/>
          </div>
          {[
            { label:"XGBoost",  val:"3,412", color:T.blue  },
            { label:"Ensemble", val:"3,393", color:T.green },
            { label:"LSTM",     val:"3,298", color:T.tm    },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${T.bgRaised}` }}>
              <span style={{ fontSize:12, color:T.tm }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'Barlow Condensed',sans-serif" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 52px" }}>
        <div style={{ width:"100%", maxWidth:400 }}>

          {/* header */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:T.blue, marginBottom:10 }}>
              {resetMode ? "Account Recovery" : "Secure Access"}
            </div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:800, marginBottom:6 }}>
              {resetMode ? "Reset your password" : tab === "signin" ? "Welcome back" : "Create your account"}
            </div>
            {!resetMode && (
              <div style={{ fontSize:13.5, color:T.tm }}>
                {tab === "signin"
                  ? <>New to Fretra? <span onClick={() => { setTab("signup"); clear(); }} style={{ color:T.blue, cursor:"pointer", fontWeight:600 }}>Request access</span></>
                  : <>Have an account? <span onClick={() => { setTab("signin"); clear(); }} style={{ color:T.blue, cursor:"pointer", fontWeight:600 }}>Sign in</span></>
                }
              </div>
            )}
          </div>

          {/* messages */}
          {error && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:T.r, padding:"10px 14px", marginBottom:18, fontSize:13, color:"#f87171", display:"flex", alignItems:"center", gap:8 }}>
              <span>⚠</span> {error}
            </div>
          )}
          {success && (
            <div style={{ background:"rgba(16,183,127,.1)", border:"1px solid rgba(16,183,127,.3)", borderRadius:T.r, padding:"10px 14px", marginBottom:18, fontSize:13, color:T.green, display:"flex", alignItems:"center", gap:8 }}>
              <span>✓</span> {success}
            </div>
          )}

          {/* ── RESET MODE ── */}
          {resetMode ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <p style={{ fontSize:13.5, color:T.tm, lineHeight:1.65, margin:0 }}>
                Enter your email and we'll send a secure password reset link to your inbox.
              </p>
              <Field label="Email address" type="email" placeholder="you@company.com" value={rstEmail} onChange={v => { setRstEmail(v); clear(); }} disabled={loading}/>
              <button onClick={handleReset} disabled={loading} style={primaryBtn(loading)}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <button onClick={() => { setResetMode(false); clear(); }} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:T.r, color:T.tm, fontWeight:600, fontSize:13, padding:"10px", cursor:"pointer", fontFamily:"inherit", width:"100%" }}>
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              {/* tab switcher */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:T.bgRaised, border:`1px solid ${T.border}`, borderRadius:T.r, padding:3, marginBottom:22, gap:3 }}>
                {["signin","signup"].map(t => (
                  <button key={t} onClick={() => { setTab(t); clear(); }} style={{
                    background: tab===t ? T.bgCard : "transparent",
                    border: tab===t ? `1px solid ${T.border}` : "1px solid transparent",
                    borderRadius:8, padding:"9px", color: tab===t ? T.t1 : T.tm,
                    fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                    boxShadow: tab===t ? T.shCard : "none", transition:"all .15s",
                  }}>
                    {t === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.r, padding:"11px", color:T.t2, fontWeight:600, fontSize:13.5, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", transition:"border-color .15s", opacity: loading ? .7 : 1, marginBottom:18 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.borderH}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <GoogleIcon/> Continue with Google
              </button>

              {/* divider */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ flex:1, height:1, background:T.border }}/>
                <span style={{ fontSize:11, fontWeight:600, color:T.td, textTransform:"uppercase", letterSpacing:1 }}>or email</span>
                <div style={{ flex:1, height:1, background:T.border }}/>
              </div>

              {/* sign in */}
              {tab === "signin" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <Field label="Email address" type="email" placeholder="you@company.com" value={siEmail} onChange={v => { setSiEmail(v); clear(); }} disabled={loading}/>
                  <Field label="Password" type="password" placeholder="••••••••••" value={siPass} onChange={v => { setSiPass(v); clear(); }} disabled={loading}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:T.tm, cursor:"pointer" }}>
                      <input type="checkbox" defaultChecked style={{ accentColor:T.blue }}/> Stay signed in
                    </label>
                    <span onClick={() => { setResetMode(true); clear(); }} style={{ fontSize:13, color:T.blue, cursor:"pointer", fontWeight:600 }}>Forgot password?</span>
                  </div>
                  <button onClick={handleSignIn} disabled={loading} onKeyDown={e => onEnter(e, handleSignIn)} style={primaryBtn(loading)}
                    onMouseEnter={e => { if(!loading) e.currentTarget.style.transform="translateY(-1px)"; }}
                    onMouseLeave={e => e.currentTarget.style.transform="none"}
                  >
                    {loading ? "Signing in…" : "Sign in to Fretra →"}
                  </button>
                </div>
              )}

              {/* sign up */}
              {tab === "signup" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <Field label="First name" type="text" placeholder="Ahmad" value={suFirst} onChange={v => { setSuFirst(v); clear(); }} disabled={loading}/>
                    <Field label="Last name" type="text" placeholder="Rashid" value={suLast} onChange={v => { setSuLast(v); clear(); }} disabled={loading}/>
                  </div>
                  <Field label="Work email" type="email" placeholder="you@company.com" value={suEmail} onChange={v => { setSuEmail(v); clear(); }} disabled={loading}/>
                  <Field label="Company / Organisation" type="text" placeholder="Logistics Corp Sdn Bhd" value={suOrg} onChange={v => { setSuOrg(v); clear(); }} disabled={loading}/>
                  <Field label="Password" type="password" placeholder="Min. 6 characters" value={suPass} onChange={v => { setSuPass(v); clear(); }} disabled={loading}/>
                  <button onClick={handleSignUp} disabled={loading} style={primaryBtn(loading)}>
                    {loading ? "Creating account…" : "Create account →"}
                  </button>
                </div>
              )}

              {/* trust */}
              <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:22 }}>
                {["TLS Encrypted","No Data Sharing","UTP Research Project"].map(t => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.td }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:T.green }}/>
                    {t}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop:28, textAlign:"center", fontSize:12, color:T.td }}>
            {["Terms","Privacy","Security"].map((l, i) => (
              <span key={l}>
                <a href={`/${l.toLowerCase()}`} style={{ color:T.td, textDecoration:"none" }}
                  onMouseEnter={e => e.target.style.color = T.tm}
                  onMouseLeave={e => e.target.style.color = T.td}
                >{l}</a>
                {i < 2 && <span style={{ margin:"0 8px" }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}