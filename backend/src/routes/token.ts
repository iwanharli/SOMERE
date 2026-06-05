import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { log } from "../lib/logger";

export const tokenRouter = Router();
tokenRouter.use(authenticate);

// ─── Config: nilai IDR per token ────────────────────────────────────────────

tokenRouter.get("/config", async (_req, res) => {
  const cfg = await prisma.config.findUnique({ where: { key: "token_idr_value" } });
  res.json({ success: true, data: { tokenIdrValue: parseInt(cfg?.value ?? "10000") } });
});

tokenRouter.put("/config", requireAdmin, async (req: AuthRequest, res) => {
  const { value } = z.object({ value: z.number().int().min(1) }).parse(req.body);
  const old = await prisma.config.findUnique({ where: { key: "token_idr_value" } });
  const cfg = await prisma.config.upsert({
    where:  { key: "token_idr_value" },
    create: { key: "token_idr_value", value: String(value), updatedBy: req.userId },
    update: { value: String(value), updatedBy: req.userId },
  });
  await log({ userId: req.userId!, event: "SETTINGS_TOKEN_VALUE", description: `Mengubah nilai token: Rp ${old?.value ?? "?"} → Rp ${value}`, metadata: { old: old?.value, new: value }, req });
  res.json({ success: true, data: { tokenIdrValue: parseInt(cfg.value) } });
});

// ─── Service token prices ────────────────────────────────────────────────────

tokenRouter.get("/prices", async (_req, res) => {
  const prices = await prisma.serviceTokenPrice.findMany({ orderBy: { serviceId: "asc" } });
  res.json({ success: true, data: prices });
});

tokenRouter.post("/prices", requireAdmin, async (req: AuthRequest, res) => {
  const schema = z.object({
    serviceId:  z.number().int().min(1),
    tokenPrice: z.number().int().min(1),
    isActive:   z.boolean().default(true),
  });
  const data = schema.parse(req.body);
  const price = await prisma.serviceTokenPrice.upsert({
    where:  { serviceId: data.serviceId },
    create: { ...data, updatedBy: req.userId },
    update: { tokenPrice: data.tokenPrice, isActive: data.isActive, updatedBy: req.userId },
  });
  res.json({ success: true, data: price });
});

tokenRouter.patch("/prices/:serviceId", requireAdmin, async (req: AuthRequest, res) => {
  const serviceId = parseInt(req.params.serviceId);
  const schema = z.object({
    tokenPrice: z.number().int().min(1).optional(),
    isActive:   z.boolean().optional(),
  });
  const data = schema.parse(req.body);
  const price = await prisma.serviceTokenPrice.update({
    where:  { serviceId },
    data:   { ...data, updatedBy: req.userId },
  });
  res.json({ success: true, data: price });
});

// ─── Balance & history (user sendiri) ────────────────────────────────────────

tokenRouter.get("/balance", async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.userId! },
    select: { tokenBalance: true },
  });
  res.json({ success: true, data: { tokenBalance: user?.tokenBalance ?? 0 } });
});

