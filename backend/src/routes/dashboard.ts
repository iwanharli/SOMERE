import { Router } from "express";
import { prisma } from "../lib/prisma";
import { panelin } from "../lib/panelin";
import { cacheGet, cacheSet } from "../lib/cache";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { detectPlatformBackend, detectReportReasonBackend } from "../lib/platformDetect";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// ─── Helper: rentang tanggal ────────────────────────────────────────────────
function getPeriodRange(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":  return new Date(now.getTime() - 7  * 86400_000);
    case "month": return new Date(now.getTime() - 30 * 86400_000);
    default:      return null;
  }
}

// ─── Helper: last N days labels ──────────────────────────────────────────────
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    days.push(`${d.getDate()}/${d.getMonth() + 1}`);
  }
  return days;
}

// ─── ADMIN dashboard ─────────────────────────────────────────────────────────
dashboardRouter.get("/admin", requireAdmin, async (req: AuthRequest, res) => {
  const period   = (req.query.period as string) || "all";
  const since    = getPeriodRange(period);
  const dateFilter = since ? { gte: since } : undefined;

  const [
    totalOrders, completedOrders, activeOrders, cancelledOrders,
    allOrders,
    tokenSummaryRaw,
    totalUserCount,
    activeUserCount,
    recentUsers,
    recentOrders,
    cfg,
  ] = await prisma.$transaction([
    prisma.panelinOrder.count({ where: dateFilter ? { orderDate: dateFilter } : {} }),
    prisma.panelinOrder.count({ where: { status: "completed", ...(dateFilter ? { orderDate: dateFilter } : {}) } }),
    prisma.panelinOrder.count({ where: { status: { in: ["pending","processing","in_progress"] }, ...(dateFilter ? { orderDate: dateFilter } : {}) } }),
    prisma.panelinOrder.count({ where: { status: { in: ["cancelled","refunded"] }, ...(dateFilter ? { orderDate: dateFilter } : {}) } }),
    // Untuk chart platform & trend
    prisma.panelinOrder.findMany({
      where: dateFilter ? { orderDate: dateFilter } : {},
      select: { serviceId: true, charge: true, orderDate: true, status: true },
      orderBy: { orderDate: "asc" },
    }),
    // Token summary dari semua user
    prisma.tokenTransaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      orderBy: { type: "asc" },
    }),
    // Total user role USER
    prisma.user.count({ where: { role: "USER" } }),
    // User aktif (punya token > 0)
    prisma.user.count({ where: { role: "USER", tokenBalance: { gt: 0 } } }),
    // User terbaru (role USER)
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, username: true, name: true, tokenBalance: true, createdAt: true },
    }),
    // Order terbaru (ikut filter periode)
    prisma.panelinOrder.findMany({
      where: dateFilter ? { orderDate: dateFilter } : {},
      orderBy: { orderDate: "desc" },
      take: 8,
    }),
    prisma.config.findUnique({ where: { key: "token_idr_value" } }),
  ]);

  const tokenIdrValue = parseInt(cfg?.value ?? "10000");

  // Saldo Panelin (dari cache)
  let balance = 0;
  try {
    const CACHE_KEY = "panelin:balance";
    const cached = cacheGet<{ data?: { balance?: number } }>(CACHE_KEY);
    if (cached) { balance = cached.data?.balance ?? 0; }
    else {
      const { data } = await panelin.get("/balance");
      cacheSet(CACHE_KEY, data, 60_000);
      balance = data?.data?.balance ?? 0;
    }
  } catch {}

  // Token summary
  const tokenSummary = { INJECT: 0, ORDER: 0, REFUND: 0, DEDUCT: 0 };
  for (const row of tokenSummaryRaw) {
    tokenSummary[row.type as keyof typeof tokenSummary] = row._sum?.amount ?? 0;
  }
  const totalTokenInCirculation = tokenSummary.INJECT - tokenSummary.DEDUCT;
  const totalTokenUsed = tokenSummary.ORDER - tokenSummary.REFUND;
  const totalTokenRemaining = totalTokenInCirculation - totalTokenUsed;

  // Platform breakdown dari nama service
  const services = await prisma.panelinService.findMany({ select: { id: true, name: true } });
  const svcMap = Object.fromEntries(services.map(s => [s.id, s.name]));
  const platformCount: Record<string, number> = {};
  for (const o of allOrders) {
    const name = svcMap[o.serviceId] ?? "";
    const plt  = detectPlatformBackend(name) ?? "Lainnya";
    platformCount[plt] = (platformCount[plt] ?? 0) + 1;
  }
  const platformData = Object.entries(platformCount)
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({ platform, count }));

  // Tren order — jumlah hari sesuai periode
  const trendDays = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 14;
  const trendLabels = lastNDays(trendDays);
  const trendMap: Record<string, { orders: number; revenue: number }> = {};
  for (const d of trendLabels) trendMap[d] = { orders: 0, revenue: 0 };
  for (const o of allOrders) {
    const d = new Date(o.orderDate);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (trendMap[key] !== undefined) {
      trendMap[key].orders++;
      trendMap[key].revenue += o.charge;
    }
  }
  const trendData = trendLabels.map(d => ({ date: d, orders: trendMap[d].orders, revenue: trendMap[d].revenue }));

  // Status breakdown
  const statusData = [
    { status: "Selesai",    value: completedOrders,                         color: "#22c55e" },
    { status: "Aktif",      value: activeOrders,                            color: "#3b82f6" },
    { status: "Dibatalkan", value: cancelledOrders,                         color: "#ef4444" },
    { status: "Lainnya",    value: totalOrders - completedOrders - activeOrders - cancelledOrders, color: "#8b8fa8" },
  ].filter(s => s.value > 0);

  // Total pengeluaran
  const totalRevenue = allOrders.reduce((s, o) => s + o.charge, 0);

  res.json({
    success: true,
    data: {
      overview: { balance, totalOrders, completedOrders, activeOrders, cancelledOrders, totalRevenue, tokenIdrValue },
      tokenSummary: { ...tokenSummary, totalTokenInCirculation, totalTokenUsed, totalTokenRemaining, totalUserCount, activeUserCount },
      platformData,
      trendData,
      statusData,
      recentUsers,
      recentOrders: recentOrders.map(o => ({
        id: o.id, serviceId: o.serviceId, link: o.link,
        quantity: o.quantity, charge: o.charge, status: o.status,
        orderDate: o.orderDate,
      })),
    },
  });
});

