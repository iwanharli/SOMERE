export const PLATFORM_COLOR: Record<string, string> = {
  Instagram: "#e1306c",
  TikTok:    "#e0e0e0",
  YouTube:   "#ff0000",
  Twitter:   "#1da1f2",
  Facebook:  "#1877f2",
  LinkedIn:  "#0a66c2",
  Telegram:  "#26a5e4",
  Spotify:   "#1db954",
  Threads:   "#aaa",
  Snapchat:  "#fffc00",
};

// Urutan penting: lebih spesifik dulu, baru generic
const EXACT: [string, string[]][] = [
  ["Instagram", ["instagram"]],
  ["TikTok",    ["tiktok", "tik tok"]],
  ["YouTube",   ["youtube"]],
  ["Twitter",   ["twitter", "twitter/x"]],
  ["Facebook",  ["facebook"]],
  ["LinkedIn",  ["linkedin"]],
  ["Telegram",  ["telegram"]],
  ["Spotify",   ["spotify"]],
  ["Threads",   ["threads"]],
  ["Snapchat",  ["snapchat"]],
];

export function detectPlatform(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [platform, keywords] of EXACT) {
    if (keywords.some((k) => lower.includes(k))) return platform;
  }
  return null;
}

// ── Tipe layanan berdasarkan target laporan ───────────────────────────────────
export const SERVICE_TYPES: Record<string, { label: string; color: string }> = {
  akun:     { label: "Akun / Profil",   color: "#6366f1" },
  postingan:{ label: "Postingan",       color: "#e1306c" },
  video:    { label: "Video / Reels",   color: "#ff0000" },
  saluran:  { label: "Saluran & Grup",  color: "#26a5e4" },
  lainnya:  { label: "Lainnya",         color: "#8b8fa8" },
};

// ── Alasan/masalah laporan ────────────────────────────────────────────────────
export const REPORT_REASONS: Record<string, { label: string; color: string }> = {
  penipuan:  { label: "Penipuan & Scam",    color: "#ef4444" },
  dewasa:    { label: "Konten Dewasa",       color: "#ec4899" },
  kebencian: { label: "Kebencian & SARA",    color: "#f97316" },
  kekerasan: { label: "Kekerasan",           color: "#dc2626" },
  pelecehan: { label: "Pelecehan & Bully",   color: "#8b5cf6" },
  palsu:     { label: "Akun Palsu & Bot",    color: "#6366f1" },
  lainnya:   { label: "Lainnya",             color: "#8b8fa8" },
};

export function detectReportReason(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("scam") || lower.includes("spam") || lower.includes("fraud") || lower.includes("phishing") || lower.includes("misleading") || lower.includes("penipuan"))
    return "penipuan";
  if (lower.includes("nudity") || lower.includes("sexual") || lower.includes("pornograph") || lower.includes("adult") || lower.includes("dewasa"))
    return "dewasa";
  if (lower.includes("hate speech") || lower.includes("symbol") || lower.includes("sara"))
    return "kebencian";
  if (lower.includes("violen") || lower.includes("dangerous") || lower.includes("repulsive") || lower.includes("graphic") || lower.includes("copyright") || lower.includes("inappropriate"))
    return "kekerasan";
  if (lower.includes("harass") || lower.includes("bully") || lower.includes("abuse") || lower.includes("threat"))
    return "pelecehan";
  if (lower.includes("fake") || lower.includes("bot") || lower.includes("impersonat") || lower.includes("palsu") || lower.includes("underage"))
    return "palsu";
  return "lainnya";
}

// Deteksi tipe berdasarkan nama layanan
export function detectServiceType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("report account") || lower.includes("report user") || lower.includes("report page"))
    return "akun";
  if (lower.includes("report post") || lower.includes("report tweet") || lower.includes("report reels/video") && lower.includes("post"))
    return "postingan";
  if (lower.includes("report video") || lower.includes("report reels"))
    return "video";
  if (lower.includes("report channel") || lower.includes("report group"))
    return "saluran";
  // Tweet dianggap postingan
  if (lower.includes("report tweet"))
    return "postingan";
  return "lainnya";
}
