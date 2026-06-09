import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { PanelinService } from "../types";
import { useAuthStore } from "../store/auth";
import { swSuccess, swError, swConfirm } from "../lib/swal";
import { detectPlatform, PLATFORM_COLOR } from "../lib/platform";
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
import { FA } from "../components/Icon";
import {
  faMagnifyingGlass, faCoins,
  faCircleInfo, faArrowRight,
  faTriangleExclamation, faRotate, faXmark, faLayerGroup,
  faCircleCheck, faHashtag, faClipboardList, faRotateLeft,
  faCalendar, faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";

const PER_PAGE = 30;

interface TokenPrice { serviceId: number; tokenPrice: number; isActive: boolean; }

interface TargetInfo { label: string; placeholder: string; hint: string; steps: string[]; }

function getTargetInfo(description: string | null | undefined): TargetInfo {
  const d = description ?? "";
  const match = d.match(/Target:\s*(.+?)\.?\s*$/i);
  const target = match ? match[1].trim() : "";

  const map: Record<string, TargetInfo> = {
    "Link Profil": {
      label: "Link Profil Target", placeholder: "https://instagram.com/username",
      hint:  "Salin URL profil akun target dari address bar browser.",
      steps: ["Buka profil akun target di aplikasi atau browser", "Salin URL dari address bar (contoh: instagram.com/username)", "Tempel ke kolom input di atas"],
    },
    "Link Profil Instagram": {
      label: "Link Profil Instagram", placeholder: "https://instagram.com/username",
      hint:  "Salin URL profil Instagram target.",
      steps: ["Buka profil Instagram target di browser", "Salin URL dari address bar", "Contoh: https://instagram.com/namaakun"],
    },
    "Link Profil X": {
      label: "Link Profil X / Twitter", placeholder: "https://x.com/username",
      hint:  "Salin URL profil X (Twitter) target.",
      steps: ["Buka profil target di x.com", "Salin URL dari address bar", "Contoh: https://x.com/namaakun"],
    },
    "Link Profil TikTok": {
      label: "Link Profil TikTok", placeholder: "https://tiktok.com/@username",
      hint:  "Salin URL profil TikTok target.",
      steps: ["Buka profil target di tiktok.com", "Salin URL dari address bar", "Contoh: https://tiktok.com/@namaakun"],
    },
    "Link Profil/Page": {
      label: "Link Profil / Page Facebook", placeholder: "https://facebook.com/username",
      hint:  "Salin URL profil atau halaman Facebook target.",
      steps: ["Buka profil atau halaman Facebook target di browser", "Salin URL dari address bar", "Contoh: https://facebook.com/namaakun"],
    },
    "Link Post/Reels": {
      label: "Link Post / Reels", placeholder: "https://instagram.com/p/AbCdEf",
      hint:  "Salin URL postingan atau reels Instagram target.",
      steps: ["Buka postingan atau reels target", "Klik ikon '···' lalu pilih 'Copy Link'", "Tempel link ke kolom input"],
    },
    "Link Tweet": {
      label: "Link Tweet", placeholder: "https://x.com/username/status/123456789",
      hint:  "Salin URL tweet target.",
      steps: ["Buka tweet target di x.com", "Klik ikon Share lalu 'Copy link to post'", "Tempel ke kolom input"],
    },
    "Link Video": {
      label: "Link Video", placeholder: "https://tiktok.com/@user/video/123...",
      hint:  "Salin URL video target.",
      steps: ["Buka video target di browser", "Klik Share lalu 'Copy link'", "Atau salin langsung dari address bar"],
    },
    "Link Channel": {
      label: "Link Channel YouTube", placeholder: "https://youtube.com/@channelname",
      hint:  "Salin URL channel YouTube target.",
      steps: ["Buka channel YouTube target di browser", "Salin URL dari address bar", "Contoh: https://youtube.com/@namakanal"],
    },
    "Link Channel (t.me)": {
      label: "Link Channel Telegram", placeholder: "https://t.me/channelname",
      hint:  "Masukkan link channel Telegram (format t.me/...).",
      steps: ["Buka channel Telegram target", "Klik nama channel > 'Copy Link'", "Contoh: https://t.me/namachannel"],
    },
    "Link Page": {
      label: "Link Halaman Facebook", placeholder: "https://facebook.com/pagename",
      hint:  "Salin URL halaman (Page) Facebook target.",
      steps: ["Buka halaman Facebook target di browser", "Salin URL dari address bar", "Contoh: https://facebook.com/namahalaman"],
    },
    "Link Post": {
      label: "Link Postingan Facebook", placeholder: "https://facebook.com/.../posts/...",
      hint:  "Salin URL postingan Facebook target.",
      steps: ["Klik waktu posting (misal '2 jam lalu')", "Salin URL dari address bar yang muncul", "Atau klik '···' > 'Copy link'"],
    },
    "Link Reels/Video": {
      label: "Link Reels / Video Facebook", placeholder: "https://facebook.com/reel/...",
      hint:  "Salin URL reels atau video Facebook target.",
      steps: ["Buka reels/video target di Facebook", "Klik '···' lalu 'Copy link'", "Tempel ke kolom input"],
    },
    "Link Grup (t.me)": {
      label: "Link Grup Telegram", placeholder: "https://t.me/groupname",
      hint:  "Masukkan link grup Telegram (format t.me/...).",
      steps: ["Buka info grup Telegram target", "Klik 'Invite Link' atau 'Copy Link'", "Contoh: https://t.me/namagrup"],
    },
    "Username Bot": {
      label: "Username Bot Telegram", placeholder: "@namabot",
      hint:  "Masukkan username bot Telegram yang ingin dilaporkan.",
      steps: ["Cari bot di Telegram", "Lihat username di profil bot (diawali @)", "Salin username bot (contoh: @namabot)"],
    },
    "Username/Link Profil": {
      label: "Username / Link Profil Telegram", placeholder: "@username atau https://t.me/username",
      hint:  "Masukkan username atau link profil Telegram target.",
      steps: ["Buka profil user Telegram target", "Salin username (contoh: @namauser)", "Atau gunakan link t.me/namauser"],
    },
    "Link Sticker Pack": {
      label: "Link Sticker Pack Telegram", placeholder: "https://t.me/addstickers/namapack",
      hint:  "Salin link sticker pack Telegram yang ingin dilaporkan.",
      steps: ["Buka sticker pack target di Telegram", "Klik '···' > 'Share'", "Salin link (format: t.me/addstickers/...)"],
    },
  };

  return map[target] ?? {
    label: "Link / Username Target", placeholder: "https://... atau @username",
    hint:  "Masukkan link atau username target.",
    steps: ["Buka halaman/profil target di browser", "Salin URL dari address bar", "Tempel ke kolom input"],
  };
}

export default function CreateOrderPage() {
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin    = useAuthStore((s) => s.isAdmin)();

  const [services,     setServices]     = useState<PanelinService[]>([]);
  const [tokenPrices,  setTokenPrices]  = useState<TokenPrice[]>([]);
  const [loadingSvc,   setLoadingSvc]   = useState(true);
  const [search,       setSearch]       = useState("");
  const [platform,     setPlatform]     = useState("all");
  const [page,         setPage]         = useState(1);
  const [selected, setSelected]     = useState<PanelinService | null>(null);

  const [link, setLink]             = useState("");
  const [quantity, setQuantity]     = useState("");
  const [comments, setComments]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt]       = useState<any>(null);
  const requestedServiceId = Number(searchParams.get("service"));

  useEffect(() => {
    const calls = [api.get("/panelin/services")];
    if (!isAdmin) calls.push(api.get("/token/prices"));
    Promise.allSettled(calls).then(([svcRes, pricesRes]) => {
      if (svcRes.status === "fulfilled") {
        const d = svcRes.value.data?.data;
        setServices(Array.isArray(d) ? d : typeof d === "string" ? JSON.parse(d) : []);
      }
      if (pricesRes?.status === "fulfilled") setTokenPrices(pricesRes.value.data?.data ?? []);
    }).finally(() => setLoadingSvc(false));
  }, [isAdmin]);

  useEffect(() => {
    const serviceId = Number(searchParams.get("service"));
    if (!serviceId || selected || services.length === 0) return;
    const service = services.find(s => s.id === serviceId);
    if (service) selectService(service);
  }, [searchParams, selected, services]);

  useEffect(() => {
    if (isAdmin || loadingSvc) return;
    if (!requestedServiceId) {
      navigate("/services", { replace: true });
      return;
    }
    if (services.length > 0 && !services.some(s => s.id === requestedServiceId)) {
      navigate("/services", { replace: true });
    }
  }, [isAdmin, loadingSvc, navigate, requestedServiceId, services]);

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
    return services.filter((s) => {
      const plt = detectPlatform(s.name);
      return (platform === "all" || plt === platform)
        && (s.name.toLowerCase().includes(q) || String(s.id).includes(q));
    });
  }, [services, search, platform]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const tokenPriceMap = Object.fromEntries(tokenPrices.map(p => [p.serviceId, p]));
  const selectedTokenPrice = selected ? tokenPriceMap[selected.id] : null;
  const focusedCheckout = Boolean(selected && requestedServiceId);

  const qty = parseInt(quantity, 10);
  const isValidQty = selected && !isNaN(qty) && qty >= selected.min && qty <= selected.max;
  const estimatedCost = isAdmin && selected && isValidQty ? Math.ceil((qty / 1000) * selected.rate) : null;

  // Untuk user: cek apakah layanan tersedia dan token cukup
  const tokenCost = selectedTokenPrice?.isActive && isValidQty
    ? Math.ceil((qty / 1000) * selectedTokenPrice.tokenPrice)
    : selectedTokenPrice?.tokenPrice ?? 0;

  const formatIDR = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  async function handleSubmit() {
    if (!selected || !isValidQty) return;
    if (!link.trim()) {
      swError("Input Tidak Lengkap", `${targetInfo?.label ?? "Link / Username Target"} wajib diisi.`);
      return;
    }

    const confirm = await swConfirm({
      title: "Konfirmasi Tugas",
      html: `Mulai <strong style="color:#C8960A">${qty.toLocaleString("id-ID")}</strong> report untuk layanan <strong style="color:#e2c97e">${selected.name.replace(/\s*\[.+?\]/, "").trim()}</strong>?`,
      confirmText: "Ya, Mulai",
      cancelText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const { data } = await api.post("/panelin/orders", {
        service: selected.id, link: link || undefined,
        quantity: qty, comments: comments || undefined,
      });
      setLink(""); setQuantity("1000"); setComments("");
      // Simpan receipt untuk ditampilkan
      setReceipt({ order: data?.data, service: selected, tokenCost: !isAdmin ? tokenCost : null });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.error ?? err?.response?.data?.message ?? "Gagal membuat tugas";
      swError("Tugas Gagal", msg);
    } finally {
      setSubmitting(false);
    }
  }

  function selectService(s: PanelinService) {
    setSelected(s); setQuantity("1000");
  }

  function clearSelected() {
    setSelected(null);
    if (requestedServiceId) navigate("/orders/create", { replace: true });
  }

  const selectedPlatform = selected ? detectPlatform(selected.name) : null;
  const targetInfo = selected ? getTargetInfo(selected.description) : null;

  if (receipt) {
    return <ReceiptPage receipt={receipt} onBack={() => navigate("/orders")} onNew={() => { setReceipt(null); navigate("/services"); }} />;
  }

  return (
    <>
      <div>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>Buat Tugas</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {focusedCheckout ? "Lengkapi detail order untuk layanan yang dipilih" : "Pilih layanan terlebih dahulu, lalu isi detail order"}
          </p>
        </div>

        <div
          className={focusedCheckout ? "create-order-grid checkout-mode" : "create-order-grid picker-mode"}
          style={{ display: "grid", gap: 16, alignItems: "start" }}
        >

          {/* ── Kiri: Daftar service ── */}
          {focusedCheckout ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="checkout-summary-card" style={{
              background: "var(--bg-surface)",
              border: "1px solid rgba(200,150,10,0.24)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              boxShadow: "0 16px 32px rgba(0,0,0,0.18)",
            }}>
              <div style={{ height: 3, background: selectedPlatform ? `linear-gradient(90deg, ${PLATFORM_COLOR[selectedPlatform]}55, ${PLATFORM_COLOR[selectedPlatform]})` : "var(--accent)" }} />
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    background: selectedPlatform ? `${PLATFORM_COLOR[selectedPlatform]}15` : "var(--bg-elevated)",
                    border: `1px solid ${selectedPlatform ? `${PLATFORM_COLOR[selectedPlatform]}30` : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selectedPlatform && PLATFORM_ICON[selectedPlatform]
                      ? <FA icon={PLATFORM_ICON[selectedPlatform]} style={{ fontSize: 23, color: PLATFORM_COLOR[selectedPlatform] }} />
                      : <FA icon={faLayerGroup} style={{ fontSize: 18, color: "var(--text-muted)" }} />
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 3 }}>
                      {selectedPlatform ?? "Layanan"} · #{selected!.id}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, color: "var(--text-primary)" }}>
                      {selected!.name.replace(/\s*\[.+?\]/, "").trim()}
                    </div>
                  </div>
                </div>

                {/* Jenis layanan dari bracket */}
                {(() => {
                  const m = selected!.name.match(/\[(.+?)\]/);
                  return m ? (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Jenis Layanan</span>
                      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: "var(--yellow)", padding: "8px 12px", background: "var(--yellow-dim)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 8 }}>
                        {m[1]}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                  {isAdmin && (
                    <div style={summaryRowStyle}>
                      <span>Harga<span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 5, fontWeight: 400 }}>/1000 Report</span></span>
                      <strong style={{ color: "var(--green)" }}>{formatIDR(selected!.rate)}/1k</strong>
                    </div>
                  )}
                  <div style={summaryRowStyle}>
                    <span>Limit</span>
                    <strong>1.000</strong>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/services")}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border-light)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  Ganti layanan
                </button>
              </div>
            </div>

            {/* Card Cara Mendapatkan Link/Target */}
            {targetInfo && targetInfo.steps.length > 0 && (
              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--bg-elevated)",
                }}>
                  <FA icon={faCircleInfo} style={{ fontSize: 13, color: "var(--accent)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Cara Mendapatkan {targetInfo.label}
                  </span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {targetInfo.steps.map((step, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{
                          flexShrink: 0,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "var(--accent-dim)", border: "1px solid rgba(200,150,10,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: "var(--accent)",
                          marginTop: 1,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55 }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            </div>
          ) : (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>

            {/* Platform pills */}
            {!loadingSvc && platforms.length > 1 && (
              <div style={{ padding: "12px 14px 0", display: "flex", gap: 5, flexWrap: "wrap" }}>
                {platforms.map((p) => {
                  const active = platform === p;
                  const color  = p === "all" ? null : PLATFORM_COLOR[p];
                  const count  = p === "all" ? services.length : platformCounts[p];
                  return (
                    <button
                      key={p}
                      onClick={() => { setPlatform(p); setPage(1); }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: active ? 600 : 400,
                        border: `1px solid ${active && color ? color + "60" : active ? "var(--accent)" : "var(--border)"}`,
                        background: active && color ? color + "18" : active ? "var(--accent-dim)" : "var(--bg-elevated)",
                        color: active && color ? color : active ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", transition: "all 0.12s", marginBottom: 4,
                      }}
                    >
                      {p === "all" ? "Semua" : p}
                      <span style={{ fontSize: 12, opacity: 0.65 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 12, pointerEvents: "none" }}>
                  <FA icon={faMagnifyingGlass} />
                </span>
                <input
                  type="text" value={search} placeholder="Cari nama atau ID..."
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{
                    width: "100%", padding: "7px 10px 7px 28px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: 13, outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            {/* Count + pagination info */}
            <div style={{ padding: "7px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {loadingSvc ? "Memuat..." : `${filtered.length} layanan`}
                {selected && <span style={{ color: "var(--accent)", marginLeft: 8 }}>· Dipilih #{selected.id}</span>}
              </span>
              {totalPages > 1 && (
                <div style={{ display: "flex", gap: 4 }}>
                  <SmallPageBtn disabled={safePage <= 1}          onClick={() => setPage(p => p - 1)} label="‹" />
                  <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "2px 4px" }}>{safePage}/{totalPages}</span>
                  <SmallPageBtn disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} label="›" />
                </div>
              )}
            </div>

            {/* Service list */}
            <div style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", padding: "8px" }}>
              {loadingSvc ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Memuat layanan...</div>
              ) : paginated.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Tidak ada layanan</div>
              ) : (
                paginated.map((s) => {
                  const isActive = selected?.id === s.id;
                  const plt = detectPlatform(s.name);
                  const pColor = plt ? PLATFORM_COLOR[plt] : "var(--text-muted)";
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectService(s)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        marginBottom: 4,
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        background: isActive ? "var(--accent-dim)" : "var(--bg-elevated)",
                        border: `1px solid ${isActive ? "rgba(200,150,10,0.4)" : "var(--border)"}`,
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-light)"; }}}
                      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}}
                    >
                      {/* Platform icon box */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                        background: plt ? `${pColor}15` : "var(--bg-surface)",
                        border: `1px solid ${plt ? `${pColor}30` : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {plt && PLATFORM_ICON[plt]
                          ? <FA icon={PLATFORM_ICON[plt]} style={{ fontSize: 18, color: pColor }} />
                          : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>?</span>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 500,
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          lineHeight: 1.4, marginBottom: 4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {s.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {isAdmin ? (
                            <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>
                              {formatIDR(s.rate)}<span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 12 }}>/1k</span>
                            </span>
                          ) : (() => {
                            const tp = tokenPriceMap[s.id];
                            return tp?.isActive ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>
                                <FA icon={faCoins} style={{ fontSize: 11 }} />{tp.tokenPrice} token
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tidak tersedia</span>
                            );
                          })()}
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {s.min.toLocaleString()} – {s.max.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* ID */}
                      <span style={{
                        fontSize: 11, fontFamily: "monospace",
                        color: isActive ? "var(--accent)" : "var(--text-muted)",
                        flexShrink: 0,
                      }}>#{s.id}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}

          {/* ── Kanan: Form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {!selected ? (
              /* Empty state */
              <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "48px 24px", textAlign: "center",
              }}>
                <FA icon={faCircleInfo} style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.15 }} />
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 12 }}>Pilih layanan dari daftar kiri</p>
              </div>
            ) : (
              <div style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", overflow: "hidden",
              }}>
                {/* ── Header service ── */}
                <div style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid var(--border)",
                  background: selectedPlatform ? `linear-gradient(135deg, ${PLATFORM_COLOR[selectedPlatform]}0d 0%, transparent 60%)` : "transparent",
                  display: "flex", alignItems: "flex-start", gap: 14,
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: selectedPlatform ? `${PLATFORM_COLOR[selectedPlatform]}18` : "var(--bg-elevated)",
                    border: `1.5px solid ${selectedPlatform ? `${PLATFORM_COLOR[selectedPlatform]}40` : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: selectedPlatform ? `0 0 12px ${PLATFORM_COLOR[selectedPlatform]}22` : "none",
                  }}>
                    {selectedPlatform && PLATFORM_ICON[selectedPlatform]
                      ? <FA icon={PLATFORM_ICON[selectedPlatform]} style={{ fontSize: 23, color: PLATFORM_COLOR[selectedPlatform] }} />
                      : <FA icon={faLayerGroup} style={{ fontSize: 18, color: "var(--text-muted)" }} />
                    }
                  </div>
                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      {selectedPlatform && <span style={{ color: selectedPlatform ? PLATFORM_COLOR[selectedPlatform] : "var(--text-secondary)" }}>{selectedPlatform}</span>}
                      <span style={{ color: "var(--border)" }}>·</span>
                      <span>#{selected.id}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: "var(--text-primary)" }}>
                      {selected.name.replace(/\s*\[.+?\]/, "").trim()}
                    </div>
                    {isAdmin && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--green)", background: "var(--green-dim)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(34,197,94,0.2)" }}>
                          {formatIDR(selected.rate)}<span style={{ fontWeight: 400, fontSize: 11, opacity: 0.7 }}>/1k</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={clearSelected}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 6px", borderRadius: 6, flexShrink: 0, transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}
                  >
                    <FA icon={faXmark} style={{ fontSize: 13 }} />
                  </button>
                </div>

                {/* Description */}
                {selected.description && (
                  <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.06)" }}>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {selected.description}
                    </p>
                  </div>
                )}

                {/* ── Form ── */}
                <div style={{ padding: "24px" }}>

                  {/* Link — dinamis per layanan */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={formLabel}>{targetInfo?.label ?? "Link / Username Target"}</label>
                    <input type="text" value={link}
                      placeholder={targetInfo?.placeholder ?? "https://... atau @username"}
                      onChange={e => setLink(e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"} />
                    <p style={formHint}>{targetInfo?.hint ?? "Masukkan link atau username target."}</p>
                  </div>

                  {/* Quantity */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={formLabel}>Jumlah Report</label>
                    </div>
                    <input type="number" value={1000} min={1000} max={1000} step={1}
                      disabled
                      readOnly
                      style={{ ...inputStyle, borderColor: "var(--border)", opacity: 0.6, cursor: "not-allowed" }} />
                    {quantity && !isValidQty && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 13, color: "var(--red)" }}>
                        <FA icon={faTriangleExclamation} style={{ fontSize: 12 }} />
                        Harus antara {selected.min.toLocaleString()} – {selected.max.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Komentar */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={formLabel}>
                      Komentar <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: 13 }}>(opsional)</span>
                    </label>
                    <textarea value={comments} placeholder="Isi jika diperlukan..."
                      onChange={e => setComments(e.target.value)} rows={3}
                      style={{ ...inputStyle, resize: "none", lineHeight: 1.7 }}
                      onFocus={e => e.target.style.borderColor = "rgba(200,150,10,0.6)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </div>

                  {/* Token / IDR summary */}
                  {isAdmin && estimatedCost !== null && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: 10, marginBottom: 20, background: "var(--green-dim)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>Estimasi biaya</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>{formatIDR(estimatedCost)}</span>
                    </div>
                  )}


                  {/* Submit */}
                  {(() => {
                    const disabled = !isValidQty || submitting;
                    return (
                      <button onClick={handleSubmit} disabled={disabled} style={{
                        width: "100%", padding: "14px", borderRadius: 10, border: "none",
                        background: disabled ? "var(--bg-elevated)" : "linear-gradient(135deg, #B8840A 0%, #E0A80C 50%, #B8840A 100%)",
                        color: disabled ? "var(--text-muted)" : "#0C0B08",
                        fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
                        cursor: disabled ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: disabled ? "none" : "0 4px 20px rgba(200,150,10,0.35)",
                        transition: "all 0.15s",
                      }}>
                        {submitting
                          ? <><FA icon={faRotate} style={{ fontSize: 14, animation: "spin 0.7s linear infinite" }} /> Memproses...</>
                          : <><FA icon={faArrowRight} style={{ fontSize: 14 }} /> Mulai Sekarang</>
                        }
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{createOrderCss}</style>
    </>
  );

}

const formLabel: React.CSSProperties = {
  display: "block", fontSize: 14, fontWeight: 600,
  color: "var(--text-primary)", marginBottom: 8,
};

const formHint: React.CSSProperties = {
  fontSize: 13, color: "var(--text-secondary)",
  marginTop: 6, lineHeight: 1.5,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: 10, color: "var(--text-primary)",
  fontSize: 15, outline: "none", transition: "border-color 0.15s",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--bg-elevated)",
  color: "var(--text-secondary)",
  fontSize: 14,
};

const createOrderCss = `
  .create-order-grid.checkout-mode {
    grid-template-columns: 360px minmax(0, 1fr);
  }

  .create-order-grid.picker-mode {
    grid-template-columns: minmax(0, 1fr) 360px;
  }

  .checkout-summary-card {
    position: sticky;
    top: 88px;
  }

  @media (max-width: 920px) {
    .create-order-grid.checkout-mode,
    .create-order-grid.picker-mode {
      grid-template-columns: 1fr;
    }

    .checkout-summary-card {
      position: static;
    }
  }
