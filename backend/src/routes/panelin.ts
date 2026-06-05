import { Router } from "express";
import { panelin } from "../lib/panelin";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { cacheGet, cacheSet } from "../lib/cache";
import { log } from "../lib/logger";
import {
  syncServices,
  syncOrders,
  syncActiveOrders,
  syncTransactions,
} from "../services/panelinSync";

export const panelinRouter = Router();
panelinRouter.use(authenticate);

// ─── Balance (cache 60 detik) ──────────────────────────────────────────────
panelinRouter.get("/balance", async (_req, res) => {
  const CACHE_KEY = "panelin:balance";
  const cached = cacheGet<object>(CACHE_KEY);
  if (cached) { res.json(cached); return; }

  try {
    const { data } = await panelin.get("/balance");
    cacheSet(CACHE_KEY, data, 60_000);
    res.json(data);
  } catch (err: any) {
    // Jika rate limited, kembalikan cache lama jika ada (toleransi)
    if (err?.response?.status === 429) {
      res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak request, coba lagi sebentar." } });
      return;
    }
    throw err;
  }
});

// ─── Services (dari DB, fallback auto-sync) ────────────────────────────────
panelinRouter.get("/services", async (_req, res) => {
  let services = await prisma.panelinService.findMany({
    orderBy: [{ category: "asc" }, { id: "asc" }],
  });

  // Jika DB kosong, langsung sync dari API
  if (!services.length) {
    await syncServices();
    services = await prisma.panelinService.findMany({
      orderBy: [{ category: "asc" }, { id: "asc" }],
    });
  }

  res.json({ success: true, data: services, meta: null });
});

panelinRouter.get("/services/:id", async (req, res) => {
  const service = await prisma.panelinService.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!service) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Service tidak ditemukan." } });
    return;
  }
  res.json({ success: true, data: service, meta: null });
});

// ─── Orders (dari DB, paginated) ───────────────────────────────────────────
panelinRouter.get("/orders", async (req: AuthRequest, res) => {
  const page    = Math.max(1, Number(req.query.page) || 1);
  const perPage = 15;
  const skip    = (page - 1) * perPage;

  // ── USER: hanya tampilkan tugas miliknya ──────────────────────────────────
  if (req.role === "USER") {
    const userTxs = await prisma.tokenTransaction.findMany({
      where: { userId: req.userId!, type: "ORDER", orderId: { not: null } },
      select: { orderId: true, amount: true },
    });
    const orderIds = [...new Set(userTxs.map(t => t.orderId!))];
    const txMap = Object.fromEntries(userTxs.map(t => [t.orderId!, t.amount]));

    if (orderIds.length === 0) {
      res.json({ success: true, data: [], meta: { current_page: 1, per_page: perPage, total: 0, last_page: 1 } });
      return;
    }

    const [total, orders] = await prisma.$transaction([
      prisma.panelinOrder.count({ where: { id: { in: orderIds } } }),
      prisma.panelinOrder.findMany({
        where:   { id: { in: orderIds } },
        orderBy: { id: "desc" },
        skip, take: perPage,
      }),
    ]);

    res.json({
      success: true,
      data: orders.map(o => {
        const resp = toOrderResponse(o);
        resp.charge = txMap[o.id] ?? 0;
        return resp;
      }),
      meta: { current_page: page, per_page: perPage, total, last_page: Math.ceil(total / perPage) || 1 },
    });
    return;
  }

  // ── ADMIN: semua tugas ────────────────────────────────────────────────────
  const [total, orders] = await prisma.$transaction([
    prisma.panelinOrder.count(),
    prisma.panelinOrder.findMany({ orderBy: { id: "desc" }, skip, take: perPage }),
  ]);

  if (!total) {
    await syncOrders();
    const [t2, o2] = await prisma.$transaction([
      prisma.panelinOrder.count(),
      prisma.panelinOrder.findMany({ orderBy: { id: "desc" }, skip, take: perPage }),
    ]);
    const enriched2 = await enrichOrdersWithUser(o2);
    res.json({ success: true, data: enriched2, meta: { current_page: page, per_page: perPage, total: t2, last_page: Math.ceil(t2 / perPage) || 1 } });
    return;
  }

  const enriched = await enrichOrdersWithUser(orders);
  res.json({ success: true, data: enriched, meta: { current_page: page, per_page: perPage, total, last_page: Math.ceil(total / perPage) } });
});

panelinRouter.get("/orders/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const order = await prisma.panelinOrder.findUnique({
    where: { id },
  });
  if (!order) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order tidak ditemukan." } });
    return;
  }
  const resp = toOrderResponse(order);
  if (req.role === "USER") {
    const tx = await prisma.tokenTransaction.findFirst({
      where: { userId: req.userId!, type: "ORDER", orderId: id },
      select: { amount: true },
    });
    resp.charge = tx?.amount ?? 0;
  }
  res.json({ success: true, data: resp, meta: null });
});

