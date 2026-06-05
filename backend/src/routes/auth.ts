import { formatZodError } from "../lib/zodError";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { log } from "../lib/logger";
import { authenticate, AuthRequest } from "../middleware/auth";

export const authRouter = Router();

const MAX_FAILED   = 5;
const LOCK_MINUTES = 15;
const ACCESS_TTL   = "15m";
const REFRESH_DAYS = 7;

// ── Rate limiter: maks 10 request per 15 menit per IP ────────────────────────
const authLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               10,
  standardHeaders:   true,
  legacyHeaders:     false,
  message:           { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max:      5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Terlalu banyak pendaftaran dari IP ini. Coba lagi dalam 1 jam." },
});

// ── Helper ────────────────────────────────────────────────────────────────────
function userPayload(u: { id: string; username: string; name: string; email: string; role: string }) {
  return { id: u.id, username: u.username, name: u.name, email: u.email, role: u.role };
}

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TTL }
  );
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt    = new Date(Date.now() + REFRESH_DAYS * 86400_000);
  return { accessToken, refreshToken, expiresAt };
}

// ── Register ──────────────────────────────────────────────────────────────────
authRouter.post("/register", registerLimiter, async (req, res) => {
  const parsed = z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
    name:     z.string().min(2),
    email:    z.string().email(),
    password: z.string().min(8),
  }).safeParse(req.body);

  if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

  const { username, name, email, password } = parsed.data;
  const [existEmail, existUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);

  // [3] Pesan generik — hindari user enumeration
  if (existEmail || existUsername) {
    res.status(409).json({ error: "Data sudah digunakan oleh akun lain." });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user   = await prisma.user.create({ data: { username, name, email, password: hashed, status: "PENDING" } });

  await log({ userId: user.id, event: "AUTH_REGISTER", description: `Pendaftaran akun baru: @${username}`, req });

  res.status(201).json({ pending: true, message: "Pendaftaran berhasil. Akun Anda sedang menunggu persetujuan admin." });
});

// ── Login ─────────────────────────────────────────────────────────────────────
authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = z.object({
    identifier: z.string().min(1),
    password:   z.string(),
  }).safeParse(req.body);

  if (!parsed.success) { res.status(400).json({ error: formatZodError(parsed.error) }); return; }

  const { identifier, password } = parsed.data;
  const isEmail = identifier.includes("@");
  const user = await prisma.user.findFirst({
    where: isEmail ? { email: identifier } : { username: identifier },
  });

  // [2] Cek lockout sebelum verifikasi password
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    res.status(429).json({ error: `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.` });
    return;
  }

  // Verifikasi password
  const passwordValid = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !passwordValid) {
    // [2] Catat percobaan gagal
    if (user) {
      const newFailed = (user.failedAttempts ?? 0) + 1;
      const shouldLock = newFailed >= MAX_FAILED;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newFailed,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
        },
      });
      if (shouldLock) {
        res.status(429).json({ error: `Akun dikunci selama ${LOCK_MINUTES} menit karena ${MAX_FAILED}x percobaan gagal.` });
        return;
      }
      const remaining = MAX_FAILED - newFailed;
      res.status(401).json({ error: `Username/email atau password salah. ${remaining} percobaan tersisa sebelum akun dikunci.` });
    } else {
      res.status(401).json({ error: "Username/email atau password salah." });
    }
    return;
  }

  // Reset failed attempts setelah berhasil
  if (user.failedAttempts > 0) {
    await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });
  }

  // Cek status akun
  if (user.status === "PENDING") {
    res.status(403).json({ error: "Akun Anda sedang menunggu persetujuan admin. Harap bersabar." });
    return;
  }
  if (user.status === "SUSPENDED") {
    res.status(403).json({ error: "Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut." });
    return;
  }

  // [5] Buat access token (15m) + refresh token (7 hari)
  const { accessToken, refreshToken, expiresAt } = generateTokens(user.id, user.role);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  await log({ userId: user.id, event: "AUTH_LOGIN", description: "Login berhasil", metadata: { via: isEmail ? "email" : "username" }, req });

  res.json({ token: accessToken, refreshToken, user: userPayload(user) });
});

// ── Refresh token ─────────────────────────────────────────────────────────────
authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ error: "Refresh token diperlukan" }); return; }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    res.status(401).json({ error: "Refresh token tidak valid atau sudah kadaluarsa. Silakan login ulang." });
    return;
  }

  if (stored.user.status !== "ACTIVE") {
    res.status(403).json({ error: "Akun tidak aktif." });
    return;
  }

  // Rotate: hapus token lama, buat yang baru
  const { accessToken, refreshToken: newRefresh, expiresAt } = generateTokens(stored.userId, stored.user.role);
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({ data: { token: newRefresh, userId: stored.userId, expiresAt } }),
  ]);

  res.json({ token: accessToken, refreshToken: newRefresh });
});

// ── Logout ────────────────────────────────────────────────────────────────────
authRouter.post("/logout", authenticate, async (req: AuthRequest, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  await log({ userId: req.userId!, event: "AUTH_LOGOUT", description: "Logout", req });
  res.json({ success: true });
});