// ─── USER dashboard ──────────────────────────────────────────────────────────
dashboardRouter.get("/user", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const period = (req.query.period as string) || "all";
  const since  = getPeriodRange(period);

  const [user, recentTokenTx, allUserTx, cfg, tokenPrices, services] = await prisma.$transaction([
    prisma.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } }),
    // 5 tx terbaru untuk ditampilkan (tidak difilter period)
    prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { performer: { select: { username: true } } },
    }),
    // Semua tx user (untuk kalkulasi stats — difilter period)
    prisma.tokenTransaction.findMany({
      where: { userId, ...(since ? { createdAt: { gte: since } } : {}) },
      select: { type: true, amount: true, orderId: true, createdAt: true, balanceAfter: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.config.findUnique({ where: { key: "token_idr_value" } }),
    prisma.serviceTokenPrice.findMany({ where: { isActive: true }, select: { tokenPrice: true } }),
    prisma.panelinService.findMany({ select: { id: true, name: true } }),
  ]);

  const tokenIdrValue = parseInt(cfg?.value ?? "10000");
  const tokenBalance  = user?.tokenBalance ?? 0;

  const totalInjected = allUserTx.filter(t => t.type === "INJECT").reduce((s, t) => s + t.amount, 0);
  const totalUsed     = allUserTx.filter(t => t.type === "ORDER").reduce((s, t) => s + t.amount, 0);
  const totalRefunded = allUserTx.filter(t => t.type === "REFUND").reduce((s, t) => s + t.amount, 0);

  // Estimasi order dari saldo sekarang / rata-rata harga token
  const avgTokenPrice = tokenPrices.length
    ? Math.round(tokenPrices.reduce((s, p) => s + p.tokenPrice, 0) / tokenPrices.length)
    : 1;
  const estimatedTugasLeft = avgTokenPrice > 0 ? Math.floor(tokenBalance / avgTokenPrice) : 0;

  // Order milik user (berdasarkan tx yang punya orderId, difilter period)
  const userOrderIds = [...new Set(allUserTx.filter(t => t.orderId).map(t => t.orderId as number))];
  const userOrderDetails = await prisma.panelinOrder.findMany({
    where: { id: { in: userOrderIds } },
    orderBy: { orderDate: "desc" },
  });

  const activeOrders    = userOrderDetails.filter(o => ["pending","processing","in_progress"].includes(o.status));
  const completedOrders = userOrderDetails.filter(o => o.status === "completed").length;
  const cancelledOrders = userOrderDetails.filter(o => ["cancelled","refunded"].includes(o.status)).length;

  // Platform breakdown
  const svcMap = Object.fromEntries(services.map(s => [s.id, s.name]));
  const platformCount: Record<string, number> = {};
  for (const o of userOrderDetails) {
    const plt = detectPlatformBackend(svcMap[o.serviceId] ?? "") ?? "Lainnya";
    platformCount[plt] = (platformCount[plt] ?? 0) + 1;
  }
  const platformData = Object.entries(platformCount)
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({ platform, count }));

  // Tren token usage sesuai period
  const trendDays   = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 14;
  const trendLabels = lastNDays(trendDays);
  const trendMap: Record<string, number> = {};
  for (const d of trendLabels) trendMap[d] = 0;
  for (const tx of allUserTx.filter(t => t.type === "ORDER")) {
    const d   = new Date(tx.createdAt);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (trendMap[key] !== undefined) trendMap[key] += tx.amount;
  }
  const trendData = trendLabels.map(d => ({ date: d, token: trendMap[d] }));

  // 1. Distribusi Alasan Pelaporan (Reason Distribution)
  const reasonCount: Record<string, number> = {};
  for (const o of userOrderDetails) {
    const svcName = svcMap[o.serviceId] ?? "";
    const reasonKey = detectReportReasonBackend(svcName);
    reasonCount[reasonKey] = (reasonCount[reasonKey] ?? 0) + 1;
  }
  const reasonData = Object.entries(reasonCount)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Kalender Aktivitas Heatmap (1 tahun terakhir)
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const allUserTxsRaw = await prisma.tokenTransaction.findMany({
    where: { userId, type: "ORDER", orderId: { not: null } },
    select: { orderId: true },
  });
  const allUserOrderIds = [...new Set(allUserTxsRaw.map(t => t.orderId as number))];

  const heatmapRaw = await prisma.panelinOrder.findMany({
    where: {
      id: { in: allUserOrderIds },
      orderDate: { gte: oneYearAgo }
    },
    select: { orderDate: true }
  });

  const heatmapMap: Record<string, number> = {};
  for (const o of heatmapRaw) {
    const dStr = new Date(o.orderDate).toISOString().split("T")[0]; // YYYY-MM-DD
    heatmapMap[dStr] = (heatmapMap[dStr] ?? 0) + 1;
  }
  const heatmapData = Object.entries(heatmapMap).map(([date, count]) => ({ date, count }));

  res.json({
    success: true,
    data: {
      tokenBalance, totalInjected, totalUsed, totalRefunded, estimatedTugasLeft, tokenIdrValue,
      orderStats: { total: userOrderDetails.length, completed: completedOrders, active: activeOrders.length, cancelled: cancelledOrders },
      activeOrders: activeOrders.slice(0, 5).map(o => ({
        id: o.id, serviceId: o.serviceId, link: o.link,
        quantity: o.quantity, status: o.status, orderDate: o.orderDate,
      })),
      recentTokenTx,
      platformData,
      trendData,
      reasonData,
      heatmapData,
    },
  });
});
