import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { FA } from "../components/Icon";
import {
  faGauge, faLayerGroup, faClipboardList, faCreditCard, faBolt, faBook,
  faCircleInfo, faCircleCheck, faTriangleExclamation,
  faLink, faArrowRight, faRotate, faDatabase,
  faPaperPlane, faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram, faTiktok, faYoutube, faXTwitter, faFacebook, faTelegram,
} from "@fortawesome/free-brands-svg-icons";
import { PLATFORM_COLOR } from "../lib/platform";

const SECTIONS = [
  { id: "pengantar",    label: "Pengantar",       icon: faBook          },
  { id: "dashboard",   label: "Beranda",        icon: faGauge         },
  { id: "buat-order",  label: "Buat Tugas",       icon: faBolt          },
  { id: "services",    label: "Layanan",         icon: faLayerGroup    },
  { id: "orders",      label: "Tugas",           icon: faClipboardList },
  { id: "transaksi",   label: "Transaksi",     icon: faCreditCard    },
  { id: "sync",        label: "Sinkronisasi Data",icon: faDatabase      },
  { id: "platform",    label: "Platform",         icon: faLink          },
];

const PLATFORMS = [
  { name: "Instagram", icon: faInstagram, count: 5,  examples: ["https://instagram.com/namaakun", "@namaakun"] },
  { name: "TikTok",    icon: faTiktok,    count: 4,  examples: ["https://tiktok.com/@namaakun",   "@namaakun"] },
  { name: "YouTube",   icon: faYoutube,   count: 4,  examples: ["https://youtube.com/@namakanal", "https://youtu.be/ID"] },
  { name: "Twitter",   icon: faXTwitter,  count: 4,  examples: ["https://x.com/namaakun",         "@namaakun"] },
  { name: "Facebook",  icon: faFacebook,  count: 6,  examples: ["https://facebook.com/halaman",   "namahalaman"] },
  { name: "Telegram",  icon: faTelegram,  count: 6,  examples: ["https://t.me/namachannel",       "@namachannel"] },
];

const ORDER_STATUSES = [
  { s: "pending",     color: "var(--yellow)", desc: "Menunggu diproses oleh sistem" },
  { s: "processing",  color: "var(--blue)",   desc: "Sedang diproses" },
  { s: "in_progress", color: "var(--blue)",   desc: "Sedang berjalan" },
  { s: "completed",   color: "var(--green)",  desc: "Selesai 100%" },
  { s: "partial",     color: "var(--yellow)", desc: "Selesai sebagian, sisa direfund" },
  { s: "cancelled",   color: "var(--red)",    desc: "Dibatalkan" },
  { s: "refunded",    color: "var(--text-muted)", desc: "Dana dikembalikan ke saldo" },
];