// ─── Refresh status 1 order dari Panelin ───────────────────────────────────
panelinRouter.patch("/orders/:id/refresh", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  try {
    const { data } = await panelin.get(`/orders/${id}`);
    const o = data.data;
    const updated = await prisma.panelinOrder.update({
      where: { id },
      data: {
        status:     o.status?.toLowerCase() ?? o.status,
        startCount: o.start_count ?? null,
        remains:    o.remains    ?? null,
        syncedAt:   new Date(),
      },
    });
    const resp = toOrderResponse(updated);
    if (req.role === "USER") {
      const tx = await prisma.tokenTransaction.findFirst({
        where: { userId: req.userId!, type: "ORDER", orderId: id },
        select: { amount: true },
      });
      resp.charge = tx?.amount ?? 0;
    }
    res.json({ success: true, data: resp, meta: null });
  } catch {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Order tidak ditemukan di Panelin." } });
  }
});

panelinRouter.post("/orders", async (req: AuthRequest, res) => {
  const serviceId = Number(req.body.service);
  const quantity = Number(req.body.quantity);

  // ── Cek & potong token jika role USER ──────────────────────────────────────
  if (req.role === "USER") {
    const [user, tokenPrice] = await prisma.$transaction([
      prisma.user.findUnique({ where: { id: req.userId! }, select: { tokenBalance: true } }),
      prisma.serviceTokenPrice.findUnique({ where: { serviceId } }),
    ]);

    if (!tokenPrice || !tokenPrice.isActive) {
      res.status(403).json({ error: "Layanan ini belum tersedia untuk pembelian dengan token." });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      res.status(400).json({ error: "Jumlah order tidak valid." });
      return;
    }

    const tokenCost = Math.ceil((quantity / 1000) * tokenPrice.tokenPrice);

    if (!user || user.tokenBalance < tokenCost) {
      res.status(400).json({ error: `Token tidak cukup. Dibutuhkan: ${tokenCost}, tersedia: ${user?.tokenBalance ?? 0}.` });
      return;
    }

    // Kirim order ke Panelin
    const { data } = await panelin.post("/orders", req.body);
    if (!data?.data) { res.status(500).json({ error: "Gagal membuat order" }); return; }
    const o = data.data;

    const before = user.tokenBalance;
    const after  = before - tokenCost;

    // Simpan order + potong token + catat transaksi (atomic)
    await prisma.$transaction([
      prisma.panelinOrder.upsert({
        where:  { id: o.id },
        create: { id: o.id, serviceId: o.service_id, link: o.link, quantity: o.quantity, rate: o.rate, charge: o.charge, startCount: o.start_count, remains: o.remains, status: o.status?.toLowerCase() ?? o.status, comments: o.comments, orderDate: new Date(o.created_at) },
        update: {},
      }),
      prisma.tokenTransaction.create({
        data: { userId: req.userId!, type: "ORDER", amount: tokenCost, balanceBefore: before, balanceAfter: after, orderId: o.id, serviceId, tokenPrice: tokenPrice.tokenPrice },
      }),
      prisma.user.update({ where: { id: req.userId! }, data: { tokenBalance: after } }),
    ]);

    await log({ userId: req.userId!, event: "ORDER_CREATE", description: `Buat tugas #${data.data?.id} — service #${serviceId}, ${req.body.quantity} unit${req.body.link ? ` → ${req.body.link}` : ""}`, metadata: { orderId: data.data?.id, serviceId, quantity: req.body.quantity, link: req.body.link, tokenPricePer1000: tokenPrice.tokenPrice, tokenUsed: tokenCost }, req });
    res.status(201).json(data);
    return;
  }

  // ── Admin: langsung kirim ke Panelin tanpa cek token ──────────────────────
  const { data } = await panelin.post("/orders", req.body);
  if (data?.data) {
    const o = data.data;
    await prisma.panelinOrder.upsert({
      where: { id: o.id },
      create: { id: o.id, serviceId: o.service_id, link: o.link, quantity: o.quantity, rate: o.rate, charge: o.charge, startCount: o.start_count, remains: o.remains, status: o.status?.toLowerCase() ?? o.status, comments: o.comments, orderDate: new Date(o.created_at) },
      update: {},
    });
    await log({ userId: req.userId!, event: "ORDER_CREATE", description: `Buat tugas #${o.id} — service #${serviceId}, ${o.quantity} unit${o.link ? ` → ${o.link}` : ""}`, metadata: { orderId: o.id, serviceId, quantity: o.quantity, link: o.link, charge: o.charge }, req });
  }
  res.status(201).json(data);
});

