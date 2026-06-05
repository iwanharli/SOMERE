import { prisma } from "./prisma";
import { Request } from "express";

export type LogEvent =
  | "AUTH_LOGIN"
  | "AUTH_REGISTER"
  | "AUTH_LOGOUT"
  | "PROFILE_UPDATE"
  | "PASSWORD_CHANGE"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "TOKEN_INJECT"
  | "TOKEN_DEDUCT"
  | "ORDER_CREATE"
  | "ORDER_REFUND"
  | "SYNC_SERVICES"
  | "SYNC_ORDERS"
  | "SYNC_TRANSACTIONS"
  | "SETTINGS_TOKEN_VALUE"
  | "SERVICE_PRICE_SET"
  | "SERVICE_PRICE_TOGGLE";

export interface LogOptions {
  userId:      string;
  event:       LogEvent;
  description: string;
  targetId?:   string;
  metadata?:   Record<string, unknown>;
  req?:        Request;
}

function getIP(req?: Request): string | null {
  if (!req) return null;
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress ?? null;
}

function parseUserAgent(ua?: string): string | null {
  if (!ua) return null;

  // Browser
  let browser = "Browser";
  if (ua.includes("Edg/"))          browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome"))   browser = "Chrome";
  else if (ua.includes("Firefox"))  browser = "Firefox";
  else if (ua.includes("Safari"))   browser = "Safari";

  // OS / Device
  let os = "Unknown";
  if (ua.includes("iPhone"))             os = "iPhone";
  else if (ua.includes("iPad"))          os = "iPad";
  else if (ua.includes("Android"))       os = "Android";
  else if (ua.includes("Windows"))       os = "Windows";
  else if (ua.includes("Macintosh"))     os = "macOS";
  else if (ua.includes("Linux"))         os = "Linux";

  return `${browser} · ${os}`;
}

export async function log(opts: LogOptions): Promise<void> {
  try {
    const device = parseUserAgent(opts.req?.headers["user-agent"] as string | undefined);
    const baseMetadata = opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : {};
    if (device) baseMetadata.device = device;

    await prisma.activityLog.create({
      data: {
        userId:      opts.userId,
        targetId:    opts.targetId  ?? null,
        event:       opts.event,
        description: opts.description,
        metadata:    Object.keys(baseMetadata).length ? baseMetadata : undefined,
        ipAddress:   getIP(opts.req) ?? null,
      },
    });
  } catch {
    // Log silently — jangan sampai gagal log merusak request utama
  }
}
