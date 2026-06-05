# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SORE (Social Media Report) — fullstack web app for creating and managing social media analytics reports. Monorepo with `frontend/` (React + Vite) and `backend/` (Express + Prisma + PostgreSQL).

## Commands

**Run both services concurrently (from root):**
```bash
npm run dev
```

**Backend only:**
```bash
cd backend && npm run dev          # ts-node-dev with hot reload
npm run db:migrate                 # run Prisma migrations
npm run db:generate                # regenerate Prisma client after schema changes
npm run db:studio                  # open Prisma Studio GUI
npm run build                      # compile TypeScript → dist/
```

**Frontend only:**
```bash
cd frontend && npm run dev         # Vite dev server on :5173
npm run build                      # tsc + vite build
npm run preview                    # preview production build
```

**Install all dependencies:**
```bash
npm run install:all
```

## Environment

Copy `.env.example` to `.env` (root) and `backend/.env`. The critical variable is:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sore_db"
JWT_SECRET=...
```

Frontend reads `VITE_API_URL` (prefix `VITE_` required for Vite to expose env vars). In dev, the Vite proxy at `/api` → `http://localhost:5000` means `VITE_API_URL` is optional.

## Architecture

### Request flow
```
React (port 5173)
  └─ axios via src/lib/api.ts  (attaches Bearer token from localStorage)
       └─ Vite proxy /api → Express (port 5000)
            └─ authenticate middleware (JWT verify)
                 └─ route handler → Prisma → PostgreSQL
```

### Backend (`backend/src/`)
- `index.ts` — Express app bootstrap, mounts `/api/auth` and `/api/reports`
- `lib/prisma.ts` — singleton PrismaClient (safe for hot-reload in dev)
- `middleware/auth.ts` — JWT middleware; attaches `req.userId` for downstream handlers; exports `AuthRequest` type
- `routes/auth.ts` — `POST /register`, `POST /login`; uses bcryptjs + zod validation
- `routes/reports.ts` — CRUD for reports; all routes require `authenticate`; ownership enforced on every query (`where: { id, userId }`)

### Frontend (`frontend/src/`)
- `store/auth.ts` — Zustand store persisted to `localStorage` (`sore_auth`); source of truth for `token` and `user`
- `lib/api.ts` — Axios instance; request interceptor injects `Authorization: Bearer <token>` from `localStorage`
- `App.tsx` — React Router routes; `PrivateRoute` wrapper reads token from `useAuthStore`
- `types/index.ts` — shared TypeScript types mirroring Prisma enums (`Platform`, `ReportStatus`, `Report`, `Metric`)

### Data model (Prisma)
`User` → `Report` (1:many) → `Metric` (1:many). Reports have a `platform` enum (INSTAGRAM, TWITTER, FACEBOOK, TIKTOK, YOUTUBE, LINKEDIN) and a `status` enum (DRAFT, PUBLISHED, ARCHIVED). Cascading deletes are set on both relations.

### Auth pattern
JWT issued on login/register (7-day expiry). Token stored in both Zustand persist store and `localStorage` (dual-write in `setAuth`). Backend validates via `JWT_SECRET` env var — must match between `.env` file and running process.
