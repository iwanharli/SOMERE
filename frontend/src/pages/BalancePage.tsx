import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { swSuccess, swError } from "../lib/swal";
import SyncButton from "../components/SyncButton";
import { FA } from "../components/Icon";
import {
  faCoins, faClockRotateLeft,
  faCircleCheck, faCircleXmark,
  faUser, faChevronLeft, faChevronRight,
  faCreditCard, faArrowTrendUp, faArrowTrendDown, faClock, faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

interface UserSummary {
  id: string; username: string; name: string; email: string;
  tokenBalance: number; totalInjected: number; totalDeducted: number;
  totalUsed: number; totalRefunded: number;
}

interface TokenTx {
  id: string; userId: string; type: string; amount: number;
  balanceBefore: number; balanceAfter: number; note: string | null;
  orderId: number | null; serviceId: number | null; tokenPrice: number | null;
  createdAt: string;
  user?:      { id: string; username: string; name: string };
  performer?: { id: string; username: string; name: string } | null;
}

const TYPE_STYLE: Record<string, [string, string, string]> = {
  INJECT:  ["var(--green-dim)",  "var(--green)",  "+"],
  REFUND:  ["var(--blue-dim)",   "var(--blue)",   "+"],
  ORDER:   ["var(--yellow-dim)", "var(--yellow)", "−"],
  DEDUCT:  ["var(--red-dim)",    "var(--red)",    "−"],
};

export default function BalancePage() {
  const [activeTab,    setActiveTab]    = useState<"token" | "transaksi" | "pengajuan">("token");
  const [tokenReqs,    setTokenReqs]    = useState<any[]>([]);
  const [loadingReqs,  setLoadingReqs]  = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "pengajuan") return;
    setLoadingReqs(true);
    api.get("/token-requests")
      .then(r => setTokenReqs(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingReqs(false));
  }, [activeTab]);

  // ── Transaksi IDR state ──
  const [provTxs,     setProvTxs]    = useState<any[]>([]);
  const [provMeta,    setProvMeta]   = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [provPage,    setProvPage]   = useState(1);
  const [provLoading, setProvLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "transaksi") return;
    setProvLoading(true);
    api.get(`/panelin/transactions?page=${provPage}`)
      .then(r => { setProvTxs(r.data?.data ?? []); if (r.data?.meta) setProvMeta(r.data.meta); })
      .catch(() => {})
      .finally(() => setProvLoading(false));
  }, [activeTab, provPage]);

  const [users, setUsers]           = useState<UserSummary[]>([]);
  const [selectedUser, setSelected] = useState<UserSummary | null>(null);
  const [txs, setTxs]               = useState<TokenTx[]>([]);
  const [txMeta, setTxMeta]         = useState({ total: 0, last_page: 1, current_page: 1 });
  const [txPage, setTxPage]         = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTx, setLoadingTx]   = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const { data } = await api.get<{ data: UserSummary[] }>("/token/users-summary");
      setUsers(data.data);
    } finally { setLoadingUsers(false); }
  }

  async function loadTx(userId: string, page = 1) {
    setLoadingTx(true);
    try {
      const { data } = await api.get<{ data: TokenTx[]; meta: any }>(`/token/transactions?userId=${userId}&page=${page}`);
      setTxs(data.data);
      setTxMeta(data.meta);
    } finally { setLoadingTx(false); }
  }

  function selectUser(u: UserSummary) {
    setSelected(u); setTxPage(1); loadTx(u.id, 1);
  }

  const formatIDR = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);


  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>Manajemen Balance</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Kelola saldo token pengguna</p>
        </div>

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 4, width: "fit-content" }}>
          {([
            { key: "token",     icon: faCoins,      label: "Token Pengguna" },
            { key: "transaksi", icon: faCreditCard,  label: "Transaksi IDR"  },
            { key: "pengajuan",  icon: faPaperPlane,  label: "Pengajuan Token" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 5, border: "none", fontSize: 13, fontWeight: 500,
              background: activeTab === t.key ? "var(--bg-surface)" : "transparent",
              color: activeTab === t.key ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.12s",
              boxShadow: activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
            }}>
              <FA icon={t.icon} style={{ fontSize: 12 }} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Transaksi IDR ── */}
        {activeTab === "transaksi" && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Transaksi IDR</span>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Riwayat mutasi saldo akun provider</p>
              </div>
              <SyncButton endpoint="/panelin/sync/transactions" label="Sinkronkan Transaksi" onDone={() => setProvPage(1)} />
            </div>

            {!provLoading && (
              <div style={{ display: "flex", gap: 20, padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total: <strong style={{ color: "var(--text-primary)" }}>{provMeta.total}</strong></span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Halaman: <strong style={{ color: "var(--text-primary)" }}>{provMeta.current_page} / {provMeta.last_page}</strong></span>
              </div>
            )}

            {provLoading ? (
              <div style={{ padding: 20 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 14, opacity: 1 - i * 0.1 }} />)}</div>
            ) : provTxs.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <FA icon={faCreditCard} style={{ fontSize: 28, opacity: 0.2, marginBottom: 10 }} />
                <p style={{ marginTop: 10 }}>Belum ada transaksi</p>
              </div>
            ) : (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                      {["ID", "Tipe", "Keterangan", "Jumlah", "Saldo Sebelum", "Saldo Sesudah", "Tanggal"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {provTxs.map((t: any, i: number) => {
                      const isCredit = t.amount >= 0;
                      return (
                        <tr key={t.id}
                          style={{ borderBottom: i < provTxs.length - 1 ? "1px solid var(--border)" : "none" }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>#{t.id}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: isCredit ? "var(--green-dim)" : "var(--red-dim)", color: isCredit ? "var(--green)" : "var(--red)" }}>
                              <FA icon={isCredit ? faArrowTrendUp : faArrowTrendDown} style={{ fontSize: 10 }} />
                              {t.type ?? (isCredit ? "kredit" : "debit")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 260 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description ?? "—"}</div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", color: isCredit ? "var(--green)" : "var(--red)" }}>
                            {isCredit ? "+" : ""}{formatIDR(t.amount)}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{t.balance_before !== undefined ? formatIDR(t.balance_before) : "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{t.balance_after !== undefined ? formatIDR(t.balance_after) : "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {provMeta.last_page > 1 && (
                  <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{((provPage - 1) * provMeta.per_page) + 1}–{Math.min(provPage * provMeta.per_page, provMeta.total)} dari {provMeta.total}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <PBtn icon={faChevronLeft}  disabled={provPage <= 1}                onClick={() => setProvPage(p => p - 1)} />
                      <PBtn icon={faChevronRight} disabled={provPage >= provMeta.last_page} onClick={() => setProvPage(p => p + 1)} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Pengajuan Token ── */}
        {activeTab === "pengajuan" && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Pengajuan Token dari Pengguna</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{tokenReqs.filter(r => r.status === "PENDING").length} menunggu</span>
            </div>
            {loadingReqs ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Memuat...</div>
            ) : tokenReqs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <FA icon={faPaperPlane} style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.2 }} />
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>Belum ada pengajuan</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                    {["Pengguna", "Jumlah", "Alasan", "Status", "Waktu", ""].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokenReqs.map((r: any, i: number) => {
                    const isPending = r.status === "PENDING";
                    const sColor = r.status === "APPROVED" ? "var(--green)" : r.status === "REJECTED" ? "var(--red)" : "var(--yellow)";
                    const sBg    = r.status === "APPROVED" ? "var(--green-dim)" : r.status === "REJECTED" ? "var(--red-dim)" : "var(--yellow-dim)";
                    const sLabel = r.status === "APPROVED" ? "Disetujui" : r.status === "REJECTED" ? "Ditolak" : "Menunggu";
                    const sIcon  = r.status === "APPROVED" ? faCircleCheck : r.status === "REJECTED" ? faCircleXmark : faClock;
                    return (
                      <tr key={r.id} style={{ borderBottom: i < tokenReqs.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.user?.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{r.user?.username} · {r.user?.tokenBalance} token</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap" }}>
                          <FA icon={faCoins} style={{ fontSize: 11, marginRight: 4 }} />{r.amount.toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason ?? "—"}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: sBg, color: sColor }}>
                            <FA icon={sIcon} style={{ fontSize: 10 }} />{sLabel}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {isPending && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button disabled={processingId === r.id} onClick={async () => {
                                setProcessingId(r.id);
                                try { await api.patch(`/token-requests/${r.id}`, { status: "APPROVED" }); setTokenReqs(prev => prev.map(x => x.id === r.id ? { ...x, status: "APPROVED" } : x)); }
                                catch {} finally { setProcessingId(null); }
                              }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "var(--green-dim)", color: "var(--green)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                Setujui
                              </button>
                              <button disabled={processingId === r.id} onClick={async () => {
                                setProcessingId(r.id);
                                try { await api.patch(`/token-requests/${r.id}`, { status: "REJECTED" }); setTokenReqs(prev => prev.map(x => x.id === r.id ? { ...x, status: "REJECTED" } : x)); }
                                catch {} finally { setProcessingId(null); }
                              }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "var(--red-dim)", color: "var(--red)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                Tolak
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Token Pengguna ── */}
        {activeTab === "token" && <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>

          {/* ── Kiri: daftar user ── */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Pengguna</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{users.length} user</span>
            </div>
            {loadingUsers ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Memuat...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Belum ada user</div>
            ) : (
              users.map((u) => {
                const active = selectedUser?.id === u.id;
                return (
                  <div
                    key={u.id} onClick={() => selectUser(u)}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      background: active ? "var(--accent-dim)" : "transparent",
                      borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{u.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                        <FA icon={faCoins} style={{ fontSize: 11, marginRight: 4 }} />{u.tokenBalance.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>@{u.username}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Kanan: detail user ── */}
          {!selectedUser ? (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 48, textAlign: "center" }}>
              <FA icon={faUser} style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.2 }} />
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>Pilih pengguna untuk melihat detail</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* User info + actions */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-dim)", border: "1.5px solid rgba(200,150,10,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedUser.name}</div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>@{selectedUser.username} · {selectedUser.email}</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 18 }}>
                  {[
                    { label: "Tagihan",      value: selectedUser.tokenBalance,  color: selectedUser.tokenBalance < 0 ? "var(--red)" : "var(--accent)" },
                    { label: "Total Dipakai", value: selectedUser.totalUsed,     color: "var(--yellow)" },
                    { label: "Dikembalikan",  value: selectedUser.totalRefunded, color: "var(--blue)"   },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value.toLocaleString("id-ID")}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>token</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction history */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <FA icon={faClockRotateLeft} style={{ fontSize: 13, color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Riwayat Transaksi Token</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{txMeta.total} transaksi</span>
                </div>

                {loadingTx ? (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Memuat...</div>
                ) : txs.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Belum ada transaksi</div>
                ) : (
                  <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                          {["Tipe", "Jumlah", "Saldo", "Tugas", "Keterangan", "Oleh", "Waktu"].map((h) => (
                            <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {txs.map((tx, i) => {
                          const [bg, fg, sign] = TYPE_STYLE[tx.type] ?? ["var(--bg-elevated)", "var(--text-muted)", ""];
                          return (
                            <tr key={tx.id}
                              style={{ borderBottom: i < txs.length - 1 ? "1px solid var(--border)" : "none" }}
                              onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                              onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                            >
                              <td style={{ padding: "11px 16px" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: bg, color: fg }}>{tx.type}</span>
                              </td>
                              <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: fg, whiteSpace: "nowrap" }}>
                                {sign}{tx.amount.toLocaleString("id-ID")}
                              </td>
                              <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {tx.balanceBefore.toLocaleString()} → <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{tx.balanceAfter.toLocaleString()}</span>
                              </td>
                              <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>
                                {tx.orderId ? `#${tx.orderId}` : "—"}
                              </td>
                              <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-secondary)", maxWidth: 200 }}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note ?? "—"}</div>
                              </td>
                              <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                                {tx.performer ? `@${tx.performer.username}` : "sistem"}
                              </td>
                              <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {formatDate(tx.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {txMeta.last_page > 1 && (
                      <div style={{ padding: "11px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Hal. {txMeta.current_page} / {txMeta.last_page}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <PageBtn icon={faChevronLeft}  disabled={txPage <= 1}              onClick={() => { setTxPage(p => p - 1); loadTx(selectedUser.id, txPage - 1); }} />
                          <PageBtn icon={faChevronRight} disabled={txPage >= txMeta.last_page} onClick={() => { setTxPage(p => p + 1); loadTx(selectedUser.id, txPage + 1); }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>}
      </div>


      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );

}

function PageBtn({ icon, onClick, disabled }: { icon: any; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: disabled ? "var(--text-muted)" : "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: disabled ? 0.45 : 1 }}>
      <FA icon={icon} style={{ fontSize: 10 }} />
    </button>
  );
}

const btnStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.15s" };
const cancelBtnStyle: React.CSSProperties = { padding: "10px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer" };
