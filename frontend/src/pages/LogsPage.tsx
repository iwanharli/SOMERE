import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { FA } from "../components/Icon";
import {
  faMagnifyingGlass, faFilter, faXmark, faChevronLeft, faChevronRight,
  faClipboardList, faRightToBracket, faUserPlus, faRightFromBracket,
  faUser, faLock, faPenToSquare, faTrash,
  faArrowUp, faArrowDown, faRotateLeft, faRotate,
  faGear, faCoins,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Log {
  id: string; event: string; description: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null; createdAt: string;
  user?:   { id: string; username: string; name: string; role: string };
  target?: { id: string; username: string; name: string } | null;
}

interface Meta { total: number; current_page: number; last_page: number; per_page: number; }

const EVENT_COLOR: Record<string, [string, string]> = {
  AUTH_LOGIN:           ["var(--green-dim)",  "var(--green)"  ],
  AUTH_REGISTER:        ["var(--blue-dim)",   "var(--blue)"   ],
  AUTH_LOGOUT:          ["rgba(100,100,100,.12)", "var(--text-muted)"],
  PROFILE_UPDATE:       ["var(--accent-dim)", "var(--accent)" ],
  PASSWORD_CHANGE:      ["var(--accent-dim)", "var(--accent)" ],
  USER_CREATE:          ["var(--blue-dim)",   "var(--blue)"   ],
  USER_UPDATE:          ["var(--accent-dim)", "var(--accent)" ],
  USER_DELETE:          ["var(--red-dim)",    "var(--red)"    ],
  TOKEN_INJECT:         ["var(--green-dim)",  "var(--green)"  ],
  TOKEN_DEDUCT:         ["var(--red-dim)",    "var(--red)"    ],
  ORDER_CREATE:         ["var(--yellow-dim)", "var(--yellow)" ],
  ORDER_REFUND:         ["var(--blue-dim)",   "var(--blue)"   ],
  SYNC_SERVICES:        ["rgba(100,100,100,.12)", "var(--text-muted)"],
  SYNC_ORDERS:          ["rgba(100,100,100,.12)", "var(--text-muted)"],
  SYNC_TRANSACTIONS:    ["rgba(100,100,100,.12)", "var(--text-muted)"],
  SETTINGS_TOKEN_VALUE: ["var(--yellow-dim)", "var(--yellow)" ],
  SERVICE_PRICE_SET:    ["var(--yellow-dim)", "var(--yellow)" ],
};

const EVENT_ICON: Record<string, IconDefinition> = {
  AUTH_LOGIN:           faRightToBracket,
  AUTH_REGISTER:        faUserPlus,
  AUTH_LOGOUT:          faRightFromBracket,
  PROFILE_UPDATE:       faUser,
  PASSWORD_CHANGE:      faLock,
  USER_CREATE:          faUserPlus,
  USER_UPDATE:          faPenToSquare,
  USER_DELETE:          faTrash,
  TOKEN_INJECT:         faArrowUp,
  TOKEN_DEDUCT:         faArrowDown,
  ORDER_CREATE:         faClipboardList,
  ORDER_REFUND:         faRotateLeft,
  SYNC_SERVICES:        faRotate,
  SYNC_ORDERS:          faRotate,
  SYNC_TRANSACTIONS:    faRotate,
  SETTINGS_TOKEN_VALUE: faGear,
  SERVICE_PRICE_SET:    faCoins,
};

const EVENT_LABEL: Record<string, string> = {
  AUTH_LOGIN: "Login", AUTH_REGISTER: "Registrasi", AUTH_LOGOUT: "Logout",
  PROFILE_UPDATE: "Update Profil", PASSWORD_CHANGE: "Ganti Password",
  USER_CREATE: "Buat Pengguna", USER_UPDATE: "Edit Pengguna", USER_DELETE: "Hapus Pengguna",
  TOKEN_INJECT: "Tambah Token", TOKEN_DEDUCT: "Kurangi Token",
  ORDER_CREATE: "Buat Tugas", ORDER_REFUND: "Refund Token",
  SYNC_SERVICES: "Sinkronkan Layanan", SYNC_ORDERS: "Sinkronkan Tugas", SYNC_TRANSACTIONS: "Sinkronkan Transaksi",
  SETTINGS_TOKEN_VALUE: "Ubah Nilai Token", SERVICE_PRICE_SET: "Set Harga Layanan",
};

const formatDT = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function LogsPage() {
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [meta,    setMeta]    = useState<Meta>({ total: 0, current_page: 1, last_page: 1, per_page: 30 });
  const [events,  setEvents]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [event,    setEvent]    = useState("");
  const [userId,   setUserId]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (event)  params.set("event",  event);
    if (userId) params.set("userId", userId);
    api.get<{ data: Log[]; meta: Meta }>(`/logs?${params}`)
      .then(r => { setLogs(r.data.data); setMeta(r.data.meta); })
      .finally(() => setLoading(false));
  }, [page, search, event, userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<{ data: string[] }>("/logs/events")
      .then(r => setEvents(r.data.data))
      .catch(() => {});
  }, []);

  function reset() { setSearch(""); setEvent(""); setUserId(""); setPage(1); }
  const isFiltered = search || event || userId;

  return (
    <>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
            <FA icon={faClipboardList} style={{ color: "gold" }} />
            Log Aktivitas
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Riwayat lengkap semua aktivitas di sistem</p>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: 12, pointerEvents: "none" }}>
              <FA icon={faMagnifyingGlass} />
            </span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari deskripsi aktivitas..."
              style={{ width: "100%", padding: "8px 12px 8px 30px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <select value={event} onChange={e => { setEvent(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontSize: 13, outline: "none" }}>
            <option value="">Semua event</option>
            {events.map(e => <option key={e} value={e}>{EVENT_LABEL[e] ?? e}</option>)}
          </select>
          {isFiltered && (
            <button onClick={reset} style={{ padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <FA icon={faXmark} style={{ fontSize: 10 }} /> Reset
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            {loading ? "Memuat..." : `${meta.total.toLocaleString("id-ID")} log`}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 14, opacity: 1 - i * 0.1 }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
              <FA icon={faFilter} style={{ fontSize: 28, opacity: 0.4, marginBottom: 10 }} />
              <p style={{ marginTop: 10 }}>Tidak ada log ditemukan</p>
            </div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                    {["Waktu", "Pengguna", "Aktivitas", "Keterangan", "Target", "Perangkat", "IP Alamat"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => {
                    const [bg, fg] = EVENT_COLOR[l.event] ?? ["var(--bg-elevated)", "var(--text-muted)"];
                    const eventIcon = EVENT_ICON[l.event];
                    return (
                      <tr key={l.id}
                        style={{ borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                      >
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {formatDT(l.createdAt)}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          {l.user ? (
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{l.user.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>@{l.user.username}</div>
                            </div>
                          ) : <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: bg, color: fg, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
                            {eventIcon && <FA icon={eventIcon} style={{ fontSize: 9, marginRight: 4 }} />}
                            {EVENT_LABEL[l.event] ?? l.event}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 320 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.description}</div>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-secondary)" }}>
                          {l.target ? `@${l.target.username}` : "—"}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {(l as any).metadata?.device ?? "—"}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {l.ipAddress ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {meta.last_page > 1 && (
                <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} dari {meta.total}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <PBtn icon={faChevronLeft}  disabled={page <= 1}              onClick={() => setPage(p => p - 1)} />
                    {paginationRange(page, meta.last_page).map((p, i) =>
                      p === "…" ? <span key={i} style={{ padding: "5px 4px", fontSize: 12, color: "var(--text-secondary)" }}>…</span>
                        : <PBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(Number(p))} />
                    )}
                    <PBtn icon={faChevronRight} disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} />
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

function PBtn({ label, icon, onClick, disabled, active }: { label?: string; icon?: any; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ minWidth: 30, height: 30, padding: "0 8px", fontSize: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: active ? "var(--accent)" : "var(--bg-elevated)", color: active ? "#fff" : disabled ? "var(--text-muted)" : "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {icon ? <FA icon={icon} style={{ fontSize: 10 }} /> : label}
    </button>
  );
}
