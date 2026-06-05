import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { FA } from "../components/Icon";
import {
  faUserPlus, faPenToSquare, faTrash, faXmark,
  faShield, faUser, faCircleCheck, faBan, faClock,
} from "@fortawesome/free-solid-svg-icons";
import { swSuccess, swError, swConfirm } from "../lib/swal";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: any; label: string }> = {
  ACTIVE:    { bg: "var(--green-dim)",              color: "var(--green)",        icon: faCircleCheck, label: "Aktif"    },
  PENDING:   { bg: "var(--yellow-dim)",             color: "var(--yellow)",       icon: faClock,       label: "Pending"  },
  SUSPENDED: { bg: "var(--red-dim)",                color: "var(--red)",          icon: faBan,         label: "Nonaktif" },
};

type ModalMode = "create" | "edit" | "delete" | null;

const emptyForm = { username: "", name: "", email: "", password: "", role: "USER" as "ADMIN" | "USER" };

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin     = useAuthStore((s) => s.isAdmin)();

  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<ModalMode>(null);
  const [target, setTarget]   = useState<User | null>(null);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<null>(null); // digantikan Swal

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: User[] }>("/users");
      setUsers(data.data);
    } finally { setLoading(false); }
  }

  function openCreate() {
    setForm(emptyForm);
    setFeedback(null);
    setTarget(null);
    setModal("create");
  }

  function openEdit(u: User) {
    setForm({ username: u.username, name: u.name, email: u.email, password: "", role: u.role });
    setFeedback(null);
    setTarget(u);
    setModal("edit");
  }

  function openDelete(u: User) { handleDeleteClick(u); }

  async function handleSetStatus(u: User, status: "ACTIVE" | "SUSPENDED") {
    const label = status === "ACTIVE" ? "menyetujui" : "menonaktifkan";
    const confirm = await swConfirm({
      title: status === "ACTIVE" ? "Setujui Akun?" : "Nonaktifkan Akun?",
      html: `Anda akan ${label} akun <strong style="color:#e2e4f0">@${u.username}</strong>.`,
      confirmText: status === "ACTIVE" ? "Ya, Setujui" : "Ya, Nonaktifkan",
      danger: status === "SUSPENDED",
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.patch(`/users/${u.id}/status`, { status });
      await load();
      swSuccess(
        status === "ACTIVE" ? "Akun Disetujui" : "Akun Dinonaktifkan",
        `Akun @${u.username} berhasil ${status === "ACTIVE" ? "diaktifkan" : "dinonaktifkan"}.`
      );
    } catch (err: any) {
      swError("Gagal", err?.response?.data?.error ?? "Terjadi kesalahan");
    }
  }

  function closeModal() { setModal(null); setTarget(null); setFeedback(null); }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === "create") {
        await api.post("/users", form);
      } else if (modal === "edit" && target) {
        const payload: Partial<typeof form> = { username: form.username, name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${target.id}`, payload);
      }
      await load();
      closeModal();
      swSuccess(
        modal === "create" ? "User Dibuat" : "User Diperbarui",
        modal === "create" ? `Akun ${form.name} berhasil dibuat.` : `Data ${form.name} berhasil diperbarui.`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Terjadi kesalahan";
      swError("Gagal", typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally { setSaving(false); }
  }

  async function handleDeleteClick(u: typeof target) {
    if (!u) return;
    const result = await swConfirm({
      title: "Hapus User?",
      html: `Akun <strong style="color:#e2e4f0">${u!.name}</strong> (@${u!.username}) akan dihapus permanen.`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      danger: true,
    });
    if (!result.isConfirmed) return;
    setSaving(true);
    try {
      await api.delete(`/users/${u!.id}`);
      await load();
      swSuccess("User Dihapus", `Akun ${u!.name} berhasil dihapus.`);
    } catch (err: any) {
      swError("Gagal Menghapus", err?.response?.data?.error ?? "Terjadi kesalahan");
    } finally { setSaving(false); }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  if (!isAdmin) {
    return (
    <>
        <div style={{ padding: 48, textAlign: "center" }}>
          <FA icon={faShield} style={{ fontSize: 32, color: "var(--red)", opacity: 0.4, marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Halaman ini hanya untuk Admin.</p>
        </div>
      </>
  );

  }

  return (
    <>
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>Manajemen User</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Kelola akun pengguna SORE</p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: "var(--radius-sm)",
              background: "var(--accent)", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <FA icon={faUserPlus} style={{ fontSize: 12 }} /> Tambah User
          </button>
        </div>

        {/* Table */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {loading ? "Memuat..." : `${users.length} user`}
            </span>
          </div>

          {loading ? (
            <LoadingRows />
          ) : users.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <FA icon={faUser} style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.2 }} />
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>Belum ada user</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  {["Nama", "Username", "Email", "Role", "Status", "Bergabung", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                            background: u.role === "ADMIN" ? "var(--accent-dim)" : "var(--bg-elevated)",
                            border: `1.5px solid ${u.role === "ADMIN" ? "rgba(200,150,10,0.4)" : "var(--border)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700,
                            color: u.role === "ADMIN" ? "var(--accent)" : "var(--text-muted)",
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                              {u.name}
                              {isSelf && <span style={{ fontSize: 11, color: "var(--accent)", marginLeft: 6, fontWeight: 400 }}>( Anda )</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <code style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)" }}>
                          @{u.username}
                        </code>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-secondary)" }}>{u.email}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 4,
                          background: u.role === "ADMIN" ? "var(--accent-dim)" : "var(--bg-elevated)",
                          color: u.role === "ADMIN" ? "var(--accent)" : "var(--text-muted)",
                          border: `1px solid ${u.role === "ADMIN" ? "rgba(200,150,10,0.3)" : "var(--border)"}`,
                        }}>
                          <FA icon={u.role === "ADMIN" ? faShield : faUser} style={{ fontSize: 10 }} />
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {(() => {
                          const s = STATUS_STYLE[u.status] ?? STATUS_STYLE.PENDING;
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 4, background: s.bg, color: s.color }}>
                              <FA icon={s.icon} style={{ fontSize: 10 }} />{s.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {u.status === "PENDING" && (
                            <ActionBtn icon={faCircleCheck} color="var(--green)" title="Setujui" onClick={() => handleSetStatus(u, "ACTIVE")} />
                          )}
                          {u.status === "ACTIVE" && !isSelf && (
                            <ActionBtn icon={faBan} color="var(--red)" title="Nonaktifkan" onClick={() => handleSetStatus(u, "SUSPENDED")} />
                          )}
                          {u.status === "SUSPENDED" && (
                            <ActionBtn icon={faCircleCheck} color="var(--green)" title="Aktifkan kembali" onClick={() => handleSetStatus(u, "ACTIVE")} />
                          )}
                          <ActionBtn icon={faPenToSquare} color="var(--accent)" title="Edit" onClick={() => openEdit(u)} />
                          <ActionBtn icon={faTrash} color="var(--red)" title="Hapus" onClick={() => openDelete(u)} disabled={isSelf} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", overflow: "hidden",
              animation: "slideUp 0.15s ease",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                {modal === "create" ? "Tambah User" : `Edit — ${target?.name}`}
              </span>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4, borderRadius: 4 }}>
                <FA icon={faXmark} style={{ fontSize: 14 }} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>

              {(modal === "create" || modal === "edit") && (
                /* Create / Edit form */
                <>
                  <FormField label="Username">
                    <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="namaakun (huruf, angka, _)" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </FormField>

                  <FormField label="Nama Lengkap">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </FormField>

                  <FormField label="Email">
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </FormField>

                  <FormField label={modal === "edit" ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={modal === "edit" ? "••••••••" : "Min. 8 karakter"} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </FormField>

                  <FormField label="Role">
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["USER", "ADMIN"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setForm(f => ({ ...f, role: r }))}
                          style={{
                            flex: 1, padding: "9px", borderRadius: "var(--radius-sm)",
                            border: `1.5px solid ${form.role === r ? (r === "ADMIN" ? "var(--accent)" : "var(--border-light)") : "var(--border)"}`,
                            background: form.role === r ? (r === "ADMIN" ? "var(--accent-dim)" : "var(--bg-elevated)") : "transparent",
                            color: form.role === r ? (r === "ADMIN" ? "var(--accent)" : "var(--text-primary)") : "var(--text-muted)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            fontSize: 13, fontWeight: form.role === r ? 600 : 400, transition: "all 0.12s",
                          }}
                        >
                          <FA icon={r === "ADMIN" ? faShield : faUser} style={{ fontSize: 12 }} /> {r}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={closeModal} style={cancelBtnStyle}>Batal</button>
                    <button
                      onClick={handleSave} disabled={saving || !form.username || !form.name || !form.email || (modal === "create" && !form.password)}
                      style={{ ...submitBtnStyle, flex: 1 }}
                    >
                      {saving ? "Menyimpan..." : modal === "create" ? "Buat User" : "Simpan Perubahan"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );

}

/* ── Komponen lokal ── */

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}


function ActionBtn({ icon, color, title, onClick, disabled }: { icon: any; color: string; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        width: 30, height: 30, borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)", background: "var(--bg-elevated)",
        color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s",
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color + "60"; e.currentTarget.style.background = color + "12"; }}}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}}
    >
      <FA icon={icon} style={{ fontSize: 12 }} />
    </button>
  );
}

function LoadingRows() {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-elevated)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 13, width: "40%", background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 11, width: "60%", background: "var(--bg-elevated)", borderRadius: 4, opacity: 0.6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
  fontSize: 14, outline: "none", transition: "border-color 0.15s",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "9px 16px", borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)", background: "var(--bg-elevated)",
  color: "var(--text-secondary)", fontSize: 14, cursor: "pointer",
};

const submitBtnStyle: React.CSSProperties = {
  padding: "9px 16px", borderRadius: "var(--radius-sm)",
  border: "none", background: "var(--accent)",
  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