`;


function SmallPageBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 22, height: 22, borderRadius: 4, border: "1px solid var(--border)",
      background: "var(--bg-elevated)", color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
      fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{label}</button>
  );
}

function ReceiptPage({ receipt, onBack, onNew }: { receipt: any; onBack: () => void; onNew: () => void }) {
  const { order: o, service, tokenCost } = receipt;
  const platform = service ? detectPlatform(service.name) : null;
  const pColor   = platform ? PLATFORM_COLOR[platform] ?? "#6366f1" : "#6366f1";
  const pIcon    = platform ? ({
    Instagram: faInstagram, TikTok: faTiktok, YouTube: faYoutube,
    Twitter: faXTwitter, Facebook: faFacebook, Telegram: faTelegram,
  } as Record<string, any>)[platform] : null;

  const statusColor: Record<string, string> = {
    pending: "var(--yellow)", processing: "var(--blue)", in_progress: "var(--blue)",
    completed: "var(--green)", cancelled: "var(--red)", partial: "var(--yellow)",
  };
  const statusLabel: Record<string, string> = {
    pending: "Menunggu", processing: "Diproses", in_progress: "Berjalan",
    completed: "Selesai", cancelled: "Dibatalkan", partial: "Sebagian",
  };
  const stColor = statusColor[o?.status] ?? "var(--text-secondary)";

  const formatDate = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* Header sukses */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
          background: "var(--green-dim)", border: "2px solid rgba(34,197,94,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FA icon={faCircleCheck} style={{ fontSize: 30, color: "var(--green)" }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>Tugas Berhasil Dibuat!</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Order #{o?.id} telah dikirim dan sedang diproses.</p>
      </div>

      {/* Receipt card */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 16 }}>

        {/* Accent + header */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${pColor}55, ${pColor})` }} />
        <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `${pColor}18`, border: `1.5px solid ${pColor}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {pIcon ? <FA icon={pIcon} style={{ fontSize: 20, color: pColor }} /> : <FA icon={faLayerGroup} style={{ fontSize: 18, color: pColor }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{platform ?? "Layanan"} · #{o?.service_id}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {service?.name?.replace(/\s*\[.+?\]/, "").trim() ?? `Layanan #${o?.service_id}`}
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 5, background: `${stColor}18`, color: stColor, border: `1px solid ${stColor}30`, flexShrink: 0 }}>
            {statusLabel[o?.status] ?? o?.status}
          </span>
        </div>

        {/* Detail rows */}
        <div style={{ padding: "4px 0" }}>
          {[
            { label: "ID Tugas",          value: `#${o?.id}`,                                        icon: faHashtag,          color: "var(--accent)" },
            { label: "Link / Target",    value: o?.link ?? "—",                                     icon: faArrowUpRightFromSquare, color: "var(--text-primary)", link: o?.link },
            { label: "Jumlah Report",    value: `${o?.quantity?.toLocaleString("id-ID")} report`,   icon: faClipboardList,    color: "var(--text-primary)" },
            { label: "Start Count",   value: o?.start_count != null ? o?.start_count?.toLocaleString("id-ID") : "—", icon: faRotateLeft, color: "var(--text-secondary)" },
            { label: "Sisa",          value: o?.remains     != null ? o?.remains?.toLocaleString("id-ID")     : "—", icon: faRotate,     color: "var(--text-secondary)" },
            // Admin: tampilkan biaya IDR
            ...(o?.charge != null && tokenCost === null
                ? [
                    { label: "Harga / 1k",    value: new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(o.rate),   icon: faCoins, color: "var(--text-secondary)" },
                    { label: "Total Biaya",   value: new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(o.charge), icon: faCoins, color: "var(--green)" },
                  ]
                : []
            ),
            { label: "Dibuat",        value: o?.created_at ? formatDate(o.created_at) : "—",                                                                   icon: faCalendar, color: "var(--text-secondary)" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FA icon={row.icon} style={{ fontSize: 12, color: "var(--text-secondary)", width: 14, textAlign: "center" }} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
              </div>
              {row.link
                ? <a href={row.link} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</a>
                : <span style={{ fontSize: 13, fontWeight: 600, color: row.color, maxWidth: 220, textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: "11px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)", background: "var(--bg-elevated)",
          color: "var(--text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-light)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
          <FA icon={faClipboardList} style={{ marginRight: 7, fontSize: 12 }} />
          Lihat Riwayat Tugas
        </button>
        <button onClick={onNew} style={{
          flex: 1, padding: "11px", borderRadius: "var(--radius-sm)",
          border: "1px solid rgba(200,150,10,0.35)", background: "var(--accent-dim)",
          color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(200,150,10,0.18)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--accent-dim)"}>
          <FA icon={faLayerGroup} style={{ marginRight: 7, fontSize: 12 }} />
          Buat Tugas Baru
        </button>
      </div>
    </div>
  );
}
