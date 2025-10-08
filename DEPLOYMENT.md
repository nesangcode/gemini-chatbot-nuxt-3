# Deployment Guide

Panduan ini membantu Anda men-deploy aplikasi Gemini Chatbot ke Netlify dengan stack berikut:

- **Framework**: Nuxt 3
- **Autentikasi**: Logto
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Prisma
- **LLM**: Google Gemini 2.5 Pro melalui Vercel AI SDK

## Prasyarat

1. Akun Netlify
2. Akun Google AI Studio untuk akses API Gemini
3. Akun Logto dan sebuah aplikasi Web
4. Akun [Neon](https://neon.tech) untuk PostgreSQL serverless
5. Node.js 18+ terinstal secara lokal

## Variabel Lingkungan

Tambahkan variabel berikut pada lingkungan Netlify dan file `.env` lokal Anda:

```bash
# Database (Neon)
DATABASE_URL="postgresql://<user>:<password>@<endpoint>/<database>?sslmode=require"

# Google Gemini API Key
gemini_api_key="your_gemini_api_key_here"

# Logto
LOGTO_ENDPOINT="https://your-space.logto.app"
LOGTO_APP_ID="your_logto_app_id"
LOGTO_APP_SECRET="your_logto_app_secret"
LOGTO_COOKIE_ENCRYPTION_KEY="32_character_random_string"
LOGTO_BASE_URL="http://localhost:3000"
```

> Gunakan perintah `openssl rand -hex 16` atau generator rahasia lain untuk menghasilkan nilai `LOGTO_COOKIE_ENCRYPTION_KEY`.

## Langkah Setup

### 1. Siapkan Neon PostgreSQL

1. Masuk ke dashboard Neon dan buat project baru.
2. Buat database branch dan catat connection string (format `postgresql://...`).
3. Salin nilai tersebut ke `DATABASE_URL`.
4. Jalankan migrasi/schema Prisma secara lokal:
   ```bash
   npx prisma db push
   ```
   atau pada pipeline CI/CD gunakan `npx prisma migrate deploy`.

### 2. Konfigurasi Logto

1. Dari dashboard Logto buat aplikasi tipe **Web**.
2. Tambahkan redirect URL berikut:
   - Development: `http://localhost:3000/callback`
   - Production (Netlify): `https://<nama-site-netlify>.netlify.app/callback`
3. Tambahkan post sign-out redirect:
   - Development: `http://localhost:3000`
   - Production: `https://<nama-site-netlify>.netlify.app`
4. Salin `endpoint`, `appId`, dan `appSecret` ke variabel lingkungan.
5. Setel `LOGTO_BASE_URL` sesuai domain aplikasi:
   - Development: `http://localhost:3000`
   - Production: `https://<nama-site-netlify>.netlify.app`

### 3. Konfigurasi Google Gemini 2.5 Pro

1. Buka [Google AI Studio](https://ai.google.dev/) dan buat API key baru.
2. Simpan key tersebut sebagai `GEMINI_API_KEY`.

### 4. Konfigurasi proyek Nuxt

1. Salin `.env.example` menjadi `.env` dan isi nilai sesuai layanan di atas.
2. Jalankan perintah berikut untuk instalasi dan persiapan lokal:
   ```bash
   npm install
   npx prisma generate
   npm run dev
   ```
3. Verifikasi alur berikut secara lokal:
   - Login via Logto
   - Membuat sesi chat baru
   - Mengirim pesan (streaming Gemini)
   - Melihat riwayat percakapan

### 5. Deploy ke Netlify

1. Push kode ke repository Git (GitHub/GitLab/Bitbucket).
2. Hubungkan repository ke Netlify.
3. Pada pengaturan build Netlify, gunakan konfigurasi:
   - Build command: `npm run build`
   - Publish directory: `.output/public`
   - Node version: `18`
4. Tambahkan semua variabel lingkungan pada menu **Site settings → Environment variables**.
5. Deploy ulang situs.

### 6. Verifikasi Pasca-Deploy

- Buka URL Netlify dan pastikan alur login → chat → riwayat berfungsi normal.
- Periksa tabel `users`, `chat_sessions`, dan `messages` di Neon untuk memastikan data tersimpan.
- Pantau log fungsi Netlify jika terjadi kesalahan.

## Troubleshooting

| Masalah | Solusi |
| ------- | ------ |
| Build gagal | Pastikan `npm install` selesai tanpa error dan Prisma Client sudah tergenerate (`npx prisma generate`). |
| Tidak bisa login | Periksa pengaturan redirect URL Logto serta variabel lingkungan terkait Logto. |
| Chat tidak merespon | Pastikan `GEMINI_API_KEY` valid dan tidak melebihi kuota. Cek log fungsi Netlify untuk error detail. |
| Koneksi database gagal | Verifikasi `DATABASE_URL` Neon, pastikan opsi `sslmode=require` disertakan. |

## Keamanan

- Jangan commit file `.env` ke repository.
- Putar (rotate) API key dan secret secara berkala.
- Batasi akses database Neon hanya untuk IP yang diperlukan jika memungkinkan.
- Aktifkan fitur monitoring/alert di masing-masing layanan.

Selamat! Aplikasi chatbot Anda kini siap digunakan di Netlify dengan autentikasi Logto, database Neon, dan streaming Gemini 2.5 Pro.
