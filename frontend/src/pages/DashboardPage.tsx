import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import { FA } from "../components/Icon";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  faClipboardList, faCircleCheck, faClock,
  faCoins, faArrowUp, faArrowDown, faRotate,
  faSackDollar, faArrowRight, faCalendar,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram, faTiktok, faYoutube, faXTwitter,
  faFacebook, faTelegram, faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { PLATFORM_COLOR, detectPlatform, REPORT_REASONS } from "../lib/platform";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

// ── Warna chart ──────────────────────────────────────────────────────────────
const CHART_COLORS = {
  accent:  "#C8960A",
  green:   "#22c55e",
  yellow:  "#eab308",
  red:     "#ef4444",
  blue:    "#3b82f6",
  muted:   "#8b8fa8",
  grid:    "#252840",
  tooltip: "#1a1d2e",
};

const PLATFORM_ICON: Record<string, IconProp> = {
  Instagram: faInstagram, TikTok: faTiktok, YouTube: faYoutube,
  Twitter: faXTwitter, Facebook: faFacebook, Telegram: faTelegram,
  LinkedIn: faLinkedin,
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:     { bg: "var(--yellow-dim)", color: "var(--yellow)" },
  processing:  { bg: "var(--blue-dim)",   color: "var(--blue)"   },
  in_progress: { bg: "var(--blue-dim)",   color: "var(--blue)"   },
  completed:   { bg: "var(--green-dim)",  color: "var(--green)"  },
  partial:     { bg: "var(--yellow-dim)", color: "var(--yellow)" },
  cancelled:   { bg: "var(--red-dim)",    color: "var(--red)"    },
  refunded:    { bg: "rgba(100,100,100,.12)", color: "var(--text-muted)" },
};

const PERIODS = [
  { value: "today", label: "Hari ini" },
  { value: "week",  label: "7 hari"   },
  { value: "month", label: "30 hari"  },
  { value: "all",   label: "Semua"    },
];

const formatIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p: any) => p.name && p.value !== undefined);
  if (items.length === 0) return null;
  return (
    <div style={{
      background: "rgba(26, 29, 46, 0.95)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
      backdropFilter: "blur(8px)",
    }}>
      {label && <div style={{ fontSize: 12, color: "#8b8fa8", marginBottom: 6, fontWeight: 500 }}>{label}</div>}
      {items.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color ?? "#e2e4f0", display: "flex", gap: 8, alignItems: "center", marginTop: i > 0 ? 4 : 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color ?? "#e2e4f0", display: "inline-block" }} />
          <span>{p.name}: {formatter ? formatter(p.value) : p.value.toLocaleString("id-ID")}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const navigate = useNavigate();

  return (
    <>
      {isAdmin ? <AdminDashboard user={user} navigate={navigate} /> : <UserDashboard user={user} navigate={navigate} />}
      <style>{`
        /* Animations */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        /* Stat Card Hover Effects */
        .stat-card-dashboard {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .stat-card-dashboard:hover {
          transform: translateY(-4px);
          border-color: var(--card-accent-color) !important;
          box-shadow: 0 12px 24px color-mix(in srgb, var(--card-accent-color) 18%, transparent) !important;
        }
        .stat-card-dashboard:hover .icon-container {
          transform: scale(1.1) rotate(5deg);
        }

        /* User Greeting Hero & Token Cards */
        .user-hero-card {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .user-hero-card:hover {
          border-color: rgba(200, 150, 10, 0.35) !important;
          box-shadow: 0 8px 30px rgba(200, 150, 10, 0.08) !important;
        }

        .token-balance-card {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .token-balance-card:hover {
          transform: translateY(-4px);
          border-color: rgba(200, 150, 10, 0.5) !important;
          box-shadow: 0 12px 30px rgba(200, 150, 10, 0.18) !important;
        }
        .token-balance-card:hover .token-icon-box {
          transform: scale(1.15) rotate(10deg);
        }

        .ajukan-token-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ajukan-token-btn:hover {
          background: var(--accent) !important;
          color: #000 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(200, 150, 10, 0.3) !important;
        }

        /* Feed Rows */
        .active-order-row {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .active-order-row:hover {
          background: var(--bg-hover) !important;
          transform: translateX(4px);
        }

        .token-tx-row {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .token-tx-row:hover {
          background: var(--bg-hover) !important;
          transform: translateX(4px);
        }
        .token-tx-row:hover .tx-icon-box {
          transform: scale(1.1);
        }

        /* Chart Container Hover styling */
        .chart-container-card {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .chart-container-card:hover {
          border-color: rgba(200, 150, 10, 0.15) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        }

        /* Recent Tasks Table */
        .recent-order-tr {
          transition: all 0.2s ease;
        }
        .recent-order-tr:hover {
          background-color: var(--bg-hover) !important;
        }

        .pulse-dot {
          animation: pulse 1.5s infinite ease-in-out;
        }

        /* Token summary cell admin */
        .token-summary-cell:hover {
          background: var(--bg-hover) !important;
          transform: translateY(-2px);
          box-shadow: inset 0 -4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* Heatmap Styles */
        .heatmap-cell:hover {
          transform: scale(1.3);
          filter: brightness(1.25);
          box-shadow: 0 0 8px var(--accent);
          cursor: pointer;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(200, 150, 10, 0.25);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 150, 10, 0.45);
        }

        /* Shared Dashboard Responsiveness */
        .hero-flex-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        @media (max-width: 768px) {
          .hero-flex-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 20px !important;
          }
          .hero-flex-container > div:last-child {
            align-self: flex-start !important;
          }
        }

        /* User Dashboard Grids */
        .user-stats-grid {
          display: grid;
          grid-template-columns: 300px 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 1200px) {
          .user-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .user-stats-grid > div:first-child {
            grid-column: span 2 !important;
          }
        }
        @media (max-width: 576px) {
          .user-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .user-stats-grid > div:first-child {
            grid-column: span 1 !important;
          }
        }

        .user-charts-grid-row-2 {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 992px) {
          .user-charts-grid-row-2 {
            grid-template-columns: 1fr !important;
          }
        }

        .user-charts-grid-row-2-5 {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 992px) {
          .user-charts-grid-row-2-5 {
            grid-template-columns: 1fr !important;
          }
        }

        .reason-chart-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 170px;
          gap: 16px;
        }
        @media (max-width: 480px) {
          .reason-chart-flex {
            flex-direction: column !important;
            height: auto !important;
            align-items: center !important;
          }
          .reason-chart-flex > div:last-child {
            max-height: 120px !important;
            width: 100% !important;
          }
        }

        .user-lists-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 992px) {
          .user-lists-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Admin Dashboard Grids */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 1200px) {
          .admin-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .admin-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .admin-token-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 992px) {
          .admin-token-summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .admin-token-summary-grid > div {
            border-right: 1px solid var(--border) !important;
            border-bottom: 1px solid var(--border) !important;
          }
          .admin-token-summary-grid > div:nth-child(2n) {
            border-right: none !important;
          }
          .admin-token-summary-grid > div:nth-child(3),
          .admin-token-summary-grid > div:nth-child(4) {
            border-bottom: none !important;
          }
        }
        @media (max-width: 480px) {
          .admin-token-summary-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-token-summary-grid > div {
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
          }
          .admin-token-summary-grid > div:last-child {
            border-bottom: none !important;
          }
        }

        .admin-charts-grid-row-3 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 992px) {
          .admin-charts-grid-row-3 {
            grid-template-columns: 1fr !important;
          }
        }

        .admin-charts-grid-row-4 {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 992px) {
          .admin-charts-grid-row-4 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ user, navigate }: { user: any; navigate: any }) {
  const [period, setPeriod]   = useState("all");
  const [data,   setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/admin?period=${period}`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [period]);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <>
      <div style={{ animation: "slideUp 0.4s ease-out" }}>
        {/* Header + period filter */}
        <div className="user-hero-card hero-flex-container" style={{
          background: "linear-gradient(135deg, rgba(200,150,10,0.12) 0%, rgba(22,25,37,0.7) 100%)",
          border: "1px solid rgba(200,150,10,0.22)",
          borderRadius: "var(--radius)",
          padding: "24px 28px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}>
          {/* Glow indicators */}
          <div style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,150,10,0.2) 0%, transparent 70%)",
            filter: "blur(30px)",
            pointerEvents: "none"
          }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "-0.01em" }}>
              {greeting}, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ringkasan dan pusat kendali aktivitas platform</p>
          </div>
          
          {/* Period Filter */}
          <div style={{
            display: "inline-flex",
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 3,
            gap: 2,
            position: "relative",
            zIndex: 2
          }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: period === p.value ? 600 : 400,
                  border: "none",
                  background: period === p.value ? "var(--accent)" : "transparent",
                  color: period === p.value ? "#000" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading || !data ? <SkeletonDashboard /> : <>

          {/* ── Row 1: Stat Cards ── */}
          <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
            <StatCard label="Saldo"        value={formatIDR(data.overview.balance)}        icon={faSackDollar}    color="#C8960A" sub={`≈ ${Math.floor(data.overview.balance / data.overview.tokenIdrValue).toLocaleString("id-ID")} token`} style={{ animationDelay: "0s" }} />
            <StatCard label="Total Tugas"  value={data.overview.totalOrders.toLocaleString()} icon={faClipboardList} color="#3b82f6" sub={`Periode ${PERIODS.find(p=>p.value===period)?.label}`} style={{ animationDelay: "0.03s" }} />
            <StatCard label="Selesai"      value={data.overview.completedOrders.toLocaleString()} icon={faCircleCheck} color="#22c55e" sub="Tugas selesai" style={{ animationDelay: "0.06s" }} />
            <StatCard label="Aktif"        value={data.overview.activeOrders.toLocaleString()} icon={faClock}       color="#eab308" sub="Pending / proses" style={{ animationDelay: "0.09s" }} />
            <StatCard label="Pengeluaran"  value={formatIDR(data.overview.totalRevenue)}    icon={faArrowDown}     color="#ef4444" sub="Total charge" style={{ animationDelay: "0.12s" }} />
          </div>

          {/* ── Row 2: Token Summary ── */}
          <div className="chart-container-card" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 20, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", animationDelay: "0.15s" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-elevated)" }}>
              <FA icon={faCoins} style={{ fontSize: 13, color: "var(--accent)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Ringkasan Token</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", padding: "2px 8px", borderRadius: 4, background: "var(--accent-dim)", border: "1px solid rgba(200,150,10,0.2)", marginLeft: 4 }}>
                SEMUA WAKTU
              </span>
            </div>
            <div className="admin-token-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                { label: "Token Beredar",  value: data.tokenSummary.totalTokenInCirculation, color: "#C8960A", sub: `${data.tokenSummary.totalUserCount} user terdaftar` },
                { label: "Token Dipakai",  value: data.tokenSummary.totalTokenUsed,          color: "#eab308", sub: `${data.tokenSummary.activeUserCount} user aktif` },
                { label: "Token Tersisa",  value: data.tokenSummary.totalTokenRemaining,      color: "#22c55e", sub: `belum terpakai` },
                { label: "Total Diinjek",  value: data.tokenSummary.INJECT,                  color: "#3b82f6", sub: `akumulasi inject` },
              ].map((s, i) => (
                <div key={s.label}
                  className="token-summary-cell"
                  style={{
                    padding: "18px 20px",
                    borderRight: i < 3 ? "1px solid var(--border)" : "none",
                    background: "linear-gradient(180deg, var(--bg-surface) 0%, rgba(26,29,46,0.15) 100%)",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden"
                  } as React.CSSProperties}
                >
                  {/* Left color bar */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: s.color, opacity: 0.7 }} />
                  
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: "-0.5px", marginBottom: 4 }}>{s.value.toLocaleString("id-ID")}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Row 3: Trend + Platform ── */}
          <div className="admin-charts-grid-row-3" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* Tren Tugas */}
            <ChartCard title="Tren Tugas & Pengeluaran" subtitle={period === "today" ? "Hari ini" : period === "week" ? "7 hari terakhir" : period === "month" ? "30 hari terakhir" : "14 hari terakhir"} style={{ animationDelay: "0.18s" }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.trendData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradTugas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="orders"  name="Tugas"      stroke={CHART_COLORS.accent} fill="url(#gradTugas)"  strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="revenue" name="Pengeluaran" stroke={CHART_COLORS.green}  fill="url(#gradRevenue)" strokeWidth={2} dot={false} yAxisId={0} hide />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Platform Distribution */}
            <ChartCard title="Tugas per Platform" subtitle="Distribusi layanan" style={{ animationDelay: "0.22s" }}>
              {data.platformData.length === 0 ? (
                <EmptyChart text="Belum ada data" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.platformData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="platform" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Tugas" radius={[0, 4, 4, 0]}>
                      {data.platformData.map((entry: any) => (
                        <Cell key={entry.platform} fill={PLATFORM_COLOR[entry.platform] ?? CHART_COLORS.accent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* ── Row 4: Status Pie + Recent Orders ── */}
          <div className="admin-charts-grid-row-4" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 16 }}>

            {/* Status Breakdown */}
            <ChartCard title="Status Tugas" subtitle="Distribusi status" style={{ animationDelay: "0.26s" }}>
              {data.statusData.length === 0 ? <EmptyChart text="Belum ada data" /> : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={data.statusData} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                        {data.statusData.map((entry: any) => (
                          <Cell key={entry.status} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 4px 0 4px", borderTop: "1px dashed var(--border)" }}>
                    {data.statusData.map((s: any) => (
                      <div key={s.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", boxShadow: `0 0 6px ${s.color}60` }} />
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.status}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ChartCard>

            {/* Tugas Terbaru */}
            <ChartCard title="Tugas Terbaru" subtitle="8 tugas terakhir"
              action={{ label: "Lihat semua", onClick: () => navigate("/orders") }}
              style={{ animationDelay: "0.3s" }}
            >
              {data.recentOrders.length === 0 ? <EmptyChart text="Belum ada tugas" /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["ID", "Platform", "Target Link", "Jumlah", "Biaya", "Status", "Tanggal"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((o: any, i: number) => {
                        const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.refunded;
                        const platform = detectPlatform(o.link ?? "");
                        const pColor = platform ? PLATFORM_COLOR[platform] : "var(--text-secondary)";
                        const pIcon = platform ? PLATFORM_ICON[platform] : null;

                        return (
                          <tr key={o.id}
                            className="recent-order-tr"
                            style={{ 
                              borderBottom: i < data.recentOrders.length - 1 ? "1px solid var(--border)" : "none",
                              animation: "slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both",
                              animationDelay: `${0.35 + i * 0.03}s`
                            }}
                          >
                            {/* ID */}
                            <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>#{o.id}</td>
                            
                            {/* Platform */}
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {pIcon ? (
                                  <FA icon={pIcon} style={{ fontSize: 13, color: pColor }} />
                                ) : (
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: pColor, display: "inline-block" }} />
                                )}
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                                  {platform ? platform : `#${o.serviceId}`}
                                </span>
                              </div>
                            </td>

                            {/* Link */}
                            <td style={{ padding: "12px 16px", maxWidth: 180 }}>
                              {o.link ? (
                                <a href={o.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                                  {o.link.replace(/^https?:\/\/(www\.)?/, "")}
                                </a>
                              ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
                            </td>

                            {/* Jumlah */}
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{o.quantity.toLocaleString("id-ID")}</td>
                            
                            {/* Biaya */}
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap" }}>{formatIDR(o.charge)}</td>
                            
                            {/* Status */}
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: s.bg,
                                color: s.color,
                                border: `1px solid ${s.color}20`,
                                display: "inline-block"
                              }}>{o.status.toUpperCase()}</span>
                            </td>

                            {/* Tanggal */}
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <FA icon={faCalendar} style={{ fontSize: 11 }} />
                                <span>{formatDate(o.orderDate)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>

          </div>

        </>}
      </div>
    </>
  );

}

// ════════════════════════════════════════════════════════════════════════════
// USER DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function UserDashboard({ user, navigate }: { user: any; navigate: any }) {
  const [period, setPeriod]   = useState("all");
  const [data,   setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/user?period=${period}`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [period]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Selamat malam" : hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";
  const dateStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const TOKEN_TX_LABEL: Record<string, string> = {
    INJECT: "Token Masuk", REFUND: "Pengembalian", ORDER: "Digunakan", DEDUCT: "Pemotongan",
  };
  const TOKEN_TX_COLOR: Record<string, string> = {
    INJECT: "#22c55e", REFUND: "#3b82f6", ORDER: "#eab308", DEDUCT: "#ef4444",
  };
  const STATUS_LABEL: Record<string, string> = {
    pending: "Menunggu", processing: "Diproses", in_progress: "Berjalan",
    completed: "Selesai", partial: "Sebagian", cancelled: "Dibatalkan",
  };

  const renderHeatmap = (heatmapData: Array<{ date: string; count: number }> = []) => {
    const today = new Date();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 371);
    const dayOfWeek = startDay.getDay();
    startDay.setDate(startDay.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 371; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const match = heatmapData.find(h => h.date === dateStr);
      days.push({
        date: dateStr,
        count: match ? match.count : 0,
        dayName: d.toLocaleDateString("id-ID", { weekday: "short" }),
      });
    }

    const weeks: Array<Array<{ date: string; count: number; dayName: string }>> = [];
    let currentWeek: Array<{ date: string; count: number; dayName: string }> = [];

    days.forEach((day, index) => {
      currentWeek.push(day as { date: string; count: number; dayName: string });
      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    const monthLabels: Array<{ label: string; index: number }> = [];
    let lastMonthName = "";
    let lastMonthIdx = -10;
    weeks.forEach((week, wIdx) => {
      const validDay = week.find(d => d.date);
      if (validDay) {
        const d = new Date(validDay.date);
        const mName = d.toLocaleDateString("id-ID", { month: "short" });
        if (mName !== lastMonthName) {
          if (wIdx - lastMonthIdx >= 3) {
            monthLabels.push({ label: mName, index: wIdx });
            lastMonthName = mName;
            lastMonthIdx = wIdx;
          }
        }
      }
    });

    const totalReportsInHeatmap = heatmapData.reduce((sum, h) => sum + h.count, 0);
    const activeDaysCount = heatmapData.filter(h => h.count > 0).length;
    const maxReportsInADay = heatmapData.length > 0 ? Math.max(...heatmapData.map(h => h.count)) : 0;
    const avgReportsPerActiveDay = activeDaysCount > 0 ? (totalReportsInHeatmap / activeDaysCount).toFixed(1) : "0";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, justifyContent: "space-between", height: 95, paddingTop: 22, paddingBottom: 1, flexShrink: 0 }}>
            {["Min", "Sel", "Kam", "Sab"].map(d => (
              <span key={d} style={{ fontSize: 9, fontWeight: 600, color: "var(--text-muted)", height: 11, display: "flex", alignItems: "center" }}>{d}</span>
            ))}
          </div>

          <div style={{ overflowX: "auto", flex: 1, paddingBottom: 4 }} className="custom-scrollbar">
            <div style={{ display: "flex", gap: 3, marginBottom: 6, height: 16 }}>
              {weeks.map((_, wIdx) => {
                const label = monthLabels.find(l => l.index === wIdx);
                return (
                  <div key={wIdx} style={{ width: 11, flexShrink: 0, fontSize: 9, fontWeight: 600, color: "var(--text-muted)", position: "relative" }}>
                    {label && (
                      <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>{label.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 3 }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
                  {week.map((day, dIdx) => {
                    if (day.count === -1) return <div key={dIdx} style={{ width: 11, height: 11, borderRadius: 2.5, background: "transparent", flexShrink: 0 }} />;
                    let bg = "rgba(255, 255, 255, 0.04)";
                    let border = "1px solid rgba(255, 255, 255, 0.05)";
                    let glow = "none";
                    if (day.count > 0) {
                      if (day.count <= 2) { bg = "rgba(200, 150, 10, 0.22)"; border = "1px solid rgba(200, 150, 10, 0.35)"; }
                      else if (day.count <= 5) { bg = "rgba(200, 150, 10, 0.55)"; border = "1px solid rgba(200, 150, 10, 0.7)"; }
                      else if (day.count <= 9) { bg = "rgba(200, 150, 10, 0.8)"; border = "1px solid rgba(200, 150, 10, 0.9)"; }
                      else { bg = "var(--accent)"; border = "1px solid var(--accent)"; glow = "0 0 8px rgba(200, 150, 10, 0.5)"; }
                    }
                    const formattedDate = day.date ? new Date(day.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
                    return (
                      <div key={dIdx} title={day.date ? `${formattedDate}: ${day.count} tugas` : ""} style={{ width: 11, height: 11, borderRadius: 2.5, background: bg, border: border, boxShadow: glow, transition: "all 0.15s ease", flexShrink: 0 }} className="heatmap-cell" />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div className="heatmap-stats-flex" style={{ display: "flex", gap: 24 }}>
            <div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Total Laporan</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>{totalReportsInHeatmap.toLocaleString("id-ID")} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>kali</span></span>
            </div>
            <div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Hari Aktif</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{activeDaysCount.toLocaleString("id-ID")} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>hari</span></span>
            </div>
            <div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Rata-Rata</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{avgReportsPerActiveDay} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>/hari aktif</span></span>
            </div>
            {maxReportsInADay > 0 && (
              <div>
                <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Rekor Sehari</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{maxReportsInADay.toLocaleString("id-ID")} <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" }}>lapor</span></span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Kurang</span>
            <div style={{ width: 11, height: 11, borderRadius: 2.5, background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.05)" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2.5, background: "rgba(200, 150, 10, 0.22)", border: "1px solid rgba(200, 150, 10, 0.35)" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2.5, background: "rgba(200, 150, 10, 0.55)", border: "1px solid rgba(200, 150, 10, 0.7)" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2.5, background: "rgba(200, 150, 10, 0.8)", border: "1px solid rgba(200, 150, 10, 0.9)" }} />
            <div style={{ width: 11, height: 11, borderRadius: 2.5, background: "var(--accent)", border: "1px solid var(--accent)", boxShadow: "0 0 6px rgba(200, 150, 10, 0.4)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Lebih banyak</span>
          </div>
        </div>
      </div>
    );
  };

  const renderReasonChart = (reasonData: Array<{ reason: string; count: number }> = []) => {
    if (reasonData.length === 0) {
      return (
        <div style={{ height: 170, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <FA icon={faCircleCheck} style={{ fontSize: 24, color: "var(--text-secondary)", opacity: 0.15 }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Belum ada data alasan</p>
        </div>
      );
    }

    const chartData = reasonData.map(r => {
      const info = REPORT_REASONS[r.reason] || { label: "Lainnya", color: "#8b8fa8" };
      return {
        name: info.label,
        value: r.count,
        color: info.color,
      };
    });

    const totalReports = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="reason-chart-flex" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 170, gap: 16 }}>
        {/* Chart Column */}
        <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient id={`colorGrad-${index}`} x1="0" y1="0" x2="0" y2="1" key={index}>
                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              {/* Background track */}
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={64}
                dataKey="value"
                stroke="none"
                fill="rgba(255, 255, 255, 0.04)"
                isAnimationActive={false}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={64}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="var(--bg-surface)"
                strokeWidth={2}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#colorGrad-${index})`} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center text */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 10
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
              {totalReports}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginTop: 3, letterSpacing: "0.05em" }}>
              Laporan
            </div>
          </div>
        </div>

        {/* Legend Column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, maxHeight: 150, overflowY: "auto", paddingRight: 4 }} className="custom-scrollbar">
          {chartData.map((item, index) => {
            const percent = totalReports > 0 ? Math.round((item.value / totalReports) * 100) : 0;
            return (
              <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}50` }} />
                  <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{item.value}</span>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>

      {/* ── Hero Header ── */}
      <div className="user-hero-card hero-flex-container" style={{
        background: "linear-gradient(135deg, rgba(200,150,10,0.15) 0%, rgba(22,25,37,0.7) 100%)",
        border: "1px solid rgba(200,150,10,0.22)",
        borderRadius: "var(--radius)",
        padding: "24px 28px",
        marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}>
        {/* Glow Indicators */}
        <div style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,150,10,0.25) 0%, transparent 70%)",
          filter: "blur(30px)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          left: "25%",
          top: -60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,150,10,0.12) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none"
        }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 12, color: "var(--accent)", marginBottom: 6, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{dateStr}</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.3px" }}>
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 500, lineHeight: 1.5 }}>
            Pantau semua aktivitas laporan sosial media Anda dari sini.
          </p>
        </div>

        {/* Period filter */}
        <div style={{
          display: "inline-flex",
          background: "rgba(0, 0, 0, 0.25)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 3,
          gap: 2,
          position: "relative",
          zIndex: 2,
          alignSelf: "center"
        }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: period === p.value ? 600 : 400,
                border: "none",
                background: period === p.value ? "var(--accent)" : "transparent",
                color: period === p.value ? "#000" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? <SkeletonDashboard rows={4} /> : <>

        {/* ── Row 1: Token + Stats ── */}
        <div className="user-stats-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>

          {/* Token balance card */}
          <div className="token-balance-card" style={{
            background: "linear-gradient(135deg, rgba(200, 150, 10, 0.12) 0%, rgba(20, 22, 33, 0.95) 100%)",
            border: "1px solid rgba(200, 150, 10, 0.25)",
            borderRadius: "var(--radius)",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(200, 150, 10, 0.05)",
            animationDelay: "0s",
          }}>
            {/* Top gold bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C8960A, #E0A80C)" }} />
            
            {/* Glow effect */}
            <div style={{
              position: "absolute",
              bottom: -40,
              right: -40,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(200, 150, 10, 0.12)",
              filter: "blur(25px)",
              pointerEvents: "none"
            }} />

            {/* Header: label + tombol kanan */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div className="token-icon-box" style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(200, 150, 10, 0.18)",
                  border: "1px solid rgba(200, 150, 10, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                }}>
                  <FA icon={faCoins} style={{ fontSize: 12, color: "var(--accent)" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Saldo Token</span>
              </div>
              <button
                onClick={() => navigate("/token-request")}
                className="ajukan-token-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 8, border: "1px solid rgba(200, 150, 10, 0.35)",
                  background: "rgba(200, 150, 10, 0.1)", color: "var(--accent)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                <FA icon={faArrowUp} style={{ fontSize: 11 }} /> Ajukan Token
              </button>
            </div>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: "var(--accent)", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 6 }}>
                {data.tokenBalance.toLocaleString("id-ID")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                ≈ Estimasi <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{data.estimatedTugasLeft}</strong> tugas report
              </div>
            </div>
          </div>

          <StatCard label="Total Tugas"  value={data.orderStats.total.toLocaleString()}     icon={faClipboardList} color="#3b82f6" sub={`Periode ${PERIODS.find(p=>p.value===period)?.label}`} style={{ animationDelay: "0.04s" }} />
          <StatCard label="Selesai"      value={data.orderStats.completed.toLocaleString()} icon={faCircleCheck}   color="#22c55e" sub="Tugas berhasil" style={{ animationDelay: "0.08s" }} />
          <StatCard label="Aktif"        value={data.orderStats.active.toLocaleString()}    icon={faRotate}        color="#eab308" sub="Sedang berjalan" style={{ animationDelay: "0.12s" }} />
        </div>

        {/* ── Row 2: Trend + Platform ── */}
        <div className="user-charts-grid-row-2" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>
          <ChartCard title="Penggunaan Token" subtitle={`Tren ${PERIODS.find(p=>p.value===period)?.label?.toLowerCase()}`} style={{ animationDelay: "0.16s" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.trendData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradToken" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_COLORS.accent} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#8b8fa8", fontSize: 12 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: "#8b8fa8", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="token" name="Token dipakai" stroke={CHART_COLORS.accent} fill="url(#gradToken)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Per Platform" subtitle="Distribusi tugas Anda" style={{ animationDelay: "0.2s" }}>
            {data.platformData.length === 0 ? <EmptyChart text="Belum ada tugas" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.platformData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#8b8fa8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="platform" tick={{ fill: "#8b8fa8", fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Tugas" radius={[0, 4, 4, 0]}>
                    {data.platformData.map((entry: any) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLOR[entry.platform] ?? CHART_COLORS.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Row 2.5: Alasan + Kalender Heatmap ── */}
        <div className="user-charts-grid-row-2-5" style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 16, marginBottom: 16 }}>
          <ChartCard title="Alasan Pelaporan" subtitle="Alasan laporan yang Anda kirimkan" style={{ animationDelay: "0.22s" }}>
            {renderReasonChart(data.reasonData || [])}
          </ChartCard>

          <ChartCard title="Kalender Aktivitas" subtitle="Konsistensi pelaporan dalam 371 hari terakhir" style={{ animationDelay: "0.24s" }}>
            {renderHeatmap(data.heatmapData || [])}
          </ChartCard>
        </div>

        {/* ── Row 3: Tugas Aktif + Riwayat Token ── */}
        <div className="user-lists-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Tugas Aktif */}
          <ChartCard title="Tugas Aktif" subtitle="Sedang diproses saat ini"
            action={{ label: "Lihat semua", onClick: () => navigate("/orders") }}
            style={{ animationDelay: "0.24s" }}
          >
            {data.activeOrders.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <FA icon={faCircleCheck} style={{ fontSize: 28, color: "#22c55e", opacity: 0.5, marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Semua selesai!</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tidak ada tugas yang sedang aktif.</p>
              </div>
            ) : data.activeOrders.map((o: any, i: number) => {
              const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.refunded;
              const platform = detectPlatform(o.link ?? "");
              const pColor = platform ? PLATFORM_COLOR[platform] : "var(--text-secondary)";
              const pIcon = platform ? PLATFORM_ICON[platform] : null;

              return (
                <div key={o.id}
                  className="active-order-row"
                  style={{
                    padding: "12px 18px",
                    borderBottom: i < data.activeOrders.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    animation: "slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both",
                    animationDelay: `${0.25 + i * 0.04}s`
                  }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)", fontWeight: 700 }}>#{o.id}</span>
                      
                      {/* Platform indicator badge */}
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        color: pColor,
                        background: `color-mix(in srgb, ${pColor} 12%, transparent)`,
                        padding: "2px 6px",
                        borderRadius: 5,
                        border: `1px solid color-mix(in srgb, ${pColor} 20%, transparent)`,
                      }}>
                        {pIcon && <FA icon={pIcon} style={{ fontSize: 11 }} />}
                        {platform || "Lainnya"}
                      </span>

                      {/* Status badge */}
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 5,
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.color}20`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        {["pending", "processing", "in_progress"].includes(o.status) && (
                          <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                        )}
                        {(STATUS_LABEL[o.status] ?? o.status).toUpperCase()}
                      </span>
                    </div>
                    {o.link && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <a href={o.link} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
                        >
                          {o.link.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                    {o.quantity.toLocaleString("id-ID")}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginLeft: 3 }}>report</span>
                  </div>
                </div>
              );
            })}
          </ChartCard>

          {/* Riwayat Token */}
          <ChartCard title="Riwayat Token" subtitle="5 transaksi terbaru" style={{ animationDelay: "0.28s" }}>
            {data.recentTokenTx.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <FA icon={faCoins} style={{ fontSize: 28, color: "var(--text-secondary)", opacity: 0.3, marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Belum ada riwayat transaksi token.</p>
              </div>
            ) : data.recentTokenTx.map((tx: any, i: number) => {
              const isIn = ["INJECT","REFUND"].includes(tx.type);
              const col  = TOKEN_TX_COLOR[tx.type] ?? "#8b8fa8";
              return (
                <div key={tx.id}
                  className="token-tx-row"
                  style={{
                    padding: "12px 18px",
                    borderBottom: i < data.recentTokenTx.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    animation: "slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both",
                    animationDelay: `${0.25 + i * 0.04}s`
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="tx-icon-box" style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: `color-mix(in srgb, ${col} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${col} 20%, transparent)`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      transition: "transform 0.2s ease",
                    }}>
                      <FA icon={isIn ? faArrowUp : faArrowDown} style={{ fontSize: 11, color: col }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {TOKEN_TX_LABEL[tx.type] ?? tx.type}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        {tx.note ?? (tx.orderId ? `Tugas #${tx.orderId}` : "—")}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: col }}>
                      {isIn ? "+" : "−"}{tx.amount.toLocaleString("id-ID")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      sisa {tx.balanceAfter.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              );
            })}
          </ChartCard>
        </div>

      </>}
    </div>
  );
}

// ── Shared Components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub, style }: { label: string; value: string; icon: any; color: string; sub: string; style?: React.CSSProperties }) {
  return (
    <div
      className="stat-card-dashboard"
      style={{
        background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(26,29,46,0.4) 100%)",
        border: `1px solid ${color}22`,
        borderRadius: "var(--radius)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        "--card-accent-color": color,
        ...style,
      } as React.CSSProperties}
    >
      <div style={{
        position: "absolute",
        top: "-40%",
        right: "-20%",
        width: 100,
        height: 100,
        background: color,
        filter: "blur(40px)",
        opacity: 0.08,
        borderRadius: "50%",
        pointerEvents: "none"
      }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}90, ${color})` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: `${color}14`,
          border: `1.5px solid ${color}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          transition: "transform 0.2s"
        }}
        className="icon-container"
        >
          <FA icon={icon} style={{ fontSize: 15 }} />
        </div>
      </div>
      
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, action, style }: {
  title: string; subtitle?: string; children: React.ReactNode;
  action?: { label: string; onClick: () => void };
  style?: React.CSSProperties;
}) {
  return (
    <div className="chart-container-card" style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      ...style,
    }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-elevated)" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action && (
          <button onClick={action.onClick} style={{
            fontSize: 12, color: "var(--accent)", background: "var(--accent-dim)",
            border: "1px solid rgba(200,150,10,0.25)", padding: "4px 10px",
            borderRadius: "var(--radius-sm)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, fontWeight: 600,
          }}>
            {action.label} <FA icon={faArrowRight} style={{ fontSize: 11 }} />
          </button>
        )}
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{text}</p>
    </div>
  );
}

function SkeletonDashboard({ rows = 4 }: { rows?: number }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ height: 100, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", opacity: 1 - i * 0.15 }} />
        ))}
      </div>
      <div style={{ height: 280, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }} />
    </div>
  );
}
