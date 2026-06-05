import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { log } from "../lib/logger";

export const tokenRequestRouter = Router();
tokenRequestRouter.use(authenticate);

// ── User: ajukan request ──────────────────────────────────────────────────────
tokenRequestRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = z.object({
    amount: z.number().int().min(1).max(10000),
    reason: z.string().max(500).optional(),
  }).safeParse(req.body);

  if (!parsed.success) { res.status(400).json({ error: "Data tidak valid" }); return; }

  // Cek apakah ada request PENDING yang belum diproses
  const existing = await prisma.tokenRequest.findFirst({
    where: { userId: req.userId!, status: "PENDING" },
  });
  if (existing) {
    res.status(409).json({ error: "Anda masih memiliki pengajuan yang sedang diproses. Tunggu hingga selesai." });
    return;
  }

  const request = await prisma.tokenRequest.create({
    data: { userId: req.userId!, amount: parsed.data.amount, reason: parsed.data.reason ?? null },
  });

  await log({ userId: req.userId!, event: "TOKEN_INJECT", description: `Mengajukan permintaan ${parsed.data.amount} token`, metadata: { requestId: request.id, reason: parsed.data.reason }, req });

  res.status(201).json({ success: true, data: request });
});

// ── User: riwayat request sendiri ─────────────────────────────────────────────
tokenRequestRouter.get("/me", async (req: AuthRequest, res) => {
  const requests = await prisma.tokenRequest.findMany({
    where:   { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    take:    20,
  });
  res.json({ success: true, data: requests });
});

// ── Admin: semua request ──────────────────────────────────────────────────────
tokenRequestRouter.get("/", requireAdmin, async (_req, res) => {
  const requests = await prisma.tokenRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, username: true, name: true, tokenBalance: true } } },
  });
  res.json({ success: true, data: requests });
});

// ── Admin: approve / reject ───────────────────────────────────────────────────
tokenRequestRouter.patch("/:id", requireAdmin, async (req: AuthRequest, res) => {
  const parsed = z.object({
    status:    z.enum(["APPROVED", "REJECTED"]),
    adminNote: z.string().max(500).optional(),
  }).safeParse(req.body);

  if (!parsed.success) { res.status(400).json({ error: "Data tidak valid" }); return; }

  const request = await prisma.tokenRequest.findUnique({ where: { id: req.params.id } });
  if (!request)             { res.status(404).json({ error: "Request tidak ditemukan" }); return; }
  if (request.status !== "PENDING") { res.status(409).json({ error: "Request sudah diproses" }); return; }

  const { status, adminNote } = parsed.data;

  if (status === "APPROVED") {
    // Inject token + update request dalam satu transaksi
    const user   = await prisma.user.findUnique({ where: { id: request.userId }, select: { tokenBalance: true, username: true } });
    const before = user?.tokenBalance ?? 0;
    const after  = before + request.amount;

    await prisma.$transaction([
      prisma.tokenRequest.update({ where: { id: request.id }, data: { status: "APPROVED", adminNote: adminNote ?? null, reviewedBy: req.userId, reviewedAt: new Date() } }),
      prisma.tokenTransaction.create({ data: { userId: request.userId, type: "INJECT", amount: request.amount, balanceBefore: before, balanceAfter: after, note: `Disetujui dari pengajuan #${request.id.slice(-6)}`, performedBy: req.userId } }),
      prisma.user.update({ where: { id: request.userId }, data: { tokenBalance: after } }),
    ]);

    await log({ userId: req.userId!, event: "TOKEN_INJECT", description: `Menyetujui pengajuan ${request.amount} token untuk @${user?.username}`, targetId: request.userId, metadata: { requestId: request.id, amount: request.amount }, req });
  } else {
    await prisma.tokenRequest.update({ where: { id: request.id }, data: { status: "REJECTED", adminNote: adminNote ?? null, reviewedBy: req.userId, reviewedAt: new Date() } });
    await log({ userId: req.userId!, event: "TOKEN_DEDUCT", description: `Menolak pengajuan token dari @${request.userId}`, targetId: request.userId, metadata: { requestId: request.id }, req });
  }

  res.json({ success: true });
});
