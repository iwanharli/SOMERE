import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { swWarning } from "../lib/swal";
import { FA } from "./Icon";
import {
  faGauge, faLayerGroup, faClipboardList, faCreditCard,
  faRightFromBracket, faSackDollar, faRotate,
  faDatabase, faCircle, faBolt, faBook, faUsers,
  faScaleBalanced, faCoins, faChevronDown, faGear, faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

type NavChild = { to: string; label: string; icon: any };
type NavItem =
  | { type: "link";    to: string; label: string; icon: any; adminOnly: boolean }
  | { type: "group";   label: string; icon: any; adminOnly: boolean; children: NavChild[] }
  | { type: "divider"; label: string; adminOnly: boolean };

const nav: NavItem[] = [
  { type: "link",  to: "/",      label: "Beranda",   icon: faGauge,      adminOnly: false },
  { type: "group", label: "Tugas", icon: faClipboardList, adminOnly: false,
    children: [
      { to: "/orders/create", label: "Buat Tugas",   icon: faBolt          },
      { to: "/orders",        label: "Riwayat Tugas", icon: faClipboardList },
    ],
  },
  { type: "divider", label: "Data",      adminOnly: false },
  { type: "link",  to: "/services",     label: "Layanan",          icon: faLayerGroup,      adminOnly: false },
  { type: "divider", label: "Manajemen", adminOnly: true },
  { type: "link",  to: "/users",          label: "Pengguna",         icon: faUsers,           adminOnly: true  },
  { type: "link",  to: "/balance",        label: "Saldo",            icon: faScaleBalanced,   adminOnly: true  },
  { type: "link",  to: "/token-settings", label: "Pengaturan Token", icon: faCoins,           adminOnly: true  },
  { type: "link",  to: "/logs",           label: "Log Aktivitas",    icon: faClockRotateLeft, adminOnly: true  },
  { type: "divider", label: "Lainnya",   adminOnly: false },
  { type: "link",  to: "/docs",         label: "Dokumentasi",      icon: faBook,            adminOnly: false },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Beranda",
  "/orders/create":   "Buat Tugas",
  "/services": "Layanan",
  "/orders":         "Tugas",
  "/users":          "Manajemen Pengguna",
  "/balance":        "Manajemen Saldo",
  "/token-settings": "Pengaturan Token",
  "/logs":           "Log Aktivitas",
  "/docs":           "Dokumentasi",
  "/settings":       "Pengaturan Akun",
};

interface SyncStatus {
  services:     { count: number; syncedAt: string | null };
  orders:       { count: number; syncedAt: string | null };
  transactions: { count: number; syncedAt: string | null };
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Belum pernah";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "Baru saja";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openGroups,   setOpenGroups]   = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [balance, setBalance]           = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenIdrValue, setTokenIdrValue] = useState<number>(10000);
  const [syncStatus, setSyncStatus]     = useState<SyncStatus | null>(null);
  const [syncing, setSyncing]           = useState<string | null>(null);
  const lowBalanceWarned                = useRef(false);

  // Threshold: warning jika saldo Panelin < Rp 100.000
  const LOW_BALANCE_THRESHOLD = 100_000;

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.get("/token/config")
        .then(r => setTokenIdrValue(r.data?.data?.tokenIdrValue ?? 10000))
        .catch(() => {});
      api.get("/panelin/balance")
        .then((r) => {
          const bal = r.data?.data?.balance ?? null;
          setBalance(bal);
          if (bal !== null && bal < LOW_BALANCE_THRESHOLD && !lowBalanceWarned.current) {
            lowBalanceWarned.current = true;
            swWarning(
              "Saldo Hampir Habis",
              `Saldo saat ini ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(bal)}. Segera lakukan top up agar order tidak terganggu.`
            );
          }
        })
        .catch((err) => { if (err?.response?.status !== 429) console.error(err); });
      loadSyncStatus();
    } else {
      api.get("/token/balance")
        .then((r) => setTokenBalance(r.data?.data?.tokenBalance ?? 0))
        .catch(() => {});
    }
  }, [user?.role]);

  function loadSyncStatus() {
    api.get("/panelin/sync/status")
      .then((r) => setSyncStatus(r.data?.data ?? null))
      .catch(() => {});
  }

  async function quickSync(endpoint: string, key: string) {
    setSyncing(key);
    try { await api.post(endpoint); loadSyncStatus(); }
    finally { setSyncing(null); }
  }

  function handleLogout() {
    const rt = useAuthStore.getState().refreshToken;
    if (rt) api.post("/auth/logout", { refreshToken: rt }).catch(() => {});
    logout();
    navigate("/login");
  }

  // Tutup dropdown saat klik luar
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  }, []);
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const formatIDR = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh",
        zIndex: 100, overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{
          height: "var(--topbar-height)",
          display: "flex", alignItems: "center",
          padding: "0 18px", gap: 10,
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <img
            src="/logo-somere.png"
            alt="SOMERE"
            style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text-primary)", lineHeight: 1 }}>SOMERE</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Social Media Report</div>
          </div>
        </div>

        {/* Balance card */}
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "12px 14px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {user?.role === "ADMIN" ? "Saldo" : "Saldo Token"}
              </span>
              <FA icon={user?.role === "ADMIN" ? faSackDollar : faCoins} style={{ fontSize: 11, color: "var(--accent)" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 6, letterSpacing: "-0.3px" }}>
              {user?.role === "ADMIN"
                ? (balance === null ? <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span> : formatIDR(balance))
                : (tokenBalance === null ? <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span> : <span>{tokenBalance.toLocaleString("id-ID")} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>token</span></span>)
              }
            </div>
            {user?.role === "ADMIN" && balance !== null && tokenIdrValue > 0 && (
              <div style={{ marginTop: 5, fontSize: 12, color: "var(--text-muted)" }}>
                ≈ <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {Math.floor(balance / tokenIdrValue).toLocaleString("id-ID")}
                </span> token
              </div>
            )}
          </div>
        </div>

        {/* Nav label */}
        <div style={{ padding: "16px 14px 6px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Navigasi
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: "0 8px" }}>
          {nav.filter((item) => !item.adminOnly || user?.role === "ADMIN").map((item, idx) => {
            if (item.type === "divider") {
              return (
                <div key={`div-${idx}`} style={{ margin: "8px 4px 4px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
              );
            }

            if (item.type === "group") {
              const isGroupActive = item.children.some(c => pathname.startsWith(c.to));
              // Auto-expand jika salah satu child sedang aktif
              const isOpen = openGroups[item.label] !== undefined
                ? openGroups[item.label]
                : isGroupActive;

              const toggle = () => setOpenGroups(prev => ({
                ...prev,
                [item.label]: !isOpen,
              }));

              return (
                <div key={`group-${idx}`} style={{ marginBottom: 1 }}>
                  {/* Parent — clickable untuk toggle */}
                  <button
                    onClick={toggle}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px", borderRadius: "var(--radius-sm)",
                      fontSize: 14, fontWeight: isGroupActive ? 500 : 400,
                      color: isGroupActive ? "var(--text-primary)" : "var(--text-secondary)",
                      background: isGroupActive ? "var(--bg-elevated)" : "transparent",
                      border: "none", cursor: "pointer", position: "relative",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { if (!isGroupActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={e => { if (!isGroupActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {isGroupActive && (
                      <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: "var(--accent)", borderRadius: "0 3px 3px 0" }} />
                    )}
                    <span style={{ width: 16, display: "inline-flex", justifyContent: "center", color: isGroupActive ? "var(--accent)" : "var(--text-muted)", marginLeft: isGroupActive ? 4 : 0 }}>
                      <FA icon={item.icon} style={{ fontSize: 13 }} />
                    </span>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    <FA icon={faChevronDown} style={{ fontSize: 10, color: "var(--text-muted)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>

                  {/* Children — animasi slide */}
                  <div style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? `${item.children.length * 36}px` : "0px",
                    transition: "max-height 0.2s ease",
                  }}>
                    <div style={{ marginLeft: 16, borderLeft: "1px solid var(--border)", paddingLeft: 8, paddingTop: 2, paddingBottom: 2 }}>
                      {item.children.map(child => (
                        <NavLink key={child.to} to={child.to} end
                          style={({ isActive }) => ({
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px", borderRadius: "var(--radius-sm)",
                            marginBottom: 1, fontSize: 13,
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? "var(--accent)" : "var(--text-muted)",
                            background: isActive ? "var(--accent-dim)" : "transparent",
                            transition: "all 0.12s", textDecoration: "none",
                          })}
                        >
                          {({ isActive }) => (
                            <>
                              <FA icon={child.icon} style={{ fontSize: 11, color: isActive ? "var(--accent)" : "var(--text-muted)" }} />
                              {child.label}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to} to={item.to} end={item.to === "/"}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: "var(--radius-sm)",
                  marginBottom: 1, fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  transition: "all 0.12s", position: "relative", textDecoration: "none",
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: "var(--accent)", borderRadius: "0 3px 3px 0" }} />
                    )}
                    <span style={{ width: 16, display: "inline-flex", justifyContent: "center", color: isActive ? "var(--accent)" : "var(--text-muted)", marginLeft: isActive ? 4 : 0, transition: "all 0.12s" }}>
                      <FA icon={item.icon} style={{ fontSize: 13 }} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Data Cache */}
        <div style={{ padding: "16px 14px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Data Cache
            </span>
            <FA icon={faDatabase} style={{ fontSize: 11, color: "var(--text-muted)" }} />
          </div>
        </div>
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {syncStatus ? (
            [
              { key: "services",     label: "Layanan",     endpoint: "/panelin/sync/services",     count: syncStatus.services.count,     at: syncStatus.services.syncedAt     },
              { key: "orders",       label: "Tugas",       endpoint: "/panelin/sync/orders/active", count: syncStatus.orders.count,       at: syncStatus.orders.syncedAt       },
              { key: "transactions", label: "Transaksi", endpoint: "/panelin/sync/transactions",  count: syncStatus.transactions.count, at: syncStatus.transactions.syncedAt },
            ].map((item) => (
              <div key={item.key} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 8px", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <FA icon={faCircle} style={{ fontSize: 6, color: item.at ? "var(--green)" : "var(--text-muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.count.toLocaleString("id-ID")}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", paddingLeft: 11 }}>
                    {timeAgo(item.at)}
                  </div>
                </div>
                <button
                  onClick={() => quickSync(item.endpoint, item.key)}
                  disabled={syncing === item.key}
                  title={`Sync ${item.label}`}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: syncing === item.key ? "var(--accent-dim)" : "transparent",
                    color: syncing === item.key ? "var(--accent)" : "var(--text-muted)",
                    cursor: syncing === item.key ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { if (syncing !== item.key) { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}}
                  onMouseLeave={e => { if (syncing !== item.key) { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}}
                >
                  <FA icon={faRotate} style={{ fontSize: 11, animation: syncing === item.key ? "spin 0.7s linear infinite" : "none" }} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ padding: "8px 8px", fontSize: 12, color: "var(--text-muted)" }}>Memuat status...</div>
          )}
        </div>

        <div style={{ flex: 1 }} />
      </aside>

      {/* ── Main ── */}
      <div style={{ marginLeft: "var(--sidebar-width)", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header style={{
          height: "var(--topbar-height)",
          background: "var(--bg-surface)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", position: "sticky", top: 0, zIndex: 50,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            {PAGE_TITLES[pathname] ?? "SOMERE"}
          </span>

          {/* User dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 10px 5px 6px",
                background: dropdownOpen ? "var(--bg-elevated)" : "transparent",
                border: `1px solid ${dropdownOpen ? "var(--border)" : "transparent"}`,
                borderRadius: "var(--radius-sm)", cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!dropdownOpen) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border)"; }}}
              onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--accent-dim)", border: "1.5px solid rgba(200,150,10,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0,
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user?.email}</div>
              </div>
              <FA icon={faChevronDown} style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 2, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                width: 220,
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                overflow: "hidden",
                animation: "slideUp 0.12s ease",
              }}>
                {/* User info */}
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-dim)", border: "1.5px solid rgba(200,150,10,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: user?.role === "ADMIN" ? "var(--accent-dim)" : "var(--bg-elevated)", color: user?.role === "ADMIN" ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${user?.role === "ADMIN" ? "rgba(200,150,10,0.3)" : "var(--border)"}`, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                          {user?.role}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Settings + Logout */}
                <div style={{ padding: "6px" }}>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                    style={{
                      width: "100%", padding: "8px 10px",
                      borderRadius: "var(--radius-sm)", border: "none",
                      background: "transparent", color: "var(--text-muted)",
                      fontSize: 13, textAlign: "left", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8, transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <FA icon={faGear} style={{ fontSize: 12 }} /> Pengaturan
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    style={{
                      width: "100%", padding: "8px 10px",
                      borderRadius: "var(--radius-sm)", border: "none",
                      background: "transparent", color: "var(--text-muted)",
                      fontSize: 13, textAlign: "left", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8, transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-dim)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <FA icon={faRightFromBracket} style={{ fontSize: 12 }} /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px", width: "100%", position: "relative" }}>
          {children}
          <ContentLoader pathname={pathname} />
        </main>
      </div>
    </div>
  );
}

// ── Content area loader saat navigasi ────────────────────────────────────────
const ContentLoader = memo(({ pathname }: { pathname: string }) => {
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    // Tampilkan loader
    setVisible(true);
    clearTimeout(timerRef.current);

    // Sembunyikan setelah 500ms
    timerRef.current = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(timerRef.current);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: "var(--topbar-height)",
      left: "var(--sidebar-width)",
      right: 0,
      bottom: 0,
      zIndex: 40,
      background: "rgba(12,11,8,0.55)",
      backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "contentFadeIn 0.15s ease",
    }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        {/* Spinner berputar */}
        <img
          src="/loading-spinner.png"
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: 120, height: 120,
            objectFit: "contain",
            filter: "drop-shadow(0 0 10px rgba(200,150,10,0.5)) drop-shadow(0 0 24px rgba(180,120,5,0.25))",
            animationName: "rotateSunContent",
            animationDuration: "3s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        {/* Center diam */}
        <img
          src="/loading-center.png"
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 64, height: 64,
            objectFit: "contain",
            zIndex: 2,
            filter: "drop-shadow(0 0 8px rgba(220,165,10,0.7)) drop-shadow(0 0 20px rgba(200,140,5,0.35))",
          }}
        />
      </div>

      <style>{`
        @keyframes rotateSunContent {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes contentFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
});