// ─── Transactions (dari DB, paginated) ─────────────────────────────────────
panelinRouter.get("/transactions", async (req, res) => {
  const page    = Math.max(1, Number(req.query.page) || 1);
  const perPage = 15;
  const skip    = (page - 1) * perPage;

  const [total, txs] = await prisma.$transaction([
    prisma.panelinTransaction.count(),
    prisma.panelinTransaction.findMany({
      orderBy: { id: "desc" },
      skip,
      take: perPage,
    }),
  ]);

  if (!total) {
    await syncTransactions();
    const [t2, tx2] = await prisma.$transaction([
      prisma.panelinTransaction.count(),
      prisma.panelinTransaction.findMany({ orderBy: { id: "desc" }, skip, take: perPage }),
    ]);
    res.json({
      success: true,
      data: tx2.map(toTxResponse),
      meta: { current_page: page, per_page: perPage, total: t2, last_page: Math.ceil(t2 / perPage) || 1 },
    });
    return;
  }

  res.json({
    success: true,
    data: txs.map(toTxResponse),
    meta: { current_page: page, per_page: perPage, total, last_page: Math.ceil(total / perPage) },
  });
});

// ─── Sync status ────────────────────────────────────────────────────────────
panelinRouter.get("/sync/status", async (_req, res) => {
  const [svc, ord, tx] = await prisma.$transaction([
    prisma.panelinService.findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } }),
    prisma.panelinOrder.findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } }),
    prisma.panelinTransaction.findFirst({ orderBy: { syncedAt: "desc" }, select: { syncedAt: true } }),
  ]);
  const [svcCount, ordCount, txCount] = await prisma.$transaction([
    prisma.panelinService.count(),
    prisma.panelinOrder.count(),
    prisma.panelinTransaction.count(),
  ]);
  res.json({
    success: true,
    data: {
      services:     { count: svcCount, syncedAt: svc?.syncedAt ?? null },
      orders:       { count: ordCount, syncedAt: ord?.syncedAt ?? null },
      transactions: { count: txCount,  syncedAt: tx?.syncedAt  ?? null },
    },
  });
});

// ─── Sync endpoints ─────────────────────────────────────────────────────────
panelinRouter.post("/sync/services", async (req: AuthRequest, res) => {
  const result = await syncServices();
  await log({ userId: req.userId!, event: "SYNC_SERVICES", description: `Sync services: ${result.synced} data diperbarui`, metadata: result, req });
  res.json({ success: true, ...result });
});

panelinRouter.post("/sync/orders", async (req: AuthRequest, res) => {
  const result = await syncOrders();
  await log({ userId: req.userId!, event: "SYNC_ORDERS", description: `Sync semua tugas: ${result.synced} data diperbarui`, metadata: result, req });
  res.json({ success: true, ...result });
});

panelinRouter.post("/sync/orders/active", async (req: AuthRequest, res) => {
  const result = await syncActiveOrders();
  await log({ userId: req.userId!, event: "SYNC_ORDERS", description: `Sync status aktif: ${result.synced} tugas diperbarui`, metadata: result, req });
  res.json({ success: true, ...result });
});

panelinRouter.post("/sync/transactions", async (req: AuthRequest, res) => {
  const result = await syncTransactions();
  await log({ userId: req.userId!, event: "SYNC_TRANSACTIONS", description: `Sync transaksi: ${result.synced} data baru`, metadata: result, req });
  res.json({ success: true, ...result });
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function toOrderResponse(o: any) {
  return {
    id: o.id, service_id: o.serviceId, link: o.link,
    quantity: o.quantity, rate: o.rate, charge: o.charge,
    start_count: o.startCount, remains: o.remains,
    status: o.status?.toLowerCase() ?? o.status, comments: o.comments,
    created_at: o.orderDate, updated_at: o.syncedAt,
  };
}

async function enrichOrdersWithUser(orders: any[]) {
  if (!orders.length) return [];
  const orderIds = orders.map(o => o.id);
  const txs = await prisma.tokenTransaction.findMany({
    where: { orderId: { in: orderIds }, type: "ORDER" },
    select: { orderId: true, user: { select: { id: true, username: true, name: true } } },
  });
  const userMap = Object.fromEntries(txs.map(t => [t.orderId!, t.user]));
  return orders.map(o => ({ ...toOrderResponse(o), user: userMap[o.id] ?? null }));
}

function toTxResponse(t: any) {
  return {
    id: t.id, type: t.type, amount: t.amount,
    balance_before: t.balanceBefore, balance_after: t.balanceAfter,
    description: t.description, created_at: t.transactionDate,
  };
}
