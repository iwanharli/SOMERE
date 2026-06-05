import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import SyncButton from "../components/SyncButton";
import { FA } from "../components/Icon";
import {
  faClipboardList, faArrowUpRightFromSquare,
  faChevronLeft, faChevronRight, faCircleCheck,
  faClock, faCircleXmark, faRotate, faLayerGroup,
  faCalendar, faCopy, faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram, faTiktok, faYoutube, faXTwitter,
  faFacebook, faTelegram,
} from "@fortawesome/free-brands-svg-icons";
import {
  PLATFORM_COLOR, detectPlatform,
  detectServiceType, SERVICE_TYPES,
  detectReportReason, REPORT_REASONS
} from "../lib/platform";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Order {
  id: number; service_id: number; link: string | null;
  quantity: number; rate: number; charge: number;
  start_count: number | null; remains: number | null;
  status: string; comments: string | null;
  created_at: string; updated_at: string;
  user?: { id: string; username: string; name: string } | null;
}
interface PaginatedResponse {
  success: boolean; data: Order[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  pending:     { label: "Menunggu",   bg: "var(--yellow-dim)", color: "var(--yellow)", icon: faClock       },
  processing:  { label: "Diproses",   bg: "var(--blue-dim)",   color: "var(--blue)",   icon: faRotate      },
  in_progress: { label: "Berjalan",   bg: "var(--blue-dim)",   color: "var(--blue)",   icon: faRotate      },
  completed:   { label: "Selesai",    bg: "var(--green-dim)",  color: "var(--green)",  icon: faCircleCheck },
  partial:     { label: "Sebagian",   bg: "var(--yellow-dim)", color: "var(--yellow)", icon: faClock       },
  cancelled:   { label: "Dibatalkan", bg: "var(--red-dim)",    color: "var(--red)",    icon: faCircleXmark },
  refunded:    { label: "Dikembalikan", bg: "rgba(100,100,100,.15)", color: "var(--text-secondary)", icon: faCircleXmark },
};

const PLATFORM_ICON: Record<string, IconProp> = {
  Instagram: faInstagram, TikTok: faTiktok, YouTube: faYoutube,
  Twitter: faXTwitter, Facebook: faFacebook, Telegram: faTelegram,
};

const FILTER_OPTIONS = [
  { key: "all",       label: "Semua"      },
  { key: "active",    label: "Aktif"      },
  { key: "completed", label: "Selesai"    },
  { key: "cancelled", label: "Dibatalkan" },
];

export default function TugasPage() {
  const isAdmin = useAuthStore(s => s.isAdmin)();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [services, setServices]   = useState<Record<number, string>>({});
  const [meta, setMeta]           = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState("all");
  const [refreshing, setRefreshing] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId]   = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  async function refreshOrder(id: number) {
    setRefreshing(r => ({ ...r, [id]: true }));
    try {
      const { data } = await api.patch(`/panelin/orders/${id}/refresh`);
      const updated: Order = data.data;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
    } catch {}
    finally { setRefreshing(r => ({ ...r, [id]: false })); }
  }

