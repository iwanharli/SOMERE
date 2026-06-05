# SOMERE — Social Media Report Dashboard

SORE adalah aplikasi fullstack premium berbasis web untuk membuat, memantau, dan mengelola laporan analitik serta penugasan report media sosial secara real-time. Aplikasi ini terintegrasi langsung dengan **Panelin API** sebagai penyedia layanan SMM Panel untuk memproses penugasan secara otomatis.

---

## 🎨 Visual Design & UX Highlights

SORE dirancang dengan estetika modern bergaya _dark mode_ premium, _glassmorphism_, dan mikro-animasi yang responsif. Beberapa komponen visual unggulan meliputi:

### 1. Donut Chart (Distribusi Alasan Pelaporan)

- **Visual Centered Counter**: Lingkaran donut dilengkapi dengan teks total laporan di bagian tengah yang diatur menggunakan `zIndex: 10` untuk visibilitas tanpa hambatan visual.
- **Translucent Guide Ring**: Track lingkaran transparan (`rgba(255, 255, 255, 0.04)`) di bawah irisan data nyata untuk memberikan tampilan elegan saat data sedang sedikit atau kosong.
- **Custom HTML Legend**: Legenda interaktif di sebelah kanan yang secara otomatis memotong teks panjang (`text-ellipsis`), dilengkapi indikator warna bercahaya, jumlah tugas, dan persentase kontribusi.

### 2. Kalender Aktivitas Heatmap (Git-Style)

- **Sunday Column Alignment**: Awal kalender disinkronkan untuk selalu dimulai pada hari **Minggu** (53 minggu lalu), menghilangkan area kosong di awal kisi dan membentuk persegi panjang utuh yang rapi.
- **Anti-Overlapping Month Labels**: Nama bulan otomatis disembunyikan jika letaknya berjarak kurang dari 3 minggu dari label sebelumnya, menghindari penumpukan tulisan (seperti `MeiJun`).
- **Synchronized Scroll Container**: Label bulan dan kisi hari dibungkus dalam satu kontainer gulir horizontal sehingga keduanya bergeser bersama secara presisi.
- **Detailed Stats Footer**: Bagian bawah kalender dilengkapi ringkasan statistik kontribusi: _Total Laporan_, _Hari Aktif_, _Rata-Rata harian_, dan _Rekor Laporan Sehari_.
- **Translucent Gold Scrollbar**: Scrollbar kustom bertema emas transparan yang menyatu dengan palet warna utama dasbor.

### 3. Orders Task Cards

- **Header Teratur**: Menampilkan logo platform media sosial (Instagram, TikTok, dll.) di pojok kiri atas, status tugas di tengah, dan tanggal/waktu di pojok kanan atas.
- **Status Sync dengan Auto-Refresh**: Indikator status dilengkapi dot berdenyut (_pulsing_) dan didukung interval latar belakang otomatis yang memperbarui status setiap 15 detik tanpa mengganggu interaksi pengguna.
- **Monospace URL Box**: Tautan target ditampilkan dalam blok kode monospace dengan tombol sekali-klik untuk menyalin tautan dan membuka tautan eksternal.

---

## ⚙️ Fitur Utama

### 👤 Role: User

- **Dasbor Statistik**: Ringkasan saldo token, total tugas, tugas selesai, dan tugas aktif.
- **Diagram Distribusi**: Pembagian kategori alasan laporan (Scam, Pelecehan, Konten Dewasa, dll.) dalam bentuk donut chart dan diagram batang per platform.
- **Riwayat Transaksi Token**: Daftar penambahan/pengurangan token lengkap dengan nomor referensi tugas dan catatan transaksi.
- **Pemesanan Tugas Baru**: Form pemesanan tugas report dengan kalkulasi kebutuhan token real-time sebelum order dikirim.
- **Sistem Token Otomatis**: Transaksi dihitung berdasarkan harga token per layanan. Saldo token otomatis dikembalikan (_refund_) jika tugas dibatalkan atau selesai sebagian (_partial_).

