import { useState, FormEvent, useEffect } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { FA } from "../components/Icon";
import { faUser, faLock, faAt, faEnvelope, faIdCard, faClockRotateLeft, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { swSuccess, swError } from "../lib/swal";

const EVENT_LABEL: Record<string, string> = {
  AUTH_LOGIN: "Login", AUTH_REGISTER: "Registrasi", AUTH_LOGOUT: "Logout",
  PROFILE_UPDATE: "Update Profil", PASSWORD_CHANGE: "Ganti Password",
  USER_CREATE: "Buat Pengguna", USER_UPDATE: "Edit Pengguna", USER_DELETE: "Hapus Pengguna",
  TOKEN_INJECT: "Tambah Token", TOKEN_DEDUCT: "Kurangi Token",
  ORDER_CREATE: "Buat Tugas", ORDER_REFUND: "Refund Token",
  SYNC_SERVICES: "Sinkronkan Layanan", SYNC_ORDERS: "Sinkronkan Tugas", SYNC_TRANSACTIONS: "Sinkronkan Transaksi",
  SETTINGS_TOKEN_VALUE: "Ubah Nilai Token",
};

const EVENT_COLOR: Record<string, string> = {
  AUTH_LOGIN: "var(--green)", AUTH_REGISTER: "var(--blue)",
  PROFILE_UPDATE: "var(--accent)", PASSWORD_CHANGE: "var(--accent)",
  TOKEN_INJECT: "var(--green)", TOKEN_DEDUCT: "var(--red)",
  ORDER_CREATE: "var(--yellow)", ORDER_REFUND: "var(--blue)",
  USER_DELETE: "var(--red)",
};

const formatDT = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SettingsPage() {
  const user    = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  

  const [tab, setTab] = useState<"profile" | "password" | "activity">("profile");

  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [actLogs,    setActLogs]    = useState<any[]>([]);
  const [actMeta,    setActMeta]    = useState({ total: 0, last_page: 1, current_page: 1, per_page: 30 });
  const [actPage,    setActPage]    = useState(1);
  const [actLoading, setActLoading] = useState(false);

  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword,  setSavingPassword]  = useState(false);

  useEffect(() => {
    if (tab !== "activity") return;
    setActLoading(true);
    api.get(`/logs/me?page=${actPage}`)
      .then(r => { setActLogs(r.data.data); setActMeta(r.data.meta); })
      .finally(() => setActLoading(false));
  }, [tab, actPage]);

  // Fetch data terbaru dari API — sync store sekaligus
  useEffect(() => {
    if (!user?.id) return;
    api.get("/users")
      .then(res => {
        const me = res.data?.data?.find((u: any) => u.id === user.id);
        if (me) {
          setName(me.name); setUsername(me.username); setEmail(me.email);
          // Sync store agar topbar langsung ikut berubah
          updateUser({ name: me.name, username: me.username, email: me.email });
        } else {
          setName(user.name ?? ""); setUsername(user.username ?? ""); setEmail(user.email ?? "");
        }
      })
      .catch(() => { setName(user.name ?? ""); setUsername(user.username ?? ""); setEmail(user.email ?? ""); });
  }, [user?.id]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch(`/users/${user?.id}`, { name, username, email });
      updateUser({ name: data.data.name, username: data.data.username, email: data.data.email });
      swSuccess("Profil Diperbarui", "Data profil berhasil disimpan.");
    } catch (err: any) {
      swError("Gagal", err?.response?.data?.error ?? "Terjadi kesalahan");
    } finally { setSavingProfile(false); }
  }

  async function handleSavePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { swError("Tidak Cocok", "Password baru dan konfirmasi tidak sama."); return; }
    if (newPassword.length < 8)          { swError("Terlalu Pendek", "Password minimal 8 karakter."); return; }
    setSavingPassword(true);
    try {
      await api.patch(`/users/${user?.id}`, { password: newPassword });
      setNewPassword(""); setConfirmPassword("");
      swSuccess("Password Diperbarui", "Password berhasil diubah.");
    } catch (err: any) {
      swError("Gagal", err?.response?.data?.error ?? "Terjadi kesalahan");
    } finally { setSavingPassword(false); }
  }

  const passwordMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>Pengaturan Akun</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        {/* Avatar + info strip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          padding: "18px 24px", marginBottom: 20,
          background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-dim)", border: "2px solid rgba(200,150,10,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{name || "—"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
              <span>@{username || "—"}</span>
              <span>·</span>
              <span>{email || "—"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: user?.role === "ADMIN" ? "var(--accent-dim)" : "var(--bg-elevated)", color: user?.role === "ADMIN" ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${user?.role === "ADMIN" ? "rgba(200,150,10,0.3)" : "var(--border)"}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 4, width: "fit-content" }}>
          {([
            { key: "profile",  icon: faUser,             label: "Profil"     },
            { key: "password", icon: faLock,             label: "Password"   },
            { key: "activity", icon: faClockRotateLeft,  label: "Aktivitas"  },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 5, border: "none", fontSize: 13, fontWeight: 500,
              background: tab === t.key ? "var(--bg-surface)" : "transparent",
              color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.12s",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
            }}>
              <FA icon={t.icon} style={{ fontSize: 12 }} /> {t.label}
            </button>
          ))}
        </div>

        {/* Two column layout */}
        <div style={{ display: tab === "activity" ? "block" : "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* ── Tab: Aktivitas ── */}
          {tab === "activity" && (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FA icon={faClockRotateLeft} style={{ fontSize: 13, color: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Riwayat Aktivitas</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{actMeta.total} aktivitas</span>
              </div>
              {actLoading ? (
                <div style={{ padding: 20 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 12, opacity: 1 - i * 0.15 }} />)}</div>
              ) : actLogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Belum ada aktivitas tercatat</div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {actLogs.map((l, i) => (
                      <div key={l.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 20px", borderBottom: i < actLogs.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: EVENT_COLOR[l.event] ?? "var(--text-muted)", flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{l.description}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>{formatDT(l.createdAt)}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: EVENT_COLOR[l.event] ?? "var(--text-muted)" }}>{EVENT_LABEL[l.event] ?? l.event}</span>
                            {(l as any).metadata?.device && (
                              <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "1px 6px", borderRadius: 3, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                                {(l as any).metadata.device}
                              </span>
                            )}
                            {l.ipAddress && (
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{l.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {actMeta.last_page > 1 && (
                    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Hal. {actMeta.current_page} / {actMeta.last_page}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <PBtn icon={faChevronLeft}  disabled={actPage <= 1}                onClick={() => setActPage(p => p - 1)} />
                        <PBtn icon={faChevronRight} disabled={actPage >= actMeta.last_page} onClick={() => setActPage(p => p + 1)} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Informasi Profil ── */}
          {tab === "profile" && <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <FA icon={faUser} style={{ fontSize: 13, color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Informasi Profil</span>
            </div>
            <form onSubmit={handleSaveProfile} style={{ padding: "20px" }}>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nama Lengkap</label>
                <div style={inputWrapper}>
                  <FA icon={faIdCard} style={inputIcon} />
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="Nama lengkap" style={inputWithIcon}
                    onFocus={e => (e.target.parentElement!.style.borderColor = "var(--accent)")}
                    onBlur={e  => (e.target.parentElement!.style.borderColor = "var(--border)")} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Username</label>
                <div style={inputWrapper}>
                  <FA icon={faAt} style={inputIcon} />
                  <input value={username} onChange={e => setUsername(e.target.value)} required placeholder="namaakun" style={inputWithIcon}
                    onFocus={e => (e.target.parentElement!.style.borderColor = "var(--accent)")}
                    onBlur={e  => (e.target.parentElement!.style.borderColor = "var(--border)")} />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>Hanya huruf, angka, dan underscore.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email</label>
                <div style={inputWrapper}>
                  <FA icon={faEnvelope} style={inputIcon} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@contoh.com" style={inputWithIcon}
                    onFocus={e => (e.target.parentElement!.style.borderColor = "var(--accent)")}
                    onBlur={e  => (e.target.parentElement!.style.borderColor = "var(--border)")} />
                </div>
              </div>

              <button type="submit" disabled={savingProfile} style={submitBtn}>
                <FA icon={faUser} style={{ fontSize: 12 }} />
                {savingProfile ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </form>
          </div>}

          {/* ── Ubah Password ── */}
          {tab === "password" && <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <FA icon={faLock} style={{ fontSize: 13, color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Ubah Password</span>
            </div>
            <form onSubmit={handleSavePassword} style={{ padding: "20px" }}>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Password Baru</label>
                <div style={inputWrapper}>
                  <FA icon={faLock} style={inputIcon} />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 8 karakter" style={inputWithIcon}
                    onFocus={e => (e.target.parentElement!.style.borderColor = "var(--accent)")}
                    onBlur={e  => (e.target.parentElement!.style.borderColor = "var(--border)")} />
                </div>
                {newPassword && (
                  <div style={{ marginTop: 8 }}>
                    <PasswordStrength password={newPassword} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Konfirmasi Password</label>
                <div style={{ ...inputWrapper, borderColor: !passwordMatch ? "var(--red)" : "var(--border)" }}>
                  <FA icon={faLock} style={inputIcon} />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Ulangi password baru"
                    style={inputWithIcon}
                    onFocus={e => (e.target.parentElement!.style.borderColor = !passwordMatch ? "var(--red)" : "var(--accent)")}
                    onBlur={e  => (e.target.parentElement!.style.borderColor = !passwordMatch ? "var(--red)" : "var(--border)")} />
                </div>
                {!passwordMatch && (
                  <p style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>Password tidak cocok</p>
                )}
              </div>

              <div style={{ padding: "14px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 20, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Password baru akan langsung aktif setelah disimpan. Kamu tidak perlu logout.
              </div>

              <button type="submit" disabled={savingPassword || !passwordMatch} style={{ ...submitBtn, opacity: (!passwordMatch) ? 0.5 : 1 }}>
                <FA icon={faLock} style={{ fontSize: 12 }} />
                {savingPassword ? "Menyimpan..." : "Ubah Password"}
              </button>
            </form>
          </div>}
        </div>
      </div>
    </>
  );

}

function PBtn({ icon, onClick, disabled }: { icon: any; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: disabled ? "var(--text-muted)" : "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.45 : 1 }}>
      <FA icon={icon} style={{ fontSize: 10 }} />
    </button>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
    : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : password.length >= 8 ? 2 : 1;
  const labels = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];
  const colors = ["", "var(--red)", "var(--yellow)", "var(--blue)", "var(--green)"];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength] : "var(--bg-elevated)", transition: "background 0.2s" }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "var(--text-secondary)", marginBottom: 6,
};

const inputWrapper: React.CSSProperties = {
  display: "flex", alignItems: "center",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", transition: "border-color 0.15s",
  overflow: "hidden",
};

const inputIcon: React.CSSProperties = {
  fontSize: 12, color: "var(--text-muted)",
  flexShrink: 0, margin: "0 12px",
};

const inputWithIcon: React.CSSProperties = {
  flex: 1, padding: "10px 12px 10px 0",
  background: "transparent", border: "none",
  color: "var(--text-primary)", fontSize: 14, outline: "none",
};

const submitBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  padding: "10px 20px", borderRadius: "var(--radius-sm)",
  border: "none", background: "var(--accent)", color: "#fff",
  fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
  justifyContent: "center", transition: "opacity 0.15s",
};