  useEffect(() => {
    setLoading(true);
    api.get<PaginatedResponse>(`/panelin/orders?page=${page}`)
      .then(res => { setOrders(res.data.data ?? []); if (res.data.meta) setMeta(res.data.meta); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    api.get("/panelin/services").then(r => {
      const d = r.data?.data;
      const arr = Array.isArray(d) ? d : typeof d === "string" ? JSON.parse(d) : [];
      setServices(Object.fromEntries(arr.map((s: any) => [s.id, s.name])));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Auto-refresh active tasks (pending, processing, in_progress) in background every 15 seconds
    const activeOrders = orders.filter(o => ["pending", "processing", "in_progress"].includes(o.status));
    if (activeOrders.length === 0) return;

    const interval = setInterval(() => {
      activeOrders.forEach(async (o) => {
        try {
          const { data } = await api.patch(`/panelin/orders/${o.id}/refresh`);
          const updated: Order = data.data;
          setOrders(prev => prev.map(item => item.id === o.id ? { ...item, ...updated } : item));
        } catch {}
      });
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [orders]);

  const filteredOrders = orders.filter(o => {
    if (filter === "all")       return true;
    if (filter === "active")    return ["pending","processing","in_progress"].includes(o.status);
    if (filter === "completed") return o.status === "completed";
    if (filter === "cancelled") return ["cancelled","refunded","partial"].includes(o.status);
    return true;
  });

  const formatIDR  = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // ── Admin view ──────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div style={{ animation: "slideUp 0.4s ease-out" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <FA icon={faClipboardList} style={{ color: "var(--accent)", fontSize: 18 }} />
              Riwayat Tugas (Admin)
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Semua tugas pelaporan dari seluruh pengguna sistem</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <SyncButton endpoint="/panelin/sync/orders/active" label="Sinkronkan Aktif" onDone={() => setPage(1)} />
            <SyncButton endpoint="/panelin/sync/orders" label="Sinkronkan Semua" onDone={() => setPage(1)} />
          </div>
        </div>

        {!loading && (
          <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 8 }}>
              Total Tugas: <strong style={{ color: "var(--accent)" }}>{meta.total.toLocaleString("id-ID")}</strong>
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 8 }}>
              Halaman: <strong style={{ color: "var(--text-primary)" }}>{meta.current_page} / {meta.last_page}</strong>
            </span>
          </div>
        )}

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
          {loading ? <LoadingTable /> : orders.length === 0 ? <EmptyState /> : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                      {["ID","Pengguna","Layanan","Link / Target","Jml","Harga","Biaya","Sisa","Status","Tanggal"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => {
                      const st = STATUS_MAP[o.status?.toLowerCase()];
                      const svcName = services[o.service_id] ?? "";
                      const platform = detectPlatform(svcName);
                      const pColor = platform ? PLATFORM_COLOR[platform] : "var(--text-muted)";
                      
                      return (
                        <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                          
                          {/* ID */}
                          <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>#{o.id}</td>
                          
                          {/* Pengguna */}
                          <td style={{ padding: "14px 16px" }}>
                            {o.user ? (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{o.user.name}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>@{o.user.username}</div>
                              </div>
                            ) : <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>System / Admin</span>}
                          </td>
                          
                          {/* Layanan */}
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: pColor,
                                display: "inline-block"
                              }} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                                {platform ? `${platform} (#${o.service_id})` : `#${o.service_id}`}
                              </span>
                            </div>
                            {svcName && (
                              <div style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }} title={svcName}>
                                {svcName.replace(/\s*\[.+?\]/, "").trim()}
                              </div>
                            )}
                          </td>
                          
                          {/* Link / Target */}
                          <td style={{ padding: "14px 16px", maxWidth: 220 }}>
                            {o.link ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <a href={o.link} target="_blank" rel="noreferrer" style={{
                                  fontSize: 12,
                                  color: "var(--accent)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1
                                }}>
                                  {o.link.replace(/^https?:\/\/(www\.)?/, "")}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(o.link!, o.id)}
                                  title="Salin Link"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: copiedId === o.id ? "var(--green)" : "var(--text-secondary)",
                                    cursor: "pointer",
                                    padding: 2,
                                    borderRadius: 3,
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                >
                                  <FA icon={copiedId === o.id ? faCheck : faCopy} style={{ fontSize: 11 }} />
                                </button>
                                <a href={o.link} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                                  <FA icon={faArrowUpRightFromSquare} style={{ fontSize: 11 }} />
                                </a>
                              </div>
                            ) : <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>—</span>}
                          </td>
                          
                          {/* Jml (Quantity) */}
                          <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{o.quantity.toLocaleString("id-ID")}</td>
                          
                          {/* Harga */}
                          <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatIDR(o.rate)}</td>
                          
                          {/* Biaya */}
                          <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap" }}>{formatIDR(o.charge)}</td>
                          
                          {/* Sisa */}
                          <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{o.remains !== null ? o.remains.toLocaleString("id-ID") : "—"}</td>
                          
                          {/* Status */}
                          <td style={{ padding: "14px 16px" }}>
                            {st && (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: st.bg,
                                color: st.color,
                                border: `1px solid ${st.color}20`
                              }}>
                                {st.label}
                              </span>
                            )}
                          </td>
                          
                          {/* Tanggal */}
                          <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            <div>{formatDate(o.created_at)}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{formatTime(o.created_at)}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {meta.last_page > 1 && (
                <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{((page-1)*meta.per_page)+1}–{Math.min(page*meta.per_page,meta.total)} dari {meta.total}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <PBtn icon={faChevronLeft} disabled={page<=1} onClick={() => setPage(p=>p-1)} />
                    <PBtn icon={faChevronRight} disabled={page>=meta.last_page} onClick={() => setPage(p=>p+1)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── User view ───────────────────────────────────────────────────────────────
  const stats = {
    total:     orders.length,
    active:    orders.filter(o => ["pending","processing","in_progress"].includes(o.status)).length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => ["cancelled","refunded","partial"].includes(o.status)).length,
  };

  return (
    <div style={{ animation: "slideUp 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <FA icon={faClipboardList} style={{ color: "var(--accent)", fontSize: 18 }} />
            Riwayat Tugas
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Semua tugas pelaporan yang pernah Anda kirimkan</p>
        </div>
      </div>

      {/* Stat cards */}
      {!loading && orders.length > 0 && (
        <div className="user-orders-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Tugas",   value: stats.total,     color: "var(--accent)", dim: "var(--accent-dim)",  border: "rgba(200,150,10,0.2)",  icon: faClipboardList },
            { label: "Tugas Aktif",   value: stats.active,    color: "var(--blue)",   dim: "var(--blue-dim)",    border: "rgba(59,130,246,0.15)", icon: faRotate, pulse: stats.active > 0 },
            { label: "Tugas Selesai", value: stats.completed, color: "var(--green)",  dim: "var(--green-dim)",   border: "rgba(34,197,94,0.15)",  icon: faCircleCheck },
            { label: "Dibatalkan",    value: stats.cancelled, color: "var(--red)",    dim: "var(--red-dim)",     border: "rgba(239,68,68,0.15)",  icon: faCircleXmark },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{
              background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(26,29,46,0.4) 100%)",
              border: `1px solid ${s.border}`,
              borderRadius: "var(--radius)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}>
              <div style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: 120,
                height: 120,
                background: s.color,
                filter: "blur(50px)",
                opacity: 0.08,
                borderRadius: "50%",
                pointerEvents: "none"
              }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{s.label}</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{s.value}</span>
              </div>

              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: s.dim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${s.border}`,
                color: s.color,
              }}>
                <FA icon={s.icon} style={{
                  fontSize: 16,
                  animation: s.pulse ? "spin 3s linear infinite" : "none"
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        gap: 12,
        flexWrap: "wrap"
      }}>
        <div style={{
          display: "inline-flex",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 3,
          gap: 2,
        }}>
          {FILTER_OPTIONS.map(f => {
            const isActive = filter === f.key;
            const count = f.key === "all" ? orders.length
              : f.key === "active" ? orders.filter(o => ["pending","processing","in_progress"].includes(o.status)).length
              : f.key === "completed" ? orders.filter(o => o.status === "completed").length
              : orders.filter(o => ["cancelled","refunded","partial"].includes(o.status)).length;

            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  border: "none",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#000" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: isActive ? "rgba(0,0,0,0.15)" : "var(--border-light)",
                  color: isActive ? "#000" : "var(--text-muted)",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {orders.some(o => ["pending", "processing", "in_progress"].includes(o.status)) && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--green)",
              background: "var(--green-dim)",
              padding: "4px 10px",
              borderRadius: 20,
              border: "1px solid rgba(34, 197, 94, 0.15)",
              fontWeight: 500
            }}>
              <span className="pulse-dot" style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 8px var(--green)"
              }} />
              Auto-refresh Aktif
            </span>
          )}
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Menampilkan <strong style={{ color: "var(--text-primary)" }}>{filteredOrders.length}</strong> tugas
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{
              height: 96,
              background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(26,29,46,0.3) 100%)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              opacity: 1 - i * 0.18,
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
                animation: "shimmer-bar 1.5s infinite"
              }} />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {filteredOrders.map((o, idx) => {
              const st        = STATUS_MAP[o.status];
              const svcName   = services[o.service_id] ?? "";
              const platform  = detectPlatform(svcName);
              const pColor    = platform ? PLATFORM_COLOR[platform] : "#6366f1";
              const pIcon     = platform ? PLATFORM_ICON[platform] : null;
              const cleanName = svcName.replace(/\s*\[.+?\]/, "").trim();
              const bracketMatch = svcName.match(/\[(.+?)\]/);
              const svcType   = bracketMatch ? bracketMatch[1] : null;
              
              const detectedTypeKey = detectServiceType(svcName);
              const detectedReasonKey = detectReportReason(svcName);
              const detectedType = SERVICE_TYPES[detectedTypeKey];
              const detectedReason = REPORT_REASONS[detectedReasonKey];

              const progress  = o.remains !== null && o.quantity > 0
                ? o.status === "completed" ? 100
                  : Math.min(99, Math.max(0, Math.round(((o.quantity - o.remains) / o.quantity) * 100)))
                : o.status === "completed" ? 100 : null;
              const isActive  = ["pending","processing","in_progress"].includes(o.status);

              return (
                <div
                  key={o.id}
                  className="order-card"
                  style={{
                    background: "linear-gradient(145deg, var(--bg-surface) 0%, #161924 100%)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                    animationDelay: `${idx * 0.05}s`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    position: "relative",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = pColor;
                    el.style.boxShadow = `0 8px 30px -5px ${pColor}20`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "var(--border)";
                    el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  }}
                >
                  <div style={{ display: "flex", height: "100%" }}>
                    {/* Left Accent Color Indicator */}
                    <div style={{ width: 4, flexShrink: 0, background: st?.color ?? "var(--border)", borderRadius: "4px 0 0 4px" }} />

                    <div className="order-card-body" style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Top Row / Header: Platform left, Status centered, Date right */}
                      <div className="order-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border-light)", paddingBottom: 12, gap: 12 }}>
                        {/* Left: Platform Identity */}
                        <div className="order-card-header-left" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${pColor}12`,
                            border: `1px solid ${pColor}25`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "transform 0.2s"
                          }}
                          className="platform-icon-box"
                          >
                            {pIcon ? <FA icon={pIcon} style={{ fontSize: 14, color: pColor }} /> : <FA icon={faLayerGroup} style={{ fontSize: 13, color: pColor }} />}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>{platform ?? "Layanan"}</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>•</span>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace", fontWeight: 600 }}>#{o.id}</span>
                          </div>
                        </div>

                        {/* Middle: Status Pill */}
                        {st && (
                          <div className="order-card-header-middle" style={{ display: "flex", justifyContent: "center", flex: 1 }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              padding: "4px 12px",
                              borderRadius: 20,
                              background: st.bg,
                              color: st.color,
                              border: `1px solid ${st.color}20`,
                              boxShadow: `0 2px 8px -2px ${st.color}15`,
                              justifyContent: "center"
                            }}>
                              {isActive ? (
                                <span className="pulse-dot" style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: st.color,
                                  boxShadow: `0 0 8px ${st.color}`
                                }} />
                              ) : (
                                <FA icon={st.icon} style={{ fontSize: 11 }} />
                              )}
                              {st.label}
                            </span>
                          </div>
                        )}

                        {/* Right: Date & Time */}
                        <div className="order-card-header-right" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>
                          <FA icon={faCalendar} style={{ fontSize: 11, color: "var(--text-muted)" }} />
                          <span style={{ fontWeight: 500 }}>{formatDate(o.created_at)}</span>
                          <span style={{ color: "var(--text-muted)" }}>|</span>
                          <span style={{ fontFamily: "monospace" }}>{formatTime(o.created_at)}</span>
                        </div>
                      </div>

                      {/* Middle Section: Service Info & Target URL */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div className="order-card-title-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }} title={cleanName}>
                            {cleanName || `Layanan #${o.service_id}`}
                          </h3>
                          {/* Service badges (Type / Reason) */}
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {detectedType && (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: detectedType.color,
                                background: `${detectedType.color}12`,
                                border: `1px solid ${detectedType.color}20`,
                                padding: "2px 8px",
                                borderRadius: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.02em"
                              }}>{detectedType.label}</span>
                            )}
                            {svcType ? (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: `color-mix(in srgb, ${pColor} 90%, white)`,
                                background: `${pColor}12`,
                                border: `1px solid ${pColor}20`,
                                padding: "2px 8px",
                                borderRadius: 6
                              }}>{svcType}</span>
                            ) : detectedReason ? (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: detectedReason.color,
                                background: `${detectedReason.color}12`,
                                border: `1px solid ${detectedReason.color}20`,
                                padding: "2px 8px",
                                borderRadius: 6
                              }}>{detectedReason.label}</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Target Link Container */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          background: "rgba(255, 255, 255, 0.015)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "8px 14px",
                          marginTop: 4,
                          transition: "border-color 0.2s, background 0.2s"
                        }}
                        className="target-link-container"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                              Target
                            </span>
                            {o.link ? (
                              <a href={o.link} target="_blank" rel="noreferrer" style={{
                                fontSize: 13,
                                fontFamily: "monospace",
                                color: "var(--accent)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textDecoration: "none",
                                flex: 1
                              }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                              >
                                {o.link}
                              </a>
                            ) : (
                              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace" }}>—</span>
                            )}
                          </div>
                          {o.link && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <button
                                onClick={() => copyToClipboard(o.link!, o.id)}
                                title="Salin Link"
                                style={{
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 6,
                                  color: copiedId === o.id ? "var(--green)" : "var(--text-secondary)",
                                  cursor: "pointer",
                                  padding: "5px 8px",
                                  display: "flex",
                                  alignItems: "center",
                                  transition: "all 0.15s"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                              >
                                <FA icon={copiedId === o.id ? faCheck : faCopy} style={{ fontSize: 11 }} />
                              </button>
                              <a href={o.link} target="_blank" rel="noreferrer" style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid var(--border)",
                                borderRadius: 6,
                                color: "var(--text-secondary)",
                                cursor: "pointer",
                                padding: "5px 8px",
                                display: "flex",
                                alignItems: "center",
                                transition: "all 0.15s",
                                textDecoration: "none"
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                              >
                                <FA icon={faArrowUpRightFromSquare} style={{ fontSize: 11 }} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats & Progress Section */}
                      <div className="order-card-metrics-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginTop: 4, flexWrap: "wrap" }}>
                        {/* Metric items */}
                        <div className="order-card-metrics" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                          {/* Jumlah */}
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Jumlah</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{o.quantity.toLocaleString("id-ID")}</span>
                              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>lapor</span>
                            </div>
                          </div>

                          {/* Sisa */}
                          {o.remains !== null && o.status !== "completed" && (
                            <div>
                              <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Sisa</span>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: st?.color ?? "var(--text-primary)" }}>{o.remains.toLocaleString("id-ID")}</span>
                                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>lapor</span>
                              </div>
                            </div>
                          )}

                          {/* Token */}
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Token</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>{o.charge.toLocaleString("id-ID")}</span>
                              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>token</span>
                            </div>
                          </div>
                        </div>

                        {/* Cek Status Button */}
                        {isActive && (
                          <button
                            onClick={() => refreshOrder(o.id)}
                            disabled={refreshing[o.id]}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid var(--border)",
                              background: "var(--bg-elevated)",
                              color: "var(--text-secondary)",
                              cursor: refreshing[o.id] ? "wait" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                            className="check-status-btn"
                          >
                            <FA icon={faRotate} style={{
                              fontSize: 11,
                              animation: refreshing[o.id] ? "spin 0.8s linear infinite" : "none"
                            }} />
                            {refreshing[o.id] ? "Memperbarui..." : "Cek Status"}
                          </button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {progress !== null && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Progress Laporan</span>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: progress === 100 ? "var(--green)" : st?.color,
                              background: progress === 100 ? "var(--green-dim)" : st?.bg,
                              padding: "1px 6px",
                              borderRadius: 4,
                              border: `1px solid ${progress === 100 ? "var(--green)" : st?.color}20`
                            }}>
                              {progress}%
                            </span>
                          </div>
                          
                          <div style={{
                            height: 5,
                            background: "var(--bg-elevated)",
                            borderRadius: 3,
                            overflow: "hidden",
                            border: "1px solid var(--border)"
                          }}>
                            <div style={{
                              width: `${progress}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${pColor}, ${progress === 100 ? "var(--green)" : st?.color ?? pColor})`,
                              borderRadius: 3,
                              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                              position: "relative"
                            }}>
                              {isActive && (
                                <div style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                  animation: "shimmer-bar 1.5s infinite"
                                }} />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {meta.last_page > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 }}>
              <PBtn icon={faChevronLeft} disabled={page<=1} onClick={() => setPage(p=>p-1)} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)", padding: "5px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                {page} / {meta.last_page}
              </span>
              <PBtn icon={faChevronRight} disabled={page>=meta.last_page} onClick={() => setPage(p=>p+1)} />
            </div>
          )}
        </>
      )}
      <style>{`
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.25) !important;
        }
        .order-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25) !important;
        }
        .order-card:hover .platform-icon-box {
          transform: scale(1.05);
        }
        .target-link-container:hover {
          border-color: var(--border-light) !important;
          background: var(--bg-hover) !important;
        }
        .check-status-btn:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          background: var(--accent-dim) !important;
        }
        .pulse-dot {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes shimmer-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* User Orders Responsiveness */
        .user-orders-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 992px) {
          .user-orders-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .user-orders-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }

        @media (max-width: 768px) {
          .order-card-header {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .order-card-header-left {
            order: 1;
          }
          .order-card-header-middle {
            order: 2;
            justify-content: flex-start !important;
            flex: none !important;
          }
          .order-card-header-right {
            order: 3;
            width: 100% !important;
            margin-top: 4px;
            color: var(--text-muted) !important;
          }
        }

        @media (max-width: 576px) {
          .order-card-title-row {
            flex-direction: column !important;
            gap: 8px !important;
            align-items: flex-start !important;
          }
          .order-card-metrics-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .order-card-metrics {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
          }
          .check-status-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 480px) {
          .order-card-body {
            padding: 16px 14px !important;
            gap: 12px !important;
          }
          .target-link-container {
            padding: 8px 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

function PBtn({ icon, onClick, disabled }: { icon: any; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 32, height: 32, borderRadius: "var(--radius-sm)",
      border: "1px solid var(--border)", background: "var(--bg-elevated)",
      color: disabled ? "var(--border)" : "var(--text-primary)",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.12s",
    }}>
      <FA icon={icon} style={{ fontSize: 11 }} />
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
    <div style={{ padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Icon */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        }}>
          <FA icon={faClipboardList} style={{ fontSize: 30, color: "var(--text-secondary)" }} />
        </div>
        {/* Dekorasi dot */}
        <div style={{
          position: "absolute", bottom: -4, right: -4,
          width: 20, height: 20, borderRadius: "50%",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border)" }} />
        </div>
      </div>

      {/* Teks */}
      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        Belum ada tugas
      </p>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 280, lineHeight: 1.7, textAlign: "center", marginBottom: 20 }}>
        Anda belum membuat tugas apapun. Pilih layanan yang ingin digunakan dan mulai proses pelaporan sekarang.
      </p>

      {/* CTA */}
      <a href="/services" style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 20px", borderRadius: "var(--radius-sm)",
        background: "var(--accent-dim)", border: "1px solid rgba(200,150,10,0.35)",
        color: "var(--accent)", fontSize: 13, fontWeight: 600,
        textDecoration: "none", transition: "all 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(200,150,10,0.18)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(200,150,10,0.55)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-dim)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(200,150,10,0.35)"; }}>
        <FA icon={faLayerGroup} style={{ fontSize: 12 }} />
        Lihat Daftar Layanan
      </a>
    </div>
  );
}