### 👑 Role: Admin

- **Dasbor Ringkasan Platform**: Memantau perputaran token beredar, token terpakai, sisa token pengguna, total saldo uang rupiah di Panelin, dan akumulasi pengeluaran.
- **Manajemen Pengguna**: Menyetujui pendaftaran user baru (`ACTIVE`), menangguhkan akun (`SUSPENDED`), dan mengedit profil.
- **Manajemen Pengajuan Token**: Menyetujui atau menolak permintaan penambahan saldo token dari pengguna.
- **Konfigurasi Layanan**: Mengatur status keaktifan layanan SMM dan menyesuaikan harga token per jenis laporan media sosial.

---

## 💻 Teknologi yang Digunakan

### Frontend (React Workspace)

- **Core Framework**: React 18, Vite, TypeScript, React Router Dom.
- **Charts Engine**: Recharts (dioptimalkan dengan linear gradient shaders dan custom tooltip overlay).
- **Styling**: Vanilla CSS Variables (sistem token warna terpusat), FontAwesome React Icons.
- **State Management**: Zustand (untuk autentikasi dan status sesi).

### Backend (Express Workspace)

- **Core Runtime**: Node.js, Express.js, TypeScript.
- **Database ORM**: Prisma ORM dengan PostgreSQL.
- **Security & Auth**: JWT (JSON Web Tokens), bcryptjs, Express Rate Limit, Helmet.

---

## 📂 Struktur Project

```
sore/
├── backend/                  # REST API server (TypeScript)
│   ├── prisma/               # Schema & Migrasi Database
│   │   ├── migrations/
│   │   └── schema.prisma     # Prisma Data Model
│   ├── src/
│   │   ├── lib/              # Client Prisma, Utils
│   │   ├── routes/           # Endpoint & Logika Router (auth, token, dashboard, panelin)
│   │   └── index.ts          # Server entry point
│   └── package.json
│
├── frontend/                 # React SPA Client (Vite)
│   ├── src/
│   │   ├── components/       # Komponen UI Reusable (Layout, Icon, Cards)
│   │   ├── lib/              # Konfigurasi Axios API client, detektor platform
│   │   ├── pages/            # Halaman Web (Dashboard, Orders, Settings, Users, TokenRequest)
│   │   ├── store/            # State Store (Zustand auth store)
│   │   ├── index.css         # Token Desain & Gaya Global
│   │   └── main.tsx          # React Entry point
│   └── package.json
│
├── .env.example              # Template variabel lingkungan
└── package.json              # NPM Workspaces & global scripts
```

---

## 🚀 Panduan Instalasi & Setup

### 1. Prasyarat

- **Node.js** v18 atau versi terbaru.
- **PostgreSQL** database server yang sudah berjalan.
- **Panelin API Key** yang aktif.

### 2. Konfigurasi Environment

Buat salinan file `.env.example` menjadi `.env` di folder root:

```bash
cp .env.example .env
```

Sesuaikan konfigurasi variabel lingkungan berikut:

```env
# Koneksi PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/db_sore"

# Konfigurasi Backend
PORT=5000
NODE_ENV=development
JWT_SECRET="masukkan_kunci_rahasia_jwt_disini"

# CORS & Asal Request
CORS_ORIGIN="http://localhost:5173"

# Panelin SMM API
PANELIN_API_KEY="api_key_panelin_anda"
PANELIN_API_URL="https://api.panelin.id"

# Konfigurasi API Frontend (React)
VITE_API_URL="http://localhost:5000/api"
```

### 3. Instalasi Dependensi

Jalankan perintah berikut di folder root project untuk menginstal paket dependensi di semua workspace secara otomatis:

```bash
npm run install:all
```

### 4. Setup Database & Seeding

Jalankan migrasi Prisma untuk membuat tabel di database PostgreSQL Anda:

```bash
npm run db:generate
npm run db:migrate
```

### 5. Menjalankan Aplikasi Secara Lokal

Jalankan server pengembangan untuk backend dan frontend secara bersamaan dengan satu perintah:

```bash
npm run dev
```

- Frontend berjalan di: `http://localhost:5173/` (atau `http://localhost:5174/` jika port 5173 sibuk).
- Backend API berjalan di: `http://localhost:5000/`.

---

## 🌐 Referensi Panelin API

SORE menggunakan spesifikasi **Panelin API v1.0.0** untuk pertukaran data. Berikut detail integrasi API eksternal yang didukung:

### Autentikasi Panelin

Semua permintaan ke API Panelin wajib menyertakan token autentikasi pada header HTTP:

```http
Authorization: Bearer <API_TOKEN>
```

### Spesifikasi Endpoints

#### 1. Saldo (Balance)

- **Method & Endpoint**: `GET /balance`
- **Keterangan**: Mengambil saldo IDR saat ini di akun Panelin.
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "balance": 150000,
      "currency": "IDR"
    },
    "meta": null
  }
  ```

#### 2. Layanan (Services)

- **Method & Endpoint**: `GET /services`
- **Keterangan**: Mengambil semua daftar layanan SMM Panel.
- **Response 200**:

  ```json
  {
    "success": true,
    "data": "[ ...raw json string... ]",
    "meta": null
  }
  ```

- **Method & Endpoint**: `GET /services/{service_id}`
- **Keterangan**: Mengambil informasi detail satu layanan spesifik.
- **Response 200**:
  ```json
  {
    "success": true,
    "data": {
      "id": 42,
      "name": "Instagram Report Post [High Quality]",
      "description": "Layanan pelaporan postingan Instagram",
      "category": "Instagram",
      "type": "Default",
      "rate": 5000,
      "min": 100,
      "max": 5000,
      "dripfeed": false,
      "refill": true,
      "cancel": false
    },
    "meta": null
  }
  ```

#### 3. Penugasan (Orders)

- **Method & Endpoint**: `POST /orders`
- **Keterangan**: Membuat penugasan report/SMM baru ke Panelin.
- **Request Body**:
  ```json
  {
    "service": 42,
    "link": "https://www.instagram.com/p/xxxx/",
    "quantity": 500
  }
  ```
- **Response 210/201**:

  ```json
  {
    "success": true,
    "data": {
      "id": 1001,
      "service_id": 42,
      "link": "https://www.instagram.com/p/xxxx/",
      "quantity": 500,
      "rate": 5000,
      "charge": 2500,
      "start_count": null,
      "remains": null,
      "status": "pending",
      "comments": null,
      "created_at": "2026-06-04T10:00:00.000000Z",
      "updated_at": "2026-06-04T10:00:00.000000Z"
    },
    "meta": null
  }
  ```

- **Method & Endpoint**: `GET /orders`
- **Keterangan**: Mengambil riwayat daftar order terpaginasi.

- **Method & Endpoint**: `GET /orders/{order_id}`
- **Keterangan**: Mengambil detail status terbaru dari order spesifik.

---

## 🛠️ Perintah NPM (Scripts)

Daftar perintah yang dapat Anda jalankan di folder root:

| Perintah              | Keterangan                                                                   |
| :-------------------- | :--------------------------------------------------------------------------- |
| `npm run install:all` | Menginstal dependencies untuk root, backend, dan frontend.                   |
| `npm run dev`         | Menjalankan server backend dan client frontend secara bersamaan.             |
| `npm run build`       | Melakukan compile TypeScript backend dan bundling production build frontend. |
| `npm run db:generate` | Melakukan sinkronisasi generator schema Prisma Client.                       |
| `npm run db:migrate`  | Menjalankan proses migrasi database skema ke PostgreSQL.                     |
| `npm run db:studio`   | Membuka antarmuka grafis Prisma Studio untuk melihat database secara visual. |