// ════════════════════════════════════════════════════════════════════════════
// USER DOCS — panduan ringkas
// ════════════════════════════════════════════════════════════════════════════
function UserDocsPage() {
  const navigate = useNavigate();

  const guides = [
    {
      icon: faBolt, color: "#3b82f6",
      title: "Buat Tugas",
      desc: "Pilih layanan dari katalog lalu isi detail target. Tugas akan langsung dikirim saat konfirmasi berhasil.",
      steps: ["Buka halaman Layanan", "Klik Mulai Sekarang", "Isi link/username target", "Konfirmasi & kirim"],
      action: { label: "Lihat Layanan", to: "/services" },
    },
    {
      icon: faClipboardList, color: "#22c55e",
      title: "Riwayat Tugas",
      desc: "Pantau semua tugas yang pernah Anda buat. Lihat status, jumlah unit selesai, dan sisa progres.",
      steps: ["Buka Riwayat Tugas", "Filter berdasarkan status", "Pantau progres setiap tugas"],
      action: { label: "Lihat Riwayat", to: "/orders" },
    },
    {
      icon: faLayerGroup, color: "#a855f7",
      title: "Layanan",
      desc: "Katalog semua layanan SMM yang tersedia. Temukan layanan yang sesuai dan mulai tugas dengan mudah.",
      steps: ["Filter berdasarkan platform", "Cari layanan yang diinginkan", "Klik Mulai Sekarang"],
      action: { label: "Jelajahi Layanan", to: "/services" },
    },
  ];

  const statusInfo = [
    { s: "pending",     color: "#eab308", desc: "Tugas diterima, menunggu antrian" },
    { s: "processing",  color: "#3b82f6", desc: "Sedang diproses sistem" },
    { s: "in_progress", color: "#3b82f6", desc: "Sedang berjalan" },
    { s: "completed",   color: "#22c55e", desc: "Selesai 100%" },
    { s: "partial",     color: "#eab308", desc: "Selesai sebagian, sisa direfund" },
    { s: "cancelled",   color: "#ef4444", desc: "Dibatalkan" },
  ];

  return (
    <>
      <div style={{ animation: "slideUp 0.4s ease-out" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <FA icon={faBook} style={{ color: "var(--accent)", fontSize: 18 }} />
              Dokumentasi
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Panduan penggunaan platform SOMERE untuk kelancaran tugas Anda</p>
          </div>
        </div>

        {/* Guide cards */}
        <div className="user-guide-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 28 }}>
          {guides.map((g, idx) => (
            <div
              key={g.title}
              className="guide-card"
              style={{
                background: "linear-gradient(145deg, var(--bg-surface) 0%, #161924 100%)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                position: "relative",
                display: "flex", flexDirection: "column",
                animation: "slideUp 0.35s ease-out both",
                animationDelay: `${idx * 0.08}s`
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-4px)";
                el.style.borderColor = g.color;
                el.style.boxShadow = `0 8px 24px -4px ${g.color}15`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "none";
                el.style.borderColor = "var(--border)";
                el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(to right, ${g.color}40, ${g.color})` }} />

              <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                {/* Card Title Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${g.color}12`, border: `1.5px solid ${g.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <FA icon={g.icon} style={{ fontSize: 16, color: g.color }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{g.title}</span>
                </div>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 18 }}>{g.desc}</p>

                {/* Steps List — flex: 1 agar tombol selalu rata bawah */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, background: "rgba(255,255,255,0.015)", padding: "12px 14px", borderRadius: 8, border: "1px dashed var(--border)" }}>
                  {g.steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: `${g.color}18`, border: `1px solid ${g.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: g.color, flexShrink: 0
                      }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 13, color: "var(--text-primary)", opacity: 0.9 }}>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Action button — selalu di bawah */}
                <button
                  onClick={() => navigate(g.action.to)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    background: `${g.color}14`, border: `1px solid ${g.color}25`,
                    color: g.color, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = g.color; e.currentTarget.style.color = "#000"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${g.color}14`; e.currentTarget.style.color = g.color; }}
                >
                  <span>{g.action.label}</span>
                  <FA icon={faArrowRight} style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Status tugas */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--bg-elevated)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(200,150,10,0.1)", border: "1px solid rgba(200,150,10,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FA icon={faClockRotateLeft} style={{ fontSize: 12, color: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Arti Status Tugas</span>
          </div>
          <div className="user-status-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {statusInfo.map((s, i) => (
              <div key={s.s} className="user-status-cell" style={{
                padding: "18px",
                borderRight: i % 3 !== 2 ? "1px solid var(--border)" : "none",
                borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                background: "linear-gradient(180deg, var(--bg-surface) 0%, rgba(26,29,46,0.1) 100%)",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(180deg, var(--bg-surface) 0%, rgba(26,29,46,0.1) 100%)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="pulse-dot" style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${s.color}`
                  }} />
                  <code style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: s.color,
                    fontWeight: 700,
                    background: `${s.color}10`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: `1px solid ${s.color}20`
                  }}>{s.s.toUpperCase()}</code>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FA icon={faCircleInfo} style={{ fontSize: 12, color: "var(--blue)" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Tips & Petunjuk Penting</span>
          </div>
          <div className="user-tips-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { icon: faCircleCheck,   color: "#22c55e", text: "Status partial artinya tugas selesai sebagian dan sisa progres yang belum selesai akan dikembalikan otomatis." },
              { icon: faPaperPlane,    color: "#3b82f6", text: "Tugas yang sudah dikirim tidak bisa dibatalkan kecuali admin mengaktifkan fitur cancel untuk layanan tersebut." },
              { icon: faTriangleExclamation, color: "#eab308", text: "Pastikan link/username target yang Anda masukkan benar sebelum mengirim tugas." },
            ].map((tip, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-sm)",
                border: `1px solid var(--border)`,
                borderLeft: `3px solid ${tip.color}`,
                transition: "transform 0.15s ease",
              }}
              className="tip-item"
              onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: `${tip.color}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <FA icon={tip.icon} style={{ fontSize: 12, color: tip.color }} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .pulse-dot {
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .user-guide-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .user-tips-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .user-guide-grid {
            grid-template-columns: 1fr !important;
          }
          .user-status-grid {
            grid-template-columns: 1fr !important;
          }
          .user-status-cell {
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
          }
          .user-status-cell:last-child {
            border-bottom: none !important;
          }
          .user-tips-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN DOCS
// ════════════════════════════════════════════════════════════════════════════
export default function DocsPage() {
  const isAdmin = useAuthStore(s => s.isAdmin)();
  if (!isAdmin) return <UserDocsPage />;

  const [activeSection, setActiveSection] = useState("pengantar");

  function scrollTo(id: string) {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <>
      <div className="admin-docs-layout" style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 28, alignItems: "start", animation: "slideUp 0.4s ease-out" }}>

        {/* ── Sidebar ── */}
        <div className="admin-docs-sidebar" style={{
          position: "sticky", top: "calc(var(--topbar-height) + 24px)",
          background: "linear-gradient(to bottom, var(--bg-surface) 0%, #151824 100%)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
        }}>
          <div className="admin-docs-sidebar-title" style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.015)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Daftar Isi
            </span>
          </div>
          <nav className="admin-docs-nav" style={{ padding: "8px" }}>
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    textAlign: "left", background: active ? "var(--accent-dim)" : "transparent",
                    border: "none", borderRadius: "var(--radius-sm)",
                    borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer", marginBottom: 2,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    paddingLeft: active ? 12 : 10,
                  }}
                  className={active ? "nav-btn nav-active" : "nav-btn"}
                >
                  <FA icon={s.icon} style={{ fontSize: 13, width: 14, textAlign: "center", flexShrink: 0, color: active ? "var(--accent)" : "var(--text-muted)" }} />
                  <span style={{ flex: 1 }}>{s.label}</span>
                  {active && (
                    <span style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      boxShadow: "0 0 6px var(--accent)"
                    }} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Konten ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>

          {/* ── Pengantar ── */}
          <Section id="pengantar">
            <div className="admin-intro-hero" style={{
              background: "linear-gradient(135deg, rgba(200,150,10,0.15) 0%, rgba(22,25,37,0.7) 100%)",
              border: "1px solid rgba(200,150,10,0.25)",
              borderRadius: "var(--radius)",
              padding: "32px",
              marginBottom: 28,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
            }}>
              <div style={{
                position: "absolute",
                top: "-20%",
                right: "-10%",
                width: 150,
                height: 150,
                background: "var(--accent)",
                filter: "blur(60px)",
                opacity: 0.12,
                borderRadius: "50%",
                pointerEvents: "none"
              }} />
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#000",
                  boxShadow: "0 4px 12px rgba(200,150,10,0.35)"
                }}>S</div>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>SOMERE</h1>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Social Media Report Control Center</span>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 580 }}>
                Platform manajemen layanan pelaporan konten media sosial terpadu yang terintegrasi penuh dengan provider SMM Panel.
                Buat tugas secara batch, monitor status real-time, kelola saldo limitasi token, dan analisis mutasi data dalam satu pusat kendali.
              </p>
            </div>

            <div className="admin-intro-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { icon: faBolt,          color: "var(--accent)",  label: "Buat Tugas",    desc: "Pilih jenis layanan, masukan target URL/username, dan jadwalkan pelaporan instan." },
                { icon: faClipboardList, color: "var(--blue)",    label: "Pantau Progres",  desc: "Sistem pooling status otomatis untuk mendapatkan persentase sisa laporan dan status real-time." },
                { icon: faCreditCard,    color: "var(--green)",   label: "Mutasi Saldo",  desc: "Lacak riwayat debit dan kredit token untuk transparansi operasional sistem." },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: "20px",
                  background: "linear-gradient(145deg, var(--bg-surface) 0%, #151824 100%)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                }}
                className="tip-item"
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "var(--border-light)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${item.color}12`, border: `1.5px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                    <FA icon={item.icon} style={{ fontSize: 15 }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          <SectionDivider />

          {/* ── Dashboard ── */}
          <Section id="dashboard">
            <SectionTitle icon={faGauge} color="var(--accent)">Beranda</SectionTitle>
            <Lead>Halaman utama dengan ringkasan aktivitas tugas terkini.</Lead>

            <Grid cols={2}>
              <InfoCard title="Stat Cards" desc="Menampilkan total tugas, selesai, aktif, dan dibatalkan dari 15 tugas terakhir (satu halaman)." />
              <InfoCard title="Tugas Terbaru" desc="8 tugas terakhir beserta detail ID, service, target, jumlah, biaya, dan status." />
              <InfoCard title="Status Tugas" desc="Grafik bar persentase per status dari data yang dimuat." />
              <InfoCard title="Total Pengeluaran" desc="Akumulasi charge dari semua tugas yang ditampilkan di halaman ini." />
            </Grid>

            <Callout type="info">
              Angka di stat cards diambil dari <strong>15 tugas terakhir</strong>, bukan keseluruhan data. Untuk jumlah total lihat halaman <strong>Tugas</strong>.
            </Callout>
          </Section>

          <SectionDivider />

          {/* ── Buat Tugas ── */}
          <Section id="buat-order">
            <SectionTitle icon={faBolt} color="var(--accent)">Buat Tugas</SectionTitle>
            <Lead>Halaman untuk membuat tugas baru ke sistem.</Lead>

            <SubTitle>Alur Pemesanan</SubTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { n: 1, text: "Filter platform menggunakan pill buttons, atau cari langsung dengan keyword/ID" },
                { n: 2, text: "Klik layanan yang diinginkan dari daftar kiri" },
                { n: 3, text: "Isi Link/Username target, jumlah, dan komentar (opsional)" },
                { n: 4, text: "Periksa estimasi biaya yang muncul otomatis" },
                { n: 5, text: "Klik Buat Tugas — order langsung dikirim" },
              ].map((step) => (
                <div key={step.n} style={{ display: "flex", alignItems: "flex-start", gap: 14 }} className="tip-item">
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid rgba(200,150,10,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                    {step.n}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, paddingTop: 3 }}>{step.text}</p>
                </div>
              ))}
            </div>

            <SubTitle>Format Input Target</SubTitle>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
              Field <Code>Link / Username Target</Code> menerima URL lengkap maupun username. Berikut format yang direkomendasikan per platform:
            </p>
            <div className="admin-platforms-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
              {PLATFORMS.map((p) => (
                <div key={p.name} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                }} className="tip-item">
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: `${PLATFORM_COLOR[p.name]}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <FA icon={p.icon} style={{ fontSize: 16, color: PLATFORM_COLOR[p.name] }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{p.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.examples.map((ex) => <Code key={ex}>{ex}</Code>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SubTitle>Estimasi Biaya</SubTitle>
            <div style={{ padding: "16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>Formula kalkulasi:</div>
              <div style={{ fontSize: 15, fontFamily: "monospace", color: "var(--text-primary)", letterSpacing: "0.02em" }}>
                Biaya = <span style={{ color: "var(--accent)", fontWeight: 700 }}>⌈</span> (Jumlah ÷ 1.000) × Rate <span style={{ color: "var(--accent)", fontWeight: 700 }}>⌉</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                Contoh: 1.000 unit × Rp 55.000/1k = <strong style={{ color: "var(--green)" }}>Rp 55.000</strong>
              </div>
            </div>

            <Callout type="warning">
              Pastikan saldo mencukupi sebelum membuat tugas. Saldo ditampilkan di sidebar kiri atas (refresh tiap 60 detik).
            </Callout>
          </Section>

          <SectionDivider />

          {/* ── Services ── */}
          <Section id="services">
            <SectionTitle icon={faLayerGroup} color="var(--blue)">Layanan</SectionTitle>
            <Lead>Katalog layanan yang tersimpan di database lokal.</Lead>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[
                { label: "ID",        desc: "Nomor identifikasi layanan unik dari provider." },
                { label: "Platform",  desc: "Ikon platform sosial yang dideteksi otomatis berdasarkan nama layanan." },
                { label: "Layanan",   desc: "Nama lengkap layanan beserta sub-detail deskripsi jenis pelaporan." },
                { label: "Rate/1k",   desc: "Harga dalam denominasi Rupiah per 1.000 kuantitas unit laporan." },
                { label: "Min – Max", desc: "Batas minimum dan maksimum pemesanan per tugas." },
              ].map((row) => (
                <div key={row.label} className="admin-desc-row" style={{ display: "flex", gap: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <div className="admin-desc-label" style={{ padding: "10px 14px", minWidth: 120, background: "var(--bg-surface)", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
                    <Code>{row.label}</Code>
                  </div>
                  <div style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>{row.desc}</div>
                </div>
              ))}
            </div>

            <Callout type="info">
              Data services disimpan lokal. Gunakan tombol <strong>Sinkronkan Layanan</strong> di halaman ini atau ikon ⟳ di sidebar untuk memperbarui .
            </Callout>
          </Section>

          <SectionDivider />

          {/* ── Tugas ── */}
          <Section id="orders">
            <SectionTitle icon={faClipboardList} color="var(--blue)">Tugas</SectionTitle>
            <Lead>Riwayat semua tugas dengan pagination 15 per halaman.</Lead>

            <SubTitle>Status Tugas</SubTitle>
            <div className="admin-statuses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
              {ORDER_STATUSES.map((item) => (
                <div key={item.s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }} className="tip-item">
                  <span className="pulse-dot" style={{ width: 9, height: 9, borderRadius: "50%", background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: "monospace" }}>{item.s.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <SubTitle>Kolom Sisa (Remains)</SubTitle>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
              Kolom <Code>Sisa</Code> menampilkan jumlah yang belum terpenuhi. Nilainya <Code>—</Code> saat order belum mulai diproses.
              Jika order <Code>partial</Code>, nilai sisa yang tersisa akan direfund ke saldo.
            </p>

            <Callout type="info">
              Gunakan <strong>Sinkronkan Status Aktif</strong> untuk memperbarui status tugas yang masih <Code>pending</Code> atau <Code>in_progress</Code> tanpa mengambil ulang semua data.
            </Callout>
          </Section>

          <SectionDivider />

          {/* ── Transaksi ── */}
          <Section id="transaksi">
            <SectionTitle icon={faCreditCard} color="var(--green)">Transaksi</SectionTitle>
            <Lead>Riwayat mutasi saldo akun.</Lead>

            <Grid cols={2}>
              <div style={{ padding: "20px", background: "var(--green-dim)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "var(--radius)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, color: "var(--green)" }}>▲</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", letterSpacing: "0.02em" }}>Credit</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>Penambahan saldo — terjadi saat admin menyetujui request token pengguna.</p>
              </div>
              <div style={{ padding: "20px", background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, color: "var(--red)" }}>▼</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red)", letterSpacing: "0.02em" }}>Debit</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>Pengurangan saldo — terjadi setiap kali tugas pelaporan baru berhasil dibuat.</p>
              </div>
            </Grid>

            <Callout type="info" style={{ marginTop: 16 }}>
              Sync transaksi bersifat <strong>incremental</strong> — hanya mengambil ID yang lebih baru dari data terakhir di database, sehingga lebih efisien.
            </Callout>
          </Section>

          <SectionDivider />

          {/* ── Sync ── */}
          <Section id="sync">
            <SectionTitle icon={faRotate} color="var(--yellow)">Sinkronisasi Data</SectionTitle>
            <Lead>SORE menyimpan data secara lokal untuk mengurangi panggilan API berulang.</Lead>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Sinkronkan Layanan",      freq: "Manual / On-demand", desc: "Ambil semua layanan, upsert ke database lokal." },
                { label: "Sinkronkan Semua Tugas",   freq: "Manual",             desc: "Ambil semua halaman tugas." },
                { label: "Sinkronkan Status Aktif",  freq: "Disarankan rutin",   desc: "Update hanya tugas berstatus pending/processing/in_progress." },
                { label: "Sinkronkan Transaksi",     freq: "Incremental",        desc: "Ambil transaksi baru saja (ID > terakhir di database)." },
                { label: "Saldo",              freq: "Cache 60 detik",     desc: "Selalu live dari API, di-cache 60 detik untuk mencegah rate limit." },
              ].map((item) => (
                <div key={item.label} className="admin-sync-row" style={{ display: "flex", gap: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <div className="admin-sync-label" style={{ padding: "12px 14px", minWidth: 170, background: "var(--bg-surface)", borderRight: "1px solid var(--border)", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{item.freq}</div>
                  </div>
                  <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <Callout type="warning">
              Jika server mengembalikan error <Code>429 Too Many Requests</Code>, tunggu beberapa detik sebelum melakukan sync ulang.
            </Callout>
          </Section>

          <SectionDivider />

          {/* ── Platform ── */}
          <Section id="platform">
            <SectionTitle icon={faLink} color="var(--accent)">Platform yang Didukung</SectionTitle>
            <Lead>Layanan SORE terbagi dalam platform-platform media sosial berikut:</Lead>

            <div className="admin-platforms-list-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {PLATFORMS.map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: "18px 20px",
                    background: "linear-gradient(145deg, var(--bg-surface) 0%, #151824 100%)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    borderTop: `3px solid ${PLATFORM_COLOR[p.name]}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    transition: "all 0.2s",
                  }}
                  className="tip-item"
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = PLATFORM_COLOR[p.name];
                    e.currentTarget.style.boxShadow = `0 6px 20px -4px ${PLATFORM_COLOR[p.name]}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${PLATFORM_COLOR[p.name]}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <FA icon={p.icon} style={{ fontSize: 16, color: PLATFORM_COLOR[p.name] }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{p.count}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>layanan aktif</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
      <style>{`
        .pulse-dot {
          animation: pulse 1.5s infinite ease-in-out;
        }
        .nav-btn:hover {
          background: var(--bg-hover) !important;
          color: var(--text-primary) !important;
          padding-left: 14px !important;
        }
        .tip-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 800px) {
          .admin-docs-layout {
            grid-template-columns: 1fr !important;
          }
          .admin-docs-sidebar {
            position: relative !important;
            top: 0 !important;
          }
          .admin-docs-sidebar-title {
            display: none !important;
          }
          .admin-docs-nav {
            display: flex !important;
            overflow-x: auto !important;
            gap: 4px !important;
            padding: 6px 8px !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .admin-docs-nav::-webkit-scrollbar {
            display: none;
          }
          .admin-docs-nav .nav-btn {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            width: auto !important;
            padding: 8px 14px !important;
            border-left: none !important;
            font-size: 12px !important;
            border-radius: 20px !important;
            gap: 6px !important;
          }
          .admin-docs-nav .nav-btn:hover {
            padding-left: 14px !important;
          }
          .admin-docs-nav .nav-active {
            background: var(--accent-dim) !important;
            border: 1px solid rgba(200,150,10,0.3) !important;
          }
          .admin-intro-hero {
            padding: 20px !important;
          }
          .admin-intro-grid,
          .admin-platforms-list-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-platforms-grid,
          .admin-statuses-grid,
          .admin-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-desc-row,
          .admin-sync-row {
            flex-direction: column !important;
          }
          .admin-desc-label,
          .admin-sync-label {
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
            min-width: unset !important;
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}

/* ── Komponen lokal ── */

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} style={{ padding: "24px 0" }}>{children}</section>;
}

function SectionDivider() {
  return <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />;
}

function SectionTitle({ icon, color, children }: { icon: any; color: string; children: React.ReactNode }) {
  return (
    <h2 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: `${color}12`,
        border: `1.5px solid ${color}25`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: color
      }}>
        <FA icon={icon} style={{ fontSize: 13 }} />
      </div>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 24, marginBottom: 12 }}>{children}</h3>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>{children}</p>;
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 20 }}>{children}</div>;
}

function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{
      padding: "16px",
      background: "linear-gradient(145deg, var(--bg-surface) 0%, rgba(26,29,46,0.2) 100%)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

const calloutConfig = {
  info:    { bg: "var(--blue-dim)",   border: "rgba(59,130,246,0.15)",  color: "var(--blue)",   icon: faCircleInfo },
  success: { bg: "var(--green-dim)",  border: "rgba(34,197,94,0.15)",   color: "var(--green)",  icon: faCircleCheck },
  warning: { bg: "var(--yellow-dim)", border: "rgba(234,179,8,0.15)",   color: "var(--yellow)", icon: faTriangleExclamation },
};

function Callout({ type, children, style }: { type: keyof typeof calloutConfig; children: React.ReactNode; style?: React.CSSProperties }) {
  const c = calloutConfig[type];
  return (
    <div style={{
      padding: "14px 18px",
      borderRadius: "var(--radius)",
      background: c.bg,
      border: `1px solid ${c.border}`,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      ...style
    }}>
      <FA icon={c.icon} style={{ fontSize: 14, color: c.color, marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{children}</span>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ fontSize: 12, fontFamily: "monospace", background: "var(--bg-elevated)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 4, color: "var(--text-primary)" }}>
      {children}
    </code>
  );
}
