# SORE Frontend

Antarmuka pengguna untuk aplikasi **SORE (Social Media Report)**, dibangun dengan React, Vite, dan TypeScript.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand (dengan persist middleware)
- **HTTP Client**: Axios

## Prasyarat

- Node.js >= 18
- Backend SORE berjalan di port `5000`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Opsional) Buat file `.env.local` jika backend tidak di `localhost:5000`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   Tanpa file ini, Vite proxy otomatis meneruskan `/api` → `http://localhost:5000`.

## Menjalankan

```bash
# Development
npm run dev
# Buka http://localhost:5173

# Build production
npm run build

# Preview hasil build
npm run preview
```

## Scripts

| Script | Keterangan |
|--------|------------|
| `npm run dev` | Dev server dengan HMR di port 5173 |
| `npm run build` | Type-check + bundle production ke `dist/` |
| `npm run preview` | Jalankan preview dari `dist/` |
| `npm run lint` | Jalankan ESLint |

## Struktur Utama

```
src/
├── lib/api.ts        # Axios instance — otomatis inject Bearer token
├── store/auth.ts     # Zustand store (token + user, persisted ke localStorage)
├── types/index.ts    # TypeScript types (Report, Metric, Platform, ReportStatus)
├── pages/            # Halaman utama (Login, Register, Dashboard)
└── App.tsx           # Routing + PrivateRoute guard
```

## Alur Autentikasi

1. Login/Register → backend mengembalikan JWT token
2. Token disimpan di Zustand store (persist key: `sore_auth`) dan `localStorage`
3. Axios interceptor di `src/lib/api.ts` membaca token dari `localStorage` dan menyisipkan header `Authorization: Bearer <token>` di setiap request
4. `PrivateRoute` di `App.tsx` membaca token dari Zustand — redirect ke `/login` jika tidak ada

## Proxy Development

Vite dikonfigurasi untuk mem-proxy semua request `/api/*` ke `http://localhost:5000`, sehingga tidak ada masalah CORS saat development.

```ts
// vite.config.ts
proxy: {
  "/api": { target: "http://localhost:5000", changeOrigin: true }
}
```
