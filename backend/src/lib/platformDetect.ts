const PLATFORMS: [string, string[]][] = [
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

export function detectPlatformBackend(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [platform, keywords] of PLATFORMS) {
    if (keywords.some(k => lower.includes(k))) return platform;
  }
  return null;
}

export function detectReportReasonBackend(name: string): string {
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
