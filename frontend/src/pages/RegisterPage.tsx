import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { swError } from "../lib/swal";
import { FA } from "../components/Icon";
import { faCircleCheck, faTriangleExclamation, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function validate(field: string, value: string): string {
  switch (field) {
    case "username":
      if (!value) return "Username wajib diisi";
      if (value.length < 3) return "Minimal 3 karakter";
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Hanya huruf, angka, dan underscore";
      return "";
    case "name":
      if (!value) return "Nama wajib diisi";
      if (value.length < 2) return "Minimal 2 karakter";
      return "";
    case "email":
      if (!value) return "Email wajib diisi";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Format email tidak valid";
      return "";
    case "password":
      if (!value) return "Password wajib diisi";
      if (value.length < 8) return `Minimal 8 karakter (${value.length}/8)`;
      return "";
    default: return "";
  }
}

function passwordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Lemah",       color: "var(--red)"    };
  if (score <= 2) return { level: 2, label: "Cukup",       color: "var(--yellow)" };
  if (score <= 3) return { level: 3, label: "Kuat",        color: "var(--blue)"   };
  return           { level: 4, label: "Sangat Kuat",  color: "var(--green)"  };
}

export default function RegisterPage() {
  const [fields, setFields] = useState({ username: "", name: "", email: "", password: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading]  = useState(false);
  const [showPw,  setShowPw]   = useState(false);
  const [success, setSuccess]  = useState(false);

  const errors = {
    username: validate("username", fields.username),
    name:     validate("name",     fields.name),
    email:    validate("email",    fields.email),
    password: validate("password", fields.password),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const strength = passwordStrength(fields.password);

  function handleChange(key: string, value: string) {
    setFields(f => ({ ...f, [key]: value }));
    setTouched(t => ({ ...t, [key]: true }));
  }

  function handleBlur(key: string) {
    setTouched(t => ({ ...t, [key]: true }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ username: true, name: true, email: true, password: true });
    if (hasErrors) return;
    setLoading(true);
    try {
      await api.post("/auth/register", fields);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      swError("Pendaftaran Gagal", typeof msg === "string" ? msg : "Terjadi kesalahan, coba lagi.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: 24 }}>
      <div style={{ width: 400 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <img src="/logo-somere.png" alt="SOMERE" style={{ width: 32, height: 32, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(200,150,10,0.4))" }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-primary)" }}>SOMERE</span>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "32px", position: "relative", boxShadow: "0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,150,10,0.08)" }}>
          <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(to right, transparent, rgba(200,150,10,0.4), transparent)" }} />

          {success ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--green-dim)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <FA icon={faCircleCheck} style={{ fontSize: 26, color: "var(--green)" }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Pendaftaran Berhasil!</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
                Akun Anda telah terdaftar dan sedang menunggu persetujuan admin.<br />
                Anda akan dapat masuk setelah akun disetujui.
              </p>
              <div style={{ padding: "12px 16px", background: "var(--yellow-dim)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, fontSize: 13, color: "var(--yellow)", marginBottom: 20 }}>
                Harap bersabar. Admin akan meninjau permintaan Anda secepatnya.
              </div>
              <Link to="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", borderRadius: 8, background: "linear-gradient(135deg, #B8840A 0%, #E0A80C 50%, #B8840A 100%)", color: "#0C0B08", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px rgba(200,150,10,0.35)" }}>
                Kembali ke Halaman Masuk
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5 }}>Ajukan Akses</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Isi data di bawah untuk mendaftar</p>

              <form onSubmit={handleSubmit}>

                {/* Username */}
                <FieldWrap label="Username" error={touched.username ? errors.username : ""}>
                  <input value={fields.username} onChange={e => handleChange("username", e.target.value)} onBlur={() => handleBlur("username")}
                    placeholder="Contoh: johndoe" style={inputStyle(touched.username && !!errors.username)}
                    onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                    onBlur={e => { handleBlur("username"); e.target.style.borderColor = touched.username && errors.username ? "var(--red)" : "var(--border)"; }} />
                </FieldWrap>

                {/* Nama */}
                <FieldWrap label="Nama Lengkap" error={touched.name ? errors.name : ""}>
                  <input value={fields.name} onChange={e => handleChange("name", e.target.value)}
                    placeholder="Nama lengkap Anda" style={inputStyle(touched.name && !!errors.name)}
                    onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                    onBlur={e => { handleBlur("name"); e.target.style.borderColor = touched.name && errors.name ? "var(--red)" : "var(--border)"; }} />
                </FieldWrap>

                {/* Email */}
                <FieldWrap label="Email" error={touched.email ? errors.email : ""}>
                  <input type="email" value={fields.email} onChange={e => handleChange("email", e.target.value)}
                    placeholder="Contoh: nama@email.com" style={inputStyle(touched.email && !!errors.email)}
                    onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                    onBlur={e => { handleBlur("email"); e.target.style.borderColor = touched.email && errors.email ? "var(--red)" : "var(--border)"; }} />
                </FieldWrap>

                {/* Password + strength */}
                <FieldWrap label="Password" error={touched.password ? errors.password : ""}>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} value={fields.password} onChange={e => handleChange("password", e.target.value)}
                      placeholder="Minimal 8 karakter" style={{ ...inputStyle(touched.password && !!errors.password), paddingRight: 40 }}
                      onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                      onBlur={e => { handleBlur("password"); e.target.style.borderColor = touched.password && errors.password ? "var(--red)" : "var(--border)"; }} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex", alignItems: "center" }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                      <FA icon={showPw ? faEyeSlash : faEye} style={{ fontSize: 14 }} />
                    </button>
                  </div>
                  {fields.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.level ? strength.color : "var(--bg-elevated)", transition: "background 0.2s" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </FieldWrap>

                <div style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
                  Setelah mendaftar, akun Anda akan ditinjau oleh admin sebelum bisa digunakan.
                </div>

                <button type="submit" disabled={loading} style={{ width: "100%", padding: 11, borderRadius: 8, border: "none", background: loading ? "var(--bg-elevated)" : "linear-gradient(135deg, #B8840A 0%, #E0A80C 50%, #B8840A 100%)", color: loading ? "var(--text-muted)" : "#0C0B08", fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 20px rgba(200,150,10,0.35)" }}>
                  {loading ? "Mendaftar..." : "Ajukan Akses"}
                </button>
              </form>

              <p style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Sudah punya akun? <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Masuk</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldWrap({ label, error, children }: { label: string; error: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 7 }}>{label}</label>
      {children}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 12, color: "var(--red)" }}>
          <FA icon={faTriangleExclamation} style={{ fontSize: 10 }} /> {error}
        </div>
      )}
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "10px 14px",
    background: "var(--bg-elevated)",
    border: `1px solid ${hasError ? "var(--red)" : "var(--border)"}`,
    borderRadius: 8, color: "var(--text-primary)",
    fontSize: 14, outline: "none", transition: "border-color 0.15s",
  };
}
