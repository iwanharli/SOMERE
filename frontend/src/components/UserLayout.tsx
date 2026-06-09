import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { FA } from "./Icon";
import {
  faGauge, faLayerGroup, faClipboardList,
  faGear, faRightFromBracket, faChevronDown, faBook,
} from "@fortawesome/free-solid-svg-icons";

const nav = [
  { to: "/",              label: "Beranda",      icon: faGauge         },
  { to: "/services",      label: "Daftar Layanan", icon: faLayerGroup    },
  { to: "/orders",        label: "Riwayat Tugas", icon: faClipboardList },
  { to: "/docs",          label: "Panduan",       icon: faBook          },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function handleLogout() {
    const rt = useAuthStore.getState().refreshToken;
    if (rt) api.post("/auth/logout", { refreshToken: rt }).catch(() => {});
    logout();
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>

      {/* ── Top Navigation ── */}
      <header className="user-header" style={{
        height: 60,
        background: "rgba(18,17,13,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: 0,
        position: "sticky", top: 0, zIndex: 100,
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 28, flexShrink: 0 }}>
          <img src="/logo-somere.png" alt="SOMERE" style={{ width: 30, height: 30, objectFit: "contain" }} />
          <span className="user-logo-text" style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", color: "var(--text-primary)" }}>
            SOMERE
          </span>
        </div>

        {/* Divider vertikal */}
        <div className="user-header-divider" style={{ width: 1, height: 20, background: "var(--border)", marginRight: 20, flexShrink: 0 }} />

        {/* Nav tabs */}
        <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          {nav.map(item => (
            <NavLink
              key={item.to} to={item.to} end
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 13px",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                background: isActive ? "var(--accent-dim)" : "transparent",
                borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                borderTop: "2px solid transparent",
                borderLeft: "none", borderRight: "none",
                textDecoration: "none", transition: "all 0.15s",
                whiteSpace: "nowrap", borderRadius: 0,
              })}
            >
              {({ isActive }) => (
                <>
                  <FA icon={item.icon} style={{ fontSize: 12, color: isActive ? "var(--accent)" : "var(--text-secondary)", opacity: isActive ? 1 : 0.7 }} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Kanan: saldo token + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* Avatar dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 8px 4px 4px",
                background: dropdownOpen ? "var(--bg-elevated)" : "transparent",
                border: `1px solid ${dropdownOpen ? "var(--border)" : "transparent"}`,
                borderRadius: 24, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!dropdownOpen) { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border)"; }}}
              onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}}
            >
              {/* Avatar circle */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(200,150,10,0.25), rgba(200,150,10,0.1))",
                border: "1.5px solid rgba(200,150,10,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "var(--accent)",
                flexShrink: 0,
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-avatar-name" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{user?.name}</span>
              <FA icon={faChevronDown} style={{ fontSize: 9, color: "var(--text-secondary)", transition: "transform 0.15s", transform: dropdownOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 220, background: "var(--bg-surface)",
                border: "1px solid var(--border)", borderRadius: "var(--radius)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)", overflow: "hidden",
                animation: "slideDown 0.14s ease",
              }}>
                {/* User info */}
                <div style={{ padding: "14px 16px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, rgba(200,150,10,0.25), rgba(200,150,10,0.08))",
                      border: "1.5px solid rgba(200,150,10,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700, color: "var(--accent)",
                    }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 1 }}>{user?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "6px" }}>
                  <button onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                    style={dropBtnStyle}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                    <FA icon={faGear} style={{ fontSize: 12 }} /> Pengaturan
                  </button>
                  <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                  <button onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    style={{ ...dropBtnStyle, color: "var(--red)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--red-dim)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <FA icon={faRightFromBracket} style={{ fontSize: 12 }} /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Konten ── */}
      <main className="user-main-content" style={{ flex: 1, padding: "28px", width: "100%", maxWidth: 1280, margin: "0 auto", alignSelf: "stretch", boxSizing: "border-box", position: "relative" }}>
        {children}
        <ContentLoaderUser pathname={pathname} />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {nav.map(item => (
          <NavLink
            key={item.to} to={item.to} end
            className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
          >
            <FA icon={item.icon} className="mobile-nav-icon" />
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes rotateSunUser { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes fadeInUser { from { opacity:0; } to { opacity:1; } }
        .user-nav-link:hover { background: var(--bg-elevated) !important; color: var(--text-primary) !important; }
        
        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .user-header {
            justify-content: space-between !important;
          }
          .user-logo-text {
            display: none !important;
          }
          .user-header-divider {
            display: none !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(19, 22, 31, 0.94);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border);
            z-index: 100;
            align-items: center;
            justify-content: space-around;
            padding: 0 10px;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          }
          .mobile-nav-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 10px;
            font-weight: 600;
            flex: 1;
            height: 100%;
            transition: all 0.15s ease;
          }
          .mobile-nav-link.active {
            color: var(--accent);
          }
          .mobile-nav-icon {
            font-size: 16px;
            opacity: 0.85;
          }
          .mobile-nav-link.active .mobile-nav-icon {
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(200,150,10,0.3));
          }
          .user-main-content {
            padding: 16px !important;
            padding-bottom: 84px !important; /* prevent content overlap */
          }
        }
        @media (max-width: 480px) {
          .user-avatar-name {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const dropBtnStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  borderRadius: "var(--radius-sm)", border: "none",
  background: "transparent", color: "var(--text-secondary)",
  fontSize: 13, textAlign: "left", cursor: "pointer",
  display: "flex", alignItems: "center", gap: 8, transition: "all 0.12s",
};

// Content loader untuk user layout
const ContentLoaderUser = memo(({ pathname }: { pathname: string }) => {
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(timerRef.current);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", top: 64, left: 0, right: 0, bottom: 0,
      zIndex: 40, background: "rgba(12,11,8,0.55)",
      backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeInUser 0.15s ease",
    }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <img src="/loading-spinner.png" style={{ position: "absolute", top: "50%", left: "50%", width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(200,150,10,0.5))", animationName: "rotateSunUser", animationDuration: "3s", animationTimingFunction: "linear", animationIterationCount: "infinite" }} />
        <img src="/loading-center.png" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, objectFit: "contain", zIndex: 2, filter: "drop-shadow(0 0 8px rgba(220,165,10,0.7))" }} />
      </div>
    </div>
  );
});
