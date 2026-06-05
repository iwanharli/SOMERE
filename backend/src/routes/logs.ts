import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

export const logsRouter = Router();
logsRouter.use(authenticate);

const PER_PAGE = 30;

// ─── Admin: semua log (dengan filter) ────────────────────────────────────────
logsRouter.get("/", requireAdmin, async (req, res) => {
  const page     = Math.max(1, Number(req.query.page) || 1);
  const userId   = req.query.userId   as string | undefined;
  const event    = req.query.event    as string | undefined;
  const search   = req.query.search   as string | undefined;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (event)  where.event  = event;
  if (search) where.description = { contains: search, mode: "insensitive" };

  const [total, logs] = await prisma.$transaction([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        user:   { select: { id: true, username: true, name: true, role: true } },
        target: { select: { id: true, username: true, name: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: { total, current_page: page, per_page: PER_PAGE, last_page: Math.ceil(total / PER_PAGE) || 1 },
  });
});

// ─── User: log sendiri ────────────────────────────────────────────────────────
logsRouter.get("/me", async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);

  const [total, logs] = await prisma.$transaction([
    prisma.activityLog.count({ where: { userId: req.userId! } }),
    prisma.activityLog.findMany({
      where:   { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * PER_PAGE,
      take:    PER_PAGE,
      include: { target: { select: { username: true, name: true } } },
    }),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: { total, current_page: page, per_page: PER_PAGE, last_page: Math.ceil(total / PER_PAGE) || 1 },
  });
});

// ─── Distinct events (untuk filter dropdown) ─────────────────────────────────
logsRouter.get("/events", requireAdmin, async (_req, res) => {
  const events = await prisma.activityLog.findMany({
    distinct: ["event"],
    select: { event: true },
    orderBy: { event: "asc" },
  });
  res.json({ success: true, data: events.map(e => e.event) });
});
