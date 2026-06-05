import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import SyncButton from "../components/SyncButton";
import { FA } from "../components/Icon";
import { detectPlatform, PLATFORM_COLOR, detectServiceType, SERVICE_TYPES, detectReportReason, REPORT_REASONS } from "../lib/platform";
import {
  faMagnifyingGlass, faXmark, faCoins, faBolt, faArrowRight, faTriangleExclamation,
  faChevronLeft, faChevronRight, faChevronDown, faLayerGroup, faSliders,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram, faTiktok, faYoutube, faXTwitter,
  faFacebook, faLinkedin, faTelegram, faSpotify, faThreads,
} from "@fortawesome/free-brands-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

const PLATFORM_ICON: Record<string, IconProp> = {
  Instagram: faInstagram,
  TikTok:    faTiktok,
  YouTube:   faYoutube,
  Twitter:   faXTwitter,
  Facebook:  faFacebook,
  LinkedIn:  faLinkedin,
  Telegram:  faTelegram,
  Spotify:   faSpotify,
  Threads:   faThreads,
};

interface Service {
  id: number;
  name: string;
  description: string | null;
  category: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
}

interface TokenPrice { serviceId: number; tokenPrice: number; isActive: boolean; }

const PER_PAGE = 20;

export default function ServicesPage() {
  const isAdmin = useAuthStore(s => s.isAdmin)();

  const [services,     setServices]     = useState<Service[]>([]);
  const [tokenPrices,  setTokenPrices]  = useState<TokenPrice[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [platform, setPlatform]         = useState("all");
  const [serviceType, setServiceType]     = useState("all");
  const [reportReason, setReportReason]   = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [typeDropdown, setTypeDropdown]   = useState(false);
  const [reasonDropdown, setReasonDropdown] = useState(false);
  const [page, setPage]                   = useState(1);
  const typeDropdownRef                   = useRef<HTMLDivElement>(null);
  const reasonDropdownRef                 = useRef<HTMLDivElement>(null);
  const sentinelRef                       = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount]   = useState(12);

  const load = useCallback(() => {
    setLoading(true);
    const calls: Promise<any>[] = [api.get("/panelin/services")];
    if (!isAdmin) calls.push(api.get("/token/prices"));

    Promise.allSettled(calls).then(([svcRes, pricesRes]) => {
      if (svcRes.status === "fulfilled") {
        const d = svcRes.value.data?.data;
        setServices(Array.isArray(d) ? d : typeof d === "string" ? JSON.parse(d) : []);
      }
      if (pricesRes?.status === "fulfilled") setTokenPrices(pricesRes.value.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Tutup dropdown saat klik luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node))
        setTypeDropdown(false);
      if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(e.target as Node))
        setReasonDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const tokenPriceMap = useMemo(
    () => Object.fromEntries(tokenPrices.map(p => [p.serviceId, p])),
    [tokenPrices]
  );

  // Platform pills — hitung dari service yang ada
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of services) {
      const p = detectPlatform(s.name);
      if (p) counts[p] = (counts[p] ?? 0) + 1;
    }
    return counts;
  }, [services]);

  const platforms = useMemo(
    () => ["all", ...Object.keys(platformCounts).sort((a, b) => platformCounts[b] - platformCounts[a])],
    [platformCounts]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = services.filter((s) => {
      const plt    = detectPlatform(s.name);
      const type   = detectServiceType(s.name);
      const reason = detectReportReason(s.name);
      const tp     = tokenPrices.find(p => p.serviceId === s.id);
      const avail  = tp?.isActive ?? false;
      return (platform    === "all" || plt    === platform)
          && (serviceType === "all" || type   === serviceType)
          && (reportReason=== "all" || reason === reportReason)
          && (!onlyAvailable || avail)
          && (s.name.toLowerCase().includes(q) || String(s.id).includes(q));
    });
    // Aktif di atas, tidak aktif di bawah
    return result.sort((a, b) => {
      const aOk = tokenPrices.find(p => p.serviceId === a.id)?.isActive ? 1 : 0;
      const bOk = tokenPrices.find(p => p.serviceId === b.id)?.isActive ? 1 : 0;
      return bOk - aOk;
    });
  }, [services, search, platform, serviceType, reportReason, onlyAvailable, tokenPrices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const formatIDR = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  function reset() { setSearch(""); setPlatform("all"); setServiceType("all"); setReportReason("all"); setOnlyAvailable(false); setPage(1); setVisibleCount(12); }

  // Reset visibleCount saat filter berubah
  useEffect(() => { setVisibleCount(12); }, [search, platform, serviceType, reportReason, onlyAvailable]);

  const isFiltered = search || platform !== "all" || serviceType !== "all" || reportReason !== "all" || onlyAvailable;

  // ── USER: katalog card ─────────────────────────────────────────────────────
  if (!isAdmin) {
    const userItems = filtered.slice(0, visibleCount);
    const hasMore   = visibleCount < filtered.length;

    // Hitung jumlah per tipe (dari filtered platform, sebelum filter tipe)
    const typeBaseList = services.filter(s => platform === "all" || detectPlatform(s.name) === platform);
    const typeCounts: Record<string, number> = {};
    for (const s of typeBaseList) {
      const t = detectServiceType(s.name);
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }
    const availableTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);

    // Hitung per alasan (dari base yang sama)
    const reasonCounts: Record<string, number> = {};
    for (const s of typeBaseList) {
      const r = detectReportReason(s.name);
      reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
    }
    const availableReasons = Object.keys(reasonCounts).sort((a, b) => reasonCounts[b] - reasonCounts[a]);

    // Hitung yang tersedia
    const availableCount = services.filter(s => {
      const tp = tokenPrices.find(p => p.serviceId === s.id);
      return tp?.isActive;
    }).length;
    const activeTokenPrices = tokenPrices.filter(p => p.isActive).length;
    const currentPlatformLabel = platform === "all" ? "Semua platform" : platform;

    return (
      <>
        <div className="user-services-page">
          <div className="services-page-header">
            <div>
              <h1>Layanan</h1>
              <p>Pilih layanan yang aktif, lalu lanjutkan membuat tugas.</p>
            </div>
            {!loading && (
              <div className="services-total-badge">
                <div className="services-total-num">
                  <span style={{ color: "var(--accent)" }}>{availableCount}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 20 }}>/</span>
                  <span style={{ color: "var(--text-secondary)" }}>{services.length}</span>
                </div>
                <span className="services-total-label">layanan tersedia / total</span>
              </div>
            )}
          </div>

          <div className="services-control-panel">
            <div className="services-toolbar">
              <div className="services-search">
                <FA icon={faMagnifyingGlass} />
                <input value={search} placeholder="Cari nama atau ID layanan..."
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div className="services-toolbar-meta">

                {/* Dropdown filter jenis */}
                {!loading && availableTypes.length > 0 && (
                  <div ref={typeDropdownRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setTypeDropdown(v => !v)}
                      className={serviceType !== "all" ? "type-dropdown-btn active" : "type-dropdown-btn"}
                      style={serviceType !== "all" && SERVICE_TYPES[serviceType]
                        ? { ["--type-color" as string]: SERVICE_TYPES[serviceType].color } as React.CSSProperties
                        : undefined}
                    >
                      <FA icon={faSliders} />
                      {serviceType === "all" ? "Target" : SERVICE_TYPES[serviceType]?.label}
                      <FA icon={faChevronDown} style={{ fontSize: 9, marginLeft: 2, transition: "transform 0.15s", transform: typeDropdown ? "rotate(180deg)" : "none" }} />
                    </button>

                    {typeDropdown && (
                      <div className="type-dropdown-panel">
                        <button
                          onClick={() => { setServiceType("all"); setPage(1); setTypeDropdown(false); }}
                          className={serviceType === "all" ? "type-dropdown-item active-neutral" : "type-dropdown-item"}>
                          <span>Semua target</span>
                          <span className="type-count">{typeBaseList.length}</span>
                        </button>
                        {availableTypes.map(t => {
                          const info  = SERVICE_TYPES[t];
                          if (!info) return null;
                          const active = serviceType === t;
                          return (
                            <button key={t}
                              onClick={() => { setServiceType(t); setPage(1); setTypeDropdown(false); }}
                              className={active ? "type-dropdown-item active" : "type-dropdown-item"}
                              style={{ ["--type-color" as string]: info.color } as React.CSSProperties}>
                              <span>{info.label}</span>
                              <span className="type-count">{typeCounts[t]}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Dropdown alasan laporan */}
                {!loading && availableReasons.length > 0 && (
                  <div ref={reasonDropdownRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setReasonDropdown(v => !v)}
                      className={reportReason !== "all" ? "type-dropdown-btn active" : "type-dropdown-btn"}
                      style={reportReason !== "all" && REPORT_REASONS[reportReason]
                        ? { ["--type-color" as string]: REPORT_REASONS[reportReason].color } as React.CSSProperties
                        : undefined}
                    >
                      <FA icon={faTriangleExclamation} style={{ fontSize: 11 }} />
                      {reportReason === "all" ? "Alasan" : REPORT_REASONS[reportReason]?.label}
                      <FA icon={faChevronDown} style={{ fontSize: 9, marginLeft: 2, transition: "transform 0.15s", transform: reasonDropdown ? "rotate(180deg)" : "none" }} />
                    </button>

                    {reasonDropdown && (
                      <div className="type-dropdown-panel">
                        <button
                          onClick={() => { setReportReason("all"); setPage(1); setReasonDropdown(false); }}
                          className={reportReason === "all" ? "type-dropdown-item active-neutral" : "type-dropdown-item"}>
                          <span>Semua alasan</span>
                          <span className="type-count">{typeBaseList.length}</span>
                        </button>
                        {availableReasons.map(r => {
                          const info = REPORT_REASONS[r];
                          if (!info) return null;
                          const active = reportReason === r;
                          return (
                            <button key={r}
                              onClick={() => { setReportReason(r); setPage(1); setReasonDropdown(false); }}
                              className={active ? "type-dropdown-item active" : "type-dropdown-item"}
                              style={{ ["--type-color" as string]: info.color } as React.CSSProperties}>
                              <span>{info.label}</span>
                              <span className="type-count">{reasonCounts[r]}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle ketersediaan */}
                {!loading && (
                  <button
                    onClick={() => { setOnlyAvailable(v => !v); setPage(1); }}
                    className={onlyAvailable ? "type-dropdown-btn active" : "type-dropdown-btn"}
                    style={onlyAvailable ? { ["--type-color" as string]: "#22c55e" } as React.CSSProperties : undefined}
                  >
                    <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${onlyAvailable ? "#22c55e" : "var(--border-light)"}`, background: onlyAvailable ? "#22c55e" : "transparent", position: "relative", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {onlyAvailable && <span style={{ color: "#0C0B08", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </span>
                    Tersedia
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "1px 7px", borderRadius: 5, background: onlyAvailable ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", color: onlyAvailable ? "#22c55e" : "var(--text-muted)" }}>{availableCount}</span>
                  </button>
                )}

                {isFiltered && (
                  <button onClick={reset} className="services-reset-btn">
                    <FA icon={faXmark} /> Reset
                  </button>
                )}
              </div>
            </div>

            {!loading && platforms.length > 1 && (
              <div className="platform-strip" aria-label="Filter platform">
                {platforms.map(p => {
                  const active = platform === p;
                  const color  = p === "all" ? "var(--accent)" : PLATFORM_COLOR[p];
                  const count  = p === "all" ? services.length : platformCounts[p];
                  return (
                    <button
                      key={p}
                      onClick={() => { setPlatform(p); setPage(1); }}
                      className={active ? "platform-pill active" : "platform-pill"}
                      style={{ ["--platform-color" as string]: color }}
                    >
                      {p !== "all" && PLATFORM_ICON[p] && <FA icon={PLATFORM_ICON[p]} />}
                      {p === "all" ? "Semua" : p}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Jumlah hasil — bawah kanan */}
          {!loading && (
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", marginTop: 4, marginBottom: 2 }}>
              {filtered.length.toLocaleString("id-ID")} hasil
            </div>
          )}

          {loading ? (
            <div className="service-card-grid">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="service-card-skeleton" style={{ opacity: 1 - i * 0.07 }} />)}
            </div>
          ) : userItems.length === 0 ? (
            <div className="services-empty">
              <FA icon={faSliders} />
              <strong>Tidak ada layanan ditemukan</strong>
              <span>Coba ubah kata kunci atau pilih platform lain.</span>
            </div>
          ) : (
            <>
              <div className="service-card-grid">
                {userItems.map((s, itemIndex) => {
                  const plt        = detectPlatform(s.name);
                  const pColor     = plt ? PLATFORM_COLOR[plt] : "#8b8fa8";
                  const pIcon      = plt ? PLATFORM_ICON[plt] : null;
                  const tp         = tokenPriceMap[s.id];
                  const available  = tp?.isActive;
                  const typeInfo   = SERVICE_TYPES[detectServiceType(s.name)];
                  const reasonInfo = REPORT_REASONS[detectReportReason(s.name)];
                  // Hilangkan prefix platform dari judul
                  const cleanName  = s.name
                    .replace(/^instagram\s+/i, "")
                    .replace(/^tiktok\s+/i, "")
                    .replace(/^youtube\s+/i, "")
                    .replace(/^twitter\/x\s+/i, "")
                    .replace(/^facebook\s+/i, "")
                    .replace(/^telegram\s+/i, "");

                  // Pisah nama: "Report Account" dan "[Spam & Scam]"
                  const bracketMatch = cleanName.match(/^(.*?)\s*(\[.*\])\s*$/);
                  const titleMain    = bracketMatch ? bracketMatch[1].trim() : cleanName;
                  const titleSub     = bracketMatch ? bracketMatch[2].replace(/[\[\]]/g, "").trim() : "";

                  return (
                    <article
                      key={s.id}
                      className={available ? "service-card" : "service-card unavailable"}
                      style={{ ["--service-color" as string]: pColor, ["--card-index" as string]: itemIndex }}
                    >
                      {/* ID pojok kanan atas — emas */}
                      <span className="sc-id-corner">#{s.id}</span>

                      <div className="service-card-accent" />
                      <div className="service-card-body">

                        {/* ── Top: icon + type tag ── */}
                        <div className="sc-top">
                          <div className="sc-icon">
                            {pIcon ? <FA icon={pIcon} /> : <FA icon={faLayerGroup} />}
                          </div>
                          <div className="sc-top-right">
                            {typeInfo && (
                              <span className="sc-type-tag" style={{ ["--tc" as string]: typeInfo.color }}>
                                {typeInfo.label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── Judul utama & sub ── */}
                        <div className="sc-title-block">
                          <div className="sc-platform-label">{plt ?? "Layanan"}</div>
                          <h2 className="sc-title">{titleMain}</h2>
                          {titleSub && <div className="sc-subtitle">{titleSub}</div>}
                        </div>

                        {/* ── Divider ── */}
                        <div className="sc-divider" />

                        {/* ── Price row ── */}
                        <div className="sc-price-row">
                          {available ? (
                            <div className="sc-token">
                              <FA icon={faCoins} style={{ fontSize: 13, color: "var(--accent)" }} />
                              <span className="sc-token-num">{tp.tokenPrice}</span>
                              <span className="sc-token-label">token</span>
                              <span style={{ fontSize: 11, color: "rgba(200,150,10,0.8)", fontWeight: 500 }}>/1000 Report</span>
                            </div>
                          ) : (
                            <span className="sc-unavail">Belum tersedia</span>
                          )}
                          <div className="sc-range">
                            <span className="sc-range-label">Jumlah Report</span>
                            <span className="sc-range-val">
                              {s.min >= 1000
                                ? `${(s.min/1000).toLocaleString("id-ID")}k – ${(s.max/1000).toLocaleString("id-ID")}k`
                                : `${s.min.toLocaleString("id-ID")} – ${s.max.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>

                        {/* ── CTA ── */}
                        {available && (
                          <a href={`/orders/create?service=${s.id}`} className="sc-cta">
                            Mulai Sekarang <FA icon={faArrowRight} style={{ fontSize: 11 }} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              {/* Sentinel untuk infinite scroll */}
              {hasMore && (
                <InfiniteScrollSentinel
                  sentinelRef={sentinelRef}
                  onVisible={() => setVisibleCount(v => v + 12)}
                />
              )}
              {!hasMore && filtered.length > 12 && (
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", padding: "16px 0" }}>
                  Semua {filtered.length} layanan ditampilkan
                </p>
              )}
            </>
          )}
        </div>
        <style>{userServicesCss}</style>
      </>
    );
  }

  // ── ADMIN: tabel ───────────────────────────────────────────────────────────
  return (
    <>
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>Layanan</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {isAdmin ? "Daftar layanan SMM" : "Pilih layanan untuk membuat tugas baru"}
            </p>
          </div>
          {isAdmin && <SyncButton endpoint="/panelin/sync/services" label="Sinkronkan Layanan" onDone={load} />}
        </div>

        {/* Platform pills */}
        {!loading && platforms.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {platforms.map((p) => {
              const active = platform === p;
              const color  = p === "all" ? null : PLATFORM_COLOR[p];
              const count  = p === "all" ? services.length : platformCounts[p];
              return (
                <button
                  key={p}
                  onClick={() => { setPlatform(p); setPage(1); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
                    border: `1px solid ${active && color ? color + "60" : active ? "var(--accent)" : "var(--border)"}`,
                    background: active && color ? color + "18" : active ? "var(--accent-dim)" : "var(--bg-elevated)",
                    color: active && color ? color : active ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.12s",
                  }}
                >
                  {p === "all" ? "Semua" : p}
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 13, pointerEvents: "none" }}>
              <FA icon={faMagnifyingGlass} />
            </span>
            <input
              type="text" value={search} placeholder="Cari nama atau ID layanan..."
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: "100%", padding: "8px 12px 8px 30px",
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          {isFiltered && (
            <button onClick={reset} style={{
              padding: "8px 10px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)", background: "var(--bg-elevated)",
              color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <FA icon={faXmark} style={{ fontSize: 12 }} /> Reset
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {loading ? "Memuat..." : `${filtered.length.toLocaleString("id-ID")} layanan`}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {loading ? <LoadingTable /> : filtered.length === 0 ? <EmptyState text="Tidak ada layanan ditemukan" /> : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                      <Th>ID</Th>
                      <Th></Th>
                      <Th>Layanan</Th>
                      <Th>{isAdmin ? "Harga / 1000" : "Harga Token"}</Th>
                      <Th>Min – Max</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s, i) => {
                      const plt = detectPlatform(s.name);
                      return (
                        <tr key={s.id}
                          style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--border)" : "none" }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                        >
                          <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            #{s.id}
                          </td>
                          <td style={{ padding: "11px 8px", textAlign: "center", width: 32 }}>
                            {plt && PLATFORM_ICON[plt] ? (
                              <FA icon={PLATFORM_ICON[plt]} style={{ fontSize: 16, color: PLATFORM_COLOR[plt] }} title={plt} />
                            ) : (
                              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                            {s.description && (
                              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {s.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                            {isAdmin ? (
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>{formatIDR(s.rate)}</span>
                            ) : (() => {
                              const tp = tokenPriceMap[s.id];
                              return tp?.isActive ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                                  <FA icon={faCoins} style={{ fontSize: 11 }} />{tp.tokenPrice} token
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tidak tersedia</span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {s.min.toLocaleString("id-ID")} – {s.max.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{
                  padding: "12px 16px", borderTop: "1px solid var(--border)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} dari {filtered.length}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <PageBtn icon={faChevronLeft}  disabled={safePage <= 1}          onClick={() => setPage(p => p - 1)} />
                    {paginationRange(safePage, totalPages).map((p, i) =>
                      p === "…"
                        ? <span key={i} style={{ padding: "5px 3px", fontSize: 12, color: "var(--text-muted)" }}>…</span>
                        : <PageBtn key={p} label={String(p)} active={p === safePage} onClick={() => setPage(Number(p))} />
                    )}
                    <PageBtn icon={faChevronRight} disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} />
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

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{children}</th>;
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
  return <div style={{ padding: 20 }}>{Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ height: 14, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 14, opacity: 1 - i * 0.1 }} />)}</div>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <FA icon={faLayerGroup} style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.2 }} />
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>{text}</p>
    </div>
  );
}

const userServicesCss = `
  .user-services-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    animation: servicesPageIn 0.28s ease-out both;
  }

  /* Header ringkas */
  .services-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 4px;
  }

  .services-page-header h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 3px;
  }

  .services-page-header p {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
  }

  .services-total-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .services-total-num {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.5px;
  }

  .services-total-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .services-control-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: rgba(19,22,31,0.78);
    box-shadow: 0 12px 28px rgba(0,0,0,0.12);
    animation: servicesFadeUp 0.36s 0.04s ease-out both;
    position: relative;
    z-index: 20;
  }

  .services-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* Search input */
  .services-search {
    position: relative;
    flex: 1;
    min-width: 220px;
  }

  .services-search svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 14px;
    pointer-events: none;
  }

  .services-search input {
    width: 100%;
    height: 42px;
    padding: 0 14px 0 40px;
    border: 1px solid var(--border);
    border-radius: 10px;
    outline: none;
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .services-search input:focus {
    border-color: rgba(200,150,10,0.55);
    box-shadow: 0 0 0 3px rgba(200,150,10,0.08);
  }

  .services-search input::placeholder {
    color: var(--text-muted);
  }

  /* Toolbar meta: filter buttons */
  .services-toolbar-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  /* Reset button */
  .services-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    padding: 0 14px;
    border: 1px solid var(--red-dim);
    border-radius: 10px;
    background: var(--red-dim);
    color: var(--red);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .services-reset-btn:hover {
    background: rgba(239,68,68,0.18);
    border-color: rgba(239,68,68,0.4);
  }

  .platform-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 0 4px;
    scrollbar-width: none;
  }

  .platform-strip::-webkit-scrollbar { display: none; }

  .platform-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    height: 40px;
    padding: 0 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
  }

  .platform-pill svg {
    font-size: 16px !important;
    flex-shrink: 0;
  }

  .platform-pill span {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 6px;
    background: rgba(255,255,255,0.06);
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .platform-pill:hover {
    border-color: color-mix(in srgb, var(--platform-color) 40%, transparent);
    background: color-mix(in srgb, var(--platform-color) 10%, var(--bg-elevated));
    color: var(--platform-color);
  }

  .platform-pill.active {
    border-color: color-mix(in srgb, var(--platform-color) 60%, transparent);
    background: color-mix(in srgb, var(--platform-color) 16%, var(--bg-surface));
    color: var(--platform-color);
    box-shadow: 0 2px 12px color-mix(in srgb, var(--platform-color) 20%, transparent);
  }

  .platform-pill.active span {
    background: color-mix(in srgb, var(--platform-color) 20%, transparent);
    color: var(--platform-color);
  }

  .type-filter-bar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 14px 0 2px;
    margin-top: 2px;
    border-top: 1px solid var(--border);
  }

  .type-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 13px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .type-pill span {
    font-size: 11px;
    opacity: 0.65;
  }

  .type-pill:hover {
    border-color: var(--border-light);
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .type-pill.active {
    border-color: color-mix(in srgb, var(--type-color) 55%, transparent);
    background: color-mix(in srgb, var(--type-color) 14%, transparent);
    color: var(--type-color);
    font-weight: 600;
  }

  .type-pill.active-neutral {
    border-color: var(--border-light);
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
  }

  .type-dropdown-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 42px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .type-dropdown-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-light);
    background: var(--bg-hover);
  }

  .type-dropdown-btn.active {
    border-color: color-mix(in srgb, var(--type-color) 55%, transparent);
    background: color-mix(in srgb, var(--type-color) 14%, transparent);
    color: var(--type-color);
    font-weight: 600;
  }

  .type-dropdown-panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 200px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    overflow: hidden;
    z-index: 9999;
    animation: servicesFadeUp 0.12s ease;
  }

  .type-dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 9px 14px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }

  .type-dropdown-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .type-dropdown-item.active {
    background: color-mix(in srgb, var(--type-color) 12%, transparent);
    color: var(--type-color);
    font-weight: 600;
  }

  .type-dropdown-item.active-neutral {
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
  }

  .type-count {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .type-dropdown-item.active .type-count {
    background: color-mix(in srgb, var(--type-color) 20%, transparent);
    color: var(--type-color);
  }

  .service-type-badge {
    display: inline-block;
    margin-left: 5px;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    background: color-mix(in srgb, var(--type-color) 14%, transparent);
    color: var(--type-color);
    border: 1px solid color-mix(in srgb, var(--type-color) 30%, transparent);
    vertical-align: middle;
    letter-spacing: 0.01em;
  }

  .service-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    animation: servicesFadeUp 0.36s 0.08s ease-out both;
  }

  .service-card,
  .service-card-skeleton {
    min-height: 200px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-surface);
    overflow: hidden;
  }

  .service-card {
    position: relative;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
    animation: serviceCardIn 0.34s ease-out both;
    animation-delay: calc(var(--card-index, 0) * 28ms);
  }

  .service-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--service-color) 45%, var(--border));
    box-shadow: 0 12px 28px rgba(0,0,0,0.24), 0 0 0 1px color-mix(in srgb, var(--service-color) 18%, transparent);
  }

  .service-card.unavailable {
    opacity: 0.55;
  }

  .service-card.unavailable:hover {
    transform: none;
    box-shadow: none;
    border-color: var(--border);
  }

  .service-card-accent {
    height: 3px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--service-color) 40%, transparent), var(--service-color));
  }

  .service-card.unavailable .service-card-accent {
    background: var(--border);
  }

  /* ── Card body layout ── */
  .service-card-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    gap: 0;
  }

  /* Top row: icon + type tag */
  .sc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .sc-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--service-color) 14%, var(--bg-elevated));
    border: 1.5px solid color-mix(in srgb, var(--service-color) 28%, transparent);
    color: var(--service-color);
    font-size: 18px;
    flex-shrink: 0;
    transition: background 0.18s, box-shadow 0.18s;
  }

  .service-card:hover .sc-icon {
    background: color-mix(in srgb, var(--service-color) 20%, var(--bg-elevated));
    box-shadow: 0 0 10px color-mix(in srgb, var(--service-color) 25%, transparent);
  }

  .sc-top-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sc-type-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--tc) 13%, transparent);
    color: var(--tc);
    border: 1px solid color-mix(in srgb, var(--tc) 28%, transparent);
  }

  .sc-id-corner {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 11px;
    font-family: ui-monospace, monospace;
    font-weight: 700;
    color: #0C0B08;
    background: linear-gradient(135deg, #C8960A, #E0A80C);
    padding: 3px 9px 3px 10px;
    border-radius: 0 var(--radius) 0 8px;
    letter-spacing: 0.03em;
    z-index: 2;
  }

  /* Platform label */
  .sc-platform-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--service-color);
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  /* Judul utama */
  .sc-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.35;
    margin-bottom: 6px;
  }

  /* Sub judul (isi bracket) — pill badge */
  .sc-subtitle {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    color: color-mix(in srgb, var(--service-color) 90%, white);
    background: color-mix(in srgb, var(--service-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--service-color) 25%, transparent);
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  /* Title block */
  .sc-title-block {
    flex: 1;
  }

  /* Divider */
  .sc-divider {
    height: 1px;
    background: linear-gradient(90deg, var(--service-color) 0%, var(--border) 60%);
    margin: 0 0 12px;
    opacity: 0.3;
  }

  /* Price row */
  .sc-price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }

  .sc-token {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .sc-token-num {
    font-size: 22px;
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
    letter-spacing: -0.5px;
  }

  .sc-token-label {
    font-size: 12px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .sc-range {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .sc-range-label {
    font-size: 10px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }

  .sc-range-val {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .sc-unavail {
    font-size: 12px;
    color: var(--text-secondary);
    font-style: italic;
  }

  /* CTA button */
  .sc-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 14px;
    border-radius: 8px;
    border: 1px solid rgba(200,150,10,0.3);
    background: rgba(200,150,10,0.08);
    color: #C8960A;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
    margin-top: auto;
  }

  .sc-cta:hover {
    background: rgba(200,150,10,0.15);
    border-color: rgba(200,150,10,0.5);
    box-shadow: 0 3px 10px rgba(200,150,10,0.15);
  }

  .service-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 16px 0 14px;
  }

  .token-badge,
  .status-badge,
  .range-badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    border-radius: var(--radius-sm);
    font-size: 12px;
  }

  .token-badge {
    gap: 6px;
    padding: 0 10px;
    border: 1px solid rgba(200,150,10,0.22);
    background: var(--accent-dim);
    color: var(--accent);
  }

  .token-badge strong {
    font-size: 17px;
    line-height: 1;
  }

  .token-badge span,
  .range-badge {
    color: var(--text-muted);
  }

  .status-badge {
    padding: 0 10px;
    border: 1px solid var(--border);
    color: var(--text-muted);
    background: var(--bg-elevated);
  }

  .range-badge {
    justify-content: flex-end;
    white-space: nowrap;
  }

  .service-order-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    min-height: 38px;
    margin-top: auto;
    border: 1px solid rgba(200,150,10,0.3);
    border-radius: var(--radius-sm);
    background: rgba(200,150,10,0.1);
    color: #C8960A;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }

  .service-order-link:hover {
    background: rgba(200,150,10,0.18);
    border-color: rgba(200,150,10,0.5);
    transform: translateY(-1px);
  }

  .service-card-skeleton {
    position: relative;
    background:
      var(--bg-surface);
  }

  .service-card-skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, transparent 15%, rgba(255,255,255,0.045) 38%, transparent 62%);
    transform: translateX(-100%);
    animation: servicesSkeleton 1.5s ease-in-out infinite;
  }

  .services-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 52px 24px;
    border: 1px dashed var(--border-light);
    border-radius: var(--radius);
    background: var(--bg-surface);
    text-align: center;
    color: var(--text-muted);
  }

  .services-empty svg {
    margin-bottom: 6px;
    font-size: 24px;
    color: var(--accent);
    opacity: 0.8;
  }

  .services-empty strong {
    color: var(--text-primary);
    font-size: 14px;
  }

  .services-empty span {
    font-size: 13px;
  }

  .services-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .services-pagination button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    color: var(--text-secondary);
  }

  .services-pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .services-pagination span {
    color: var(--text-muted);
    font-size: 13px;
  }

  @keyframes servicesPageIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes servicesFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes serviceCardIn {
    from { opacity: 0; transform: translateY(12px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes servicesSkeleton {
    to { transform: translateX(100%); }
  }

  @keyframes servicesHeroSweep {
    0%, 55% { opacity: 0; transform: translateX(-90px) rotate(18deg); }
    70% { opacity: 1; }
    100% { opacity: 0; transform: translateX(280px) rotate(18deg); }
  }

  @media (max-width: 1100px) {
    .service-card-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 960px) {
    .services-hero {
      grid-template-columns: 1fr;
    }

    .services-hero-stats {
      min-width: 0;
    }
  }

  @media (max-width: 680px) {
    .services-hero {
      padding: 18px;
    }

    .services-hero h1 {
      font-size: 21px;
    }

    .services-hero-stats {
      grid-template-columns: 1fr;
    }

    .services-toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .services-toolbar-meta {
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 8px;
    }

    .service-card-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 576px) {
    .services-page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .services-total-badge {
      align-items: flex-start;
    }
    .type-dropdown-btn {
      flex: 1 1 auto;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .type-dropdown-panel {
      right: auto;
      left: 0;
      min-width: calc(100vw - 32px);
      max-width: 320px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .user-services-page,
    .services-hero,
    .services-control-panel,
    .service-card-grid,
    .service-card,
    .service-card-skeleton::after,
    .services-hero::before {
      animation: none;
    }

    .service-card,
    .service-icon,
    .service-order-link,
    .hero-stat,
    .platform-pill {
      transition: none;
    }
  }
`;

function InfiniteScrollSentinel({
  sentinelRef,
  onVisible,
}: {
  sentinelRef: React.RefObject<HTMLDivElement>;
  onVisible: () => void;
}) {
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onVisible(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef, onVisible]);

  return (
    <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", padding: "20px 0", gap: 8 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", opacity: 0.4, animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`
        @keyframes dotPulse {
          0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
