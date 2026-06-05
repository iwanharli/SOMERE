import { formatZodError } from "../lib/zodError";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import { log } from "../lib/logger";

export const usersRouter = Router();
usersRouter.use(authenticate);

const createSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(["ADMIN", "USER"]).default("USER"),
});

const updateSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
  name:     z.string().min(2).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(8).optional(),
  role:     z.enum(["ADMIN", "USER"]).optional(),
});

function safe(u: { id: string; username: string; name: string; email: string; role: string; status: string; createdAt: Date; updatedAt: Date }) {
  return { id: u.id, username: u.username, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt, updatedAt: u.updatedAt };
}

usersRouter.get("/", requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ success: true, data: users.map(safe) });
});

usersRouter.post("/", requireAdmin, async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

  const { username, name, email, password, role } = parsed.data;
  const [existEmail, existUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);
  if (existEmail)    { res.status(409).json({ error: "Email sudah terdaftar" });    return; }
  if (existUsername) { res.status(409).json({ error: "Username sudah digunakan" }); return; }

  const hashed = await bcrypt.hash(password, 12);
  const user   = await prisma.user.create({ data: { username, name, email, password: hashed, role } });

  await log({ userId: req.userId!, event: "USER_CREATE", description: `Membuat akun baru: @${username} (${role})`, targetId: user.id, req });

  res.status(201).json({ success: true, data: safe(user) });
});

usersRouter.patch("/:id", async (req: AuthRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

  const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!exists) { res.status(404).json({ error: "User tidak ditemukan" }); return; }

  const { password, email, username, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  const changes: string[] = [];

  if (email && email !== exists.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) { res.status(409).json({ error: "Email sudah digunakan" }); return; }
    data.email = email;
    changes.push("email");
  }
  if (username && username !== exists.username) {
    const dup = await prisma.user.findUnique({ where: { username } });
    if (dup) { res.status(409).json({ error: "Username sudah digunakan" }); return; }
    data.username = username;
    changes.push("username");
  }
  if (rest.name && rest.name !== exists.name) changes.push("nama");
  if (rest.role && rest.role !== exists.role) changes.push(`role → ${rest.role}`);
  if (password) {
    data.password = await bcrypt.hash(password, 12);
    changes.push("password");
  }

  const user = await prisma.user.update({ where: { id: req.params.id }, data });

  // Tentukan event: apakah update profil sendiri atau admin update orang lain
  const isSelf     = req.userId === req.params.id;
  const isPassOnly = changes.length === 1 && changes[0] === "password";

  await log({
    userId: req.userId!,
    event:  isPassOnly ? "PASSWORD_CHANGE" : "PROFILE_UPDATE",
    description: isPassOnly
      ? `Mengubah password`
      : `Memperbarui profil: ${changes.join(", ") || "tidak ada perubahan"}`,
    targetId: isSelf ? undefined : req.params.id,
    metadata: { changed: changes },
    req,
  });

  res.json({ success: true, data: safe(user) });
});

// ─── Approve / Suspend ───────────────────────────────────────────────────────
usersRouter.patch("/:id/status", requireAdmin, async (req: AuthRequest, res) => {
  const { status } = z.object({ status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]) }).parse(req.body);
  const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!exists) { res.status(404).json({ error: "User tidak ditemukan" }); return; }

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });

  const actionMap: Record<string, string> = {
    ACTIVE:    `Menyetujui akun @${exists.username}`,
    PENDING:   `Mereset status akun @${exists.username} ke pending`,
    SUSPENDED: `Menonaktifkan akun @${exists.username}`,
  };
  await log({ userId: req.userId!, event: "USER_UPDATE", description: actionMap[status], targetId: exists.id, req });

  res.json({ success: true, data: safe(user) });
});

usersRouter.delete("/:id", requireAdmin, async (req: AuthRequest, res) => {
  const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!exists) { res.status(404).json({ error: "User tidak ditemukan" }); return; }

  await log({ userId: req.userId!, event: "USER_DELETE", description: `Menghapus akun @${exists.username} (${exists.name})`, targetId: exists.id, metadata: { deletedUser: { username: exists.username, email: exists.email, role: exists.role } }, req });

  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
