import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { swError } from "../lib/swal";
import { FA } from "../components/Icon";
import { faTriangleExclamation, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram, faTiktok, faYoutube, faXTwitter,
  faFacebook, faTelegram,
} from "@fortawesome/free-brands-svg-icons";

const ORBIT_ICONS = [
  { icon: faInstagram, color: "#e1306c", delay: "0s"   },
  { icon: faTiktok,    color: "#e0e0e0", delay: "-2s"  },
  { icon: faYoutube,   color: "#ff0000", delay: "-4s"  },
  { icon: faXTwitter,  color: "#1da1f2", delay: "-6s"  },
  { icon: faFacebook,  color: "#1877f2", delay: "-8s"  },
  { icon: faTelegram,  color: "#26a5e4", delay: "-10s" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    identifier: !identifier ? "Username atau email wajib diisi" : "",
    password:   !password   ? "Password wajib diisi" : "",
  };

  function handleBlur(key: string) {
    setTouched(t => ({ ...t, [key]: true }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    if (errors.identifier || errors.password) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      setAuth(data.token, data.user, data.refreshToken);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      swError("Login Gagal", msg || "Username/email atau password salah.");
    } finally { setLoading(false); }
  }

  return (
    <div className="login-container" style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      position: "relative", overflow: "hidden",
    }}>

      {/* Cahaya latar */}
      <div style={{ position: "absolute", top: "50%", right: "25%", transform: "translateY(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,150,10,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 1, height: "55%", background: "linear-gradient(to bottom, transparent, rgba(200,150,10,0.18), transparent)" }} />
      <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 1, height: "55%", background: "linear-gradient(to bottom, transparent, rgba(200,150,10,0.18), transparent)" }} />

      {/* ── Layout dua kolom ── */}
      <div className="login-layout" style={{ display: "flex", alignItems: "center", gap: 64, width: "100%", maxWidth: 900, position: "relative", zIndex: 1 }}>

        {/* ── Kiri: Form ── */}
        <div className="login-form-side" style={{ flex: "0 0 380px" }}>
          {/* Nama aplikasi kecil di atas form */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <img src="/logo-somere.png" alt="SOMERE" style={{ width: 32, height: 32, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(200,150,10,0.4))" }} />
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-primary)" }}>SOMERE</span>
          </div>

          <div className="login-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "32px 32px 28px", position: "relative", boxShadow: "0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,150,10,0.08)" }}>
            <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(to right, transparent, rgba(200,150,10,0.4), transparent)" }} />

            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5 }}>Selamat datang kembali</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Masuk untuk melanjutkan ke dashboard</p>

            <form onSubmit={handleSubmit}>
              {/* Username / Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Username atau Email</label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="Masukkan username atau email"
                  style={{ ...inputStyle, borderColor: touched.identifier && errors.identifier ? "var(--red)" : "var(--border)" }}
                  onFocus={e => e.target.style.borderColor = touched.identifier && errors.identifier ? "var(--red)" : "rgba(200,150,10,0.6)"}
                  onBlur={e => { handleBlur("identifier"); e.target.style.borderColor = errors.identifier ? "var(--red)" : "var(--border)"; }} />
                {touched.identifier && errors.identifier && <FieldError msg={errors.identifier} />}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    style={{ ...inputStyle, paddingRight: 40, borderColor: touched.password && errors.password ? "var(--red)" : "var(--border)" }}
                    onFocus={e => e.target.style.borderColor = touched.password && errors.password ? "var(--red)" : "rgba(200,150,10,0.6)"}
                    onBlur={e => { handleBlur("password"); e.target.style.borderColor = errors.password ? "var(--red)" : "var(--border)"; }} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                    <FA icon={showPw ? faEyeSlash : faEye} style={{ fontSize: 14 }} />
                  </button>
                </div>
                {touched.password && errors.password && <FieldError msg={errors.password} />}
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "11px", borderRadius: 8, border: "none",
                background: loading ? "var(--bg-elevated)" : "linear-gradient(135deg, #B8840A 0%, #E0A80C 50%, #B8840A 100%)",
                color: loading ? "var(--text-muted)" : "#0C0B08",
                fontSize: 14, fontWeight: 700, letterSpacing: "0.05em",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(200,150,10,0.35)",
                transition: "all 0.15s",
              }}>
                {loading ? "Memverifikasi..." : "Masuk"}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              Belum punya akun?{" "}
              <Link to="/register" style={{ color: "var(--accent)", fontWeight: 500 }}>Ajukan Akses</Link>
            </p>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 16, letterSpacing: "0.06em" }}>
            © 2026 SOMERE · Social Media Report
          </p>
        </div>

        {/* ── Kanan: Logo + Orbit ── */}
        <div className="login-orbit-side" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

          {/* Orbit container */}
          <div style={{ position: "relative", width: 300, height: 300 }}>

            {/* Jalur orbit */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 240, height: 240, borderRadius: "50%", border: "1px dashed rgba(200,150,10,0.18)" }} />

            {/* Icon mengorbit */}
            {ORBIT_ICONS.map((item, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 0, height: 0,
                animationName: "orbitIcon",
                animationDuration: "12s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: item.delay,
              }}>
                <div style={{
                  position: "absolute",
                  transform: "translate(-50%, -50%)",
                  width: 38, height: 38, borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  border: `1px solid ${item.color}45`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 12px ${item.color}35`,
                  animationName: "counterRotate",
                  animationDuration: "12s",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: item.delay,
                }}>
                  <FA icon={item.icon} style={{ fontSize: 17, color: item.color }} />
                </div>
              </div>
            ))}

            {/* Logo tengah */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,150,10,0.15) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", inset: -9, borderRadius: "50%", border: "1px solid rgba(200,150,10,0.22)" }} />
                <img src="/logo-somere.png" alt="SOMERE" style={{ width: 100, height: 100, objectFit: "contain", position: "relative", filter: "drop-shadow(0 0 18px rgba(200,150,10,0.5)) drop-shadow(0 0 6px rgba(200,150,10,0.25))" }} />
              </div>
            </div>
          </div>

          {/* Teks bawah orbit */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.15em", color: "var(--text-primary)", marginBottom: 6 }}>SOMERE</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Social Media Report</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(200,150,10,0.3))" }} />
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(200,150,10,0.5)" }} />
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(200,150,10,0.3))" }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.7, maxWidth: 260, margin: "14px auto 0" }}>
              Platform manajemen laporan konten media sosial secara efisien
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orbitIcon {
          from { transform: rotate(0deg)   translateX(120px); }
          to   { transform: rotate(360deg) translateX(120px); }
        }
        @keyframes counterRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @media (max-width: 768px) {
          .login-layout {
            flex-direction: column !important;
            gap: 24px !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .login-form-side {
            flex: 1 1 auto !important;
            width: 100% !important;
            max-width: 400px !important;
          }
          .login-orbit-side {
            display: none !important;
          }
          .login-card {
            padding: 24px 20px 20px !important;
          }
        }
        @media (max-width: 480px) {
          .login-container {
            padding: 16px !important;
          }
          .login-card {
            padding: 20px 16px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500,
  color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.03em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)",
  fontSize: 14, outline: "none", transition: "border-color 0.15s",
};

function FieldError({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 12, color: "var(--red)" }}>
      <FA icon={faTriangleExclamation} style={{ fontSize: 10 }} /> {msg}
    </div>
  );
}
