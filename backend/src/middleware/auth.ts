import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Token tidak ditemukan" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    req.userId = payload.userId;
    req.role   = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.role !== "ADMIN") {
    res.status(403).json({ error: "Akses hanya untuk admin" });
    return;
  }
  next();
}
