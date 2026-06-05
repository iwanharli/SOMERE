# SORE Backend

REST API untuk aplikasi **SORE (Social Media Report)**, dibangun dengan Express.js, TypeScript, dan Prisma ORM.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT + bcryptjs
- **Validation**: Zod

## Prasyarat

- Node.js >= 18
- PostgreSQL aktif dan berjalan
- Database `db_sore` sudah dibuat

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Buat file `.env` (atau salin dari root `.env.example`):
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/db_sore"
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_secret_key
   CORS_ORIGIN=http://localhost:5173
   ```

3. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

4. Jalankan migrasi database:
   ```bash
   npm run db:migrate
   ```

## Menjalankan

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## Scripts

| Script | Keterangan |
|--------|------------|
| `npm run dev` | Jalankan server dengan hot reload (ts-node-dev) |
| `npm run build` | Kompilasi TypeScript ke `dist/` |
| `npm start` | Jalankan hasil build |
| `npm run db:migrate` | Jalankan migrasi Prisma |
| `npm run db:generate` | Generate ulang Prisma client |
| `npm run db:studio` | Buka Prisma Studio di browser |
| `npm run db:seed` | Jalankan seed data |

## API Endpoints

### Auth

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/register` | Registrasi pengguna baru |
| POST | `/api/auth/login` | Login dan dapatkan token |

**Body register:**
```json
{
  "name": "Nama Lengkap",
  "email": "email@example.com",
  "password": "min8karakter"
}
```

**Body login:**
```json
{
  "email": "email@example.com",
  "password": "password"
}
```

**Response (keduanya):**
```json
{
  "token": "eyJ...",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

### Reports

Semua endpoint memerlukan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/reports` | Ambil semua laporan milik user |
| GET | `/api/reports/:id` | Ambil satu laporan |
| POST | `/api/reports` | Buat laporan baru |
| PATCH | `/api/reports/:id` | Update laporan |
| DELETE | `/api/reports/:id` | Hapus laporan |

**Body POST /api/reports:**
```json
{
  "title": "Laporan Instagram Mei 2025",
  "description": "Opsional",
  "platform": "INSTAGRAM",
  "startDate": "2025-05-01T00:00:00.000Z",
  "endDate": "2025-05-31T23:59:59.000Z"
}
```

**Platform yang tersedia:** `INSTAGRAM` `TWITTER` `FACEBOOK` `TIKTOK` `YOUTUBE` `LINKEDIN`

**Status laporan:** `DRAFT` `PUBLISHED` `ARCHIVED`

### Health Check

```
GET /health
```

## Struktur Data (Prisma)

```
User
 └── Report (platform, startDate, endDate, status)
      └── Metric (name, value, unit)
```

Semua relasi menggunakan cascading delete — menghapus `User` menghapus semua `Report`-nya, menghapus `Report` menghapus semua `Metric`-nya.
