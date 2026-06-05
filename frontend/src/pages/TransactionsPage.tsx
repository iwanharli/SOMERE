import { useEffect, useState } from "react";
import { api } from "../lib/api";
import SyncButton from "../components/SyncButton";
import { FA } from "../components/Icon";
import {
  faCreditCard, faArrowTrendUp, faArrowTrendDown,
  faChevronLeft, faChevronRight,
  faHashtag, faAlignLeft, faSackDollar, faCalendar, faTableList, faCoins,
} from "@fortawesome/free-solid-svg-icons";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface PaginatedResponse {
  success: boolean;
  data: Transaction[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

const TABLE_HEADERS: { label: string; icon: any }[] = [
  { label: "ID",            icon: faHashtag      },
  { label: "Tipe",          icon: faArrowTrendUp  },
  { label: "Deskripsi",     icon: faAlignLeft     },
  { label: "Jumlah",        icon: faSackDollar    },
  { label: "Saldo Sebelum", icon: faCoins         },
  { label: "Saldo Sesudah", icon: faCoins         },
  { label: "Tanggal",       icon: faCalendar      },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta]   = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [page, setPage]   = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse>(`/panelin/transactions?page=${page}`)
      .then((res) => { setTransactions(res.data.data ?? []); if (res.data.meta) setMeta(res.data.meta); })
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [page]);

  const formatIDR = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  return (
    <>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
              <FA icon={faCreditCard} style={{ color: "gold" }} />
              Transaksi
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Riwayat transaksi saldo</p>
          </div>
          <SyncButton endpoint="/panelin/sync/transactions" label="Sinkronkan Transaksi" onDone={() => setPage(1)} />
        </div>

        {!loading && (
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Total: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{meta.total}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Halaman: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{meta.current_page} / {meta.last_page}</span>
            </div>
          </div>
        )}

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {!loading && transactions.length > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", gap: 6 }}>
              <FA icon={faTableList} style={{ fontSize: 11, color: "var(--text-secondary)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Daftar Transaksi</span>
            </div>
          )}
          {loading ? <LoadingTable /> : transactions.length === 0 ? <EmptyState /> : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                    {TABLE_HEADERS.map((h) => (
                      <th key={h.label} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <FA icon={h.icon} style={{ fontSize: 10 }} />
                          {h.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => {
                    const isCredit = t.amount >= 0;
                    return (
                      <tr key={t.id}
                        style={{ borderBottom: i < transactions.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                          #{t.id}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 13, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                            background: isCredit ? "var(--green-dim)" : "var(--red-dim)",
                            color: isCredit ? "var(--green)" : "var(--red)",
                          }}>
                            <FA icon={isCredit ? faArrowTrendUp : faArrowTrendDown} style={{ fontSize: 12 }} />
                            {t.type ?? (isCredit ? "credit" : "debit")}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 260 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.description ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", color: isCredit ? "var(--green)" : "var(--red)" }}>
                          {isCredit ? "+" : ""}{formatIDR(t.amount)}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {t.balance_before !== undefined ? formatIDR(t.balance_before) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {t.balance_after !== undefined ? formatIDR(t.balance_after) : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {meta.last_page > 1 && (
                <div style={{
                  padding: "12px 20px", borderTop: "1px solid var(--border)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {((page - 1) * meta.per_page) + 1}–{Math.min(page * meta.per_page, meta.total)} dari {meta.total} transaksi
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <PageBtn icon={faChevronLeft}  disabled={page <= 1}               onClick={() => setPage(p => p - 1)} />
                    {paginationRange(page, meta.last_page).map((p, i) =>
                      p === "…"
                        ? <span key={i} style={{ padding: "5px 4px", fontSize: 12, color: "var(--text-secondary)" }}>…</span>
                        : <PageBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(Number(p))} />
                    )}
                    <PageBtn icon={faChevronRight} disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

}

function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PageBtn({ label, icon, onClick, disabled, active }: { label?: string; icon?: any; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 30, height: 30, padding: "0 8px", fontSize: 12,
      borderRadius: "var(--radius-sm)", border: "1px solid var(--border)",
      background: active ? "var(--accent)" : "var(--bg-elevated)",
      color: active ? "#fff" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>
      {icon ? <FA icon={icon} style={{ fontSize: 12 }} /> : label}
    </button>
  );
}

function LoadingTable() {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 14, opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <FA icon={faCreditCard} style={{ fontSize: 30, color: "var(--text-secondary)", opacity: 0.4 }} />
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 12 }}>Tidak ada transaksi</p>
    </div>
  );
}
