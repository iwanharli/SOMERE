import { useEffect, useState, FormEvent } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { FA } from "../components/Icon";
import {
  faCoins, faPaperPlane, faClock, faCircleCheck,
  faCircleXmark, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { swSuccess, swError } from "../lib/swal";

interface TokenRequest {
  id: string; amount: number; reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null; createdAt: string; reviewedAt: string | null;
}

const STATUS_STYLE = {
  PENDING:  { icon: faClock,        color: "var(--yellow)", bg: "var(--yellow-dim)", label: "Menunggu"  },
  APPROVED: { icon: faCircleCheck,  color: "var(--green)",  bg: "var(--green-dim)",  label: "Disetujui" },
  REJECTED: { icon: faCircleXmark,  color: "var(--red)",    bg: "var(--red-dim)",    label: "Ditolak"   },
};

export default function TokenRequestPage() {
  const tokenBalance = useAuthStore(s => s.user);
  const [balance,    setBalance]    = useState<number | null>(null);
  const [requests,   setRequests]   = useState<TokenRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [amount,     setAmount]     = useState("");
  const [reason,     setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasPending = requests.some(r => r.status === "PENDING");

  useEffect(() => {
    Promise.allSettled([
      api.get("/token/balance"),
      api.get<{ data: TokenRequest[] }>("/token-requests/me"),
    ]).then(([balRes, reqRes]) => {
      if (balRes.status === "fulfilled")  setBalance(balRes.value.data?.data?.tokenBalance ?? 0);
      if (reqRes.status === "fulfilled")  setRequests(reqRes.value.data.data);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = parseInt(amount);
    if (!qty || qty < 1) { swError("Input Tidak Valid", "Masukkan jumlah token yang valid."); return; }
    setSubmitting(true);
    try {
      await api.post("/token-requests", { amount: qty, reason: reason || undefined });
      const { data } = await api.get<{ data: TokenRequest[] }>("/token-requests/me");
      setRequests(data.data);
      setAmount(""); setReason("");
      swSuccess("Pengajuan Terkirim", `Pengajuan ${qty} token telah dikirim. Admin akan meninjau segera.`);
    } catch (err: any) {
      swError("Gagal", err?.response?.data?.error ?? "Terjadi kesalahan");
    } finally { setSubmitting(false); }
  }

  const formatDT = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* Header saldo */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 18,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent, rgba(200,150,10,0.35), transparent)" }} />
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-dim)", border: "1.5px solid rgba(200,150,10,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FA icon={faCoins} style={{ fontSize: 22, color: "var(--accent)" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>Saldo Token Anda</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.5px" }}>
            {balance === null ? "—" : balance.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>token tersedia</div>
        </div>
      </div>

      {/* Form pengajuan */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <FA icon={faPaperPlane} style={{ fontSize: 13, color: "var(--accent)" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Ajukan Penambahan Token</span>
        </div>

        {hasPending ? (
          <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--yellow-dim)", border: "1px solid rgba(234,179,8,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FA icon={faClock} style={{ fontSize: 15, color: "var(--yellow)" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Pengajuan Sedang Diproses</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Anda memiliki pengajuan yang sedang menunggu persetujuan admin. Harap tunggu hingga pengajuan selesai diproses sebelum mengajukan yang baru.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Jumlah Token yang Diajukan</label>
              <input type="number" value={amount} min={1} max={10000}
                onChange={e => setAmount(e.target.value)}
                placeholder="Contoh: 100"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>Maks. 10.000 token per pengajuan</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Alasan Pengajuan <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opsional)</span>
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                rows={3} placeholder="Jelaskan kebutuhan token Anda..."
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <button type="submit" disabled={submitting || !amount} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "11px", borderRadius: 8, border: "none",
              background: submitting || !amount ? "var(--bg-elevated)" : "linear-gradient(135deg, #B8840A 0%, #E0A80C 50%, #B8840A 100%)",
              color: submitting || !amount ? "var(--text-muted)" : "#0C0B08",
              fontSize: 14, fontWeight: 700, cursor: submitting || !amount ? "not-allowed" : "pointer",
              boxShadow: submitting || !amount ? "none" : "0 4px 16px rgba(200,150,10,0.3)",
            }}>
              <FA icon={faPaperPlane} style={{ fontSize: 13 }} />
              {submitting ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </form>
        )}
      </div>

      {/* Riwayat pengajuan */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Riwayat Pengajuan</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Memuat...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <FA icon={faCoins} style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.2, marginBottom: 10 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 10 }}>Belum ada pengajuan</p>
          </div>
        ) : (
          <div>
            {requests.map((r, i) => {
              const s = STATUS_STYLE[r.status];
              return (
                <div key={r.id} style={{ padding: "14px 20px", borderBottom: i < requests.length - 1 ? "1px solid var(--border)" : "none", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.bg, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FA icon={s.icon} style={{ fontSize: 15, color: s.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
                        <FA icon={faCoins} style={{ fontSize: 12, marginRight: 5 }} />
                        {r.amount.toLocaleString("id-ID")} token
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: s.bg, color: s.color, flexShrink: 0 }}>
                        {s.label}
                      </span>
                    </div>
                    {r.reason && <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, lineHeight: 1.5 }}>{r.reason}</p>}
                    {r.adminNote && (
                      <div style={{ fontSize: 12, color: r.status === "APPROVED" ? "var(--green)" : "var(--red)", padding: "6px 10px", borderRadius: 6, background: s.bg, marginBottom: 4 }}>
                        <FA icon={faTriangleExclamation} style={{ fontSize: 10, marginRight: 5 }} />
                        {r.adminNote}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDT(r.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 7 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.15s" };