tokenRouter.get("/history", async (req: AuthRequest, res) => {
  const page    = Math.max(1, Number(req.query.page) || 1);
  const perPage = 20;
  const [total, txs] = await prisma.$transaction([
    prisma.tokenTransaction.count({ where: { userId: req.userId! } }),
    prisma.tokenTransaction.findMany({
      where:   { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * perPage,
      take:    perPage,
    }),
  ]);
  res.json({ success: true, data: txs, meta: { total, current_page: page, per_page: perPage, last_page: Math.ceil(total / perPage) || 1 } });
});

// ─── Admin: inject & deduct ──────────────────────────────────────────────────

const mutateSchema = z.object({
  userId: z.string(),
  amount: z.number().int().min(1),
  note:   z.string().optional(),
});

tokenRouter.post("/inject", requireAdmin, async (req: AuthRequest, res) => {
  const { userId, amount, note } = mutateSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ error: "User tidak ditemukan" }); return; }

  // Validasi: amount × tokenIdrValue tidak boleh melebihi saldo Panelin
  const cfg = await prisma.config.findUnique({ where: { key: "token_idr_value" } });
  const tokenIdrValue = parseInt(cfg?.value ?? "10000");
  const requiredIDR   = amount * tokenIdrValue;

  try {
    const { panelin } = await import("../lib/panelin");
    const { data: balData } = await panelin.get("/balance");
    const panelinBalance = balData?.data?.balance ?? 0;

    if (requiredIDR > panelinBalance) {
      res.status(400).json({
        error: `Saldo Panelin tidak cukup.`,
        detail: {
          required:  requiredIDR,
          available: panelinBalance,
          maxToken:  Math.floor(panelinBalance / tokenIdrValue),
        },
      });
      return;
    }
  } catch {
    // Jika gagal cek saldo Panelin, lanjutkan saja (jangan block inject)
  }

  const before = user.tokenBalance;
  const after  = before + amount;

  const [tx] = await prisma.$transaction([
    prisma.tokenTransaction.create({
      data: { userId, type: "INJECT", amount, balanceBefore: before, balanceAfter: after, note, performedBy: req.userId },
    }),
    prisma.user.update({ where: { id: userId }, data: { tokenBalance: after } }),
  ]);

  await log({ userId: req.userId!, event: "TOKEN_INJECT", description: `Inject ${amount} token ke @${user.username}${note ? ` (${note})` : ""}`, targetId: userId, metadata: { amount, before, after, note }, req });

  res.status(201).json({ success: true, data: tx });
});

tokenRouter.post("/deduct", requireAdmin, async (req: AuthRequest, res) => {
  const { userId, amount, note } = mutateSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  if (user.tokenBalance < amount) {
    res.status(400).json({ error: `Saldo token tidak cukup (tersedia: ${user.tokenBalance})` });
    return;
  }

  const before = user.tokenBalance;
  const after  = before - amount;

  const [tx] = await prisma.$transaction([
    prisma.tokenTransaction.create({
      data: { userId, type: "DEDUCT", amount, balanceBefore: before, balanceAfter: after, note, performedBy: req.userId },
    }),
    prisma.user.update({ where: { id: userId }, data: { tokenBalance: after } }),
  ]);

  await log({ userId: req.userId!, event: "TOKEN_DEDUCT", description: `Deduct ${amount} token dari @${user.username}${note ? ` (${note})` : ""}`, targetId: userId, metadata: { amount, before, after, note }, req });

  res.status(201).json({ success: true, data: tx });
});

// ─── Admin: semua transaksi & per user ───────────────────────────────────────

tokenRouter.get("/transactions", requireAdmin, async (req, res) => {
  const page    = Math.max(1, Number(req.query.page) || 1);
  const perPage = 30;
  const userId  = req.query.userId as string | undefined;

  const where = userId ? { userId } : {};
  const [total, txs] = await prisma.$transaction([
    prisma.tokenTransaction.count({ where }),
    prisma.tokenTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * perPage,
      take:    perPage,
      include: {
        user:      { select: { id: true, username: true, name: true } },
        performer: { select: { id: true, username: true, name: true } },
      },
    }),
  ]);
  res.json({ success: true, data: txs, meta: { total, current_page: page, per_page: perPage, last_page: Math.ceil(total / perPage) || 1 } });
});

tokenRouter.get("/users-summary", requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where:   { role: "USER" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, username: true, name: true, email: true, tokenBalance: true,
      tokenTransactions: {
        select: { type: true, amount: true },
      },
    },
  });

  const data = users.map((u) => {
    const totalInjected  = u.tokenTransactions.filter(t => t.type === "INJECT").reduce((s, t) => s + t.amount, 0);
    const totalDeducted  = u.tokenTransactions.filter(t => t.type === "DEDUCT").reduce((s, t) => s + t.amount, 0);
    const totalUsed      = u.tokenTransactions.filter(t => t.type === "ORDER" ).reduce((s, t) => s + t.amount, 0);
    const totalRefunded  = u.tokenTransactions.filter(t => t.type === "REFUND").reduce((s, t) => s + t.amount, 0);
    return { id: u.id, username: u.username, name: u.name, email: u.email, tokenBalance: u.tokenBalance, totalInjected, totalDeducted, totalUsed, totalRefunded };
  });

  res.json({ success: true, data });
});
