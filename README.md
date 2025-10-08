# Gemini Chatbot Nuxt 3

A full-stack chatbot built with **Nuxt 3**, **Logto**, **Neon PostgreSQL**, **Prisma**, **Vercel AI SDK**, and **Google Gemini 2.5 Pro**. Users can masuk dengan Logto, membuat sesi percakapan baru, melihat riwayat, dan berinteraksi dengan Gemini secara streaming real-time.

## Fitur Utama

- Autentikasi aman menggunakan Logto (SSO & session management).
- Penyimpanan riwayat percakapan di Neon PostgreSQL melalui Prisma.
- UI responsif dengan Tailwind CSS & Shadcn-Vue components.
- Streaming respons Gemini 2.5 Pro menggunakan Vercel AI SDK (`useChat`).
- Dukungan multi sesi, penamaan sesi otomatis, dan riwayat tersinkron.

## Persiapan Lingkungan

Salin `.env` contoh dan isi variabel berikut:

```bash
DATABASE_URL="postgresql://<user>:<password>@<endpoint>/<database>?sslmode=require"
GEMINI_API_KEY="..."
LOGTO_ENDPOINT="https://<space>.logto.app"
LOGTO_APP_ID="..."
LOGTO_APP_SECRET="..."
LOGTO_COOKIE_ENCRYPTION_KEY="openssl rand -hex 16"
LOGTO_BASE_URL="http://localhost:3000"
```

> Gunakan koneksi Neon (serverless PostgreSQL) dan pastikan opsi `sslmode=require` terpasang.

Atur `LOGTO_BASE_URL` ke domain aplikasi Anda. Nilai default `http://localhost:3000` cocok untuk pengembangan lokal, sedangkan di produksi (mis. Netlify) gunakan URL publik situs Anda.

## Instalasi

```bash
npm install
npx prisma generate
```

### Migrasi Database

```bash
npx prisma db push   # atau prisma migrate deploy di CI/CD
```

## Menjalankan Aplikasi

```bash
npm run dev
```

Akses aplikasi di `http://localhost:3000`. Pastikan Anda telah mengatur aplikasi Logto dengan redirect URL `http://localhost:3000/callback`.

### Debug alur masuk Logto

Tambahkan parameter `?debug` pada halaman `/sign-in` atau `/callback/continue` untuk melihat snapshot state autentikasi (nilai cookie redirect, query yang terbaca, hingga tujuan akhir yang akan dipakai). Mode debug menonaktifkan pengalihan otomatis sehingga Anda bisa menelusuri langkah demi langkah sebelum melanjutkan secara manual.

## Build Production

```bash
npm run build
npm run preview
```

## Deployment

Lihat `DEPLOYMENT.md` untuk langkah detail men-deploy ke Netlify, termasuk konfigurasi Logto, Neon, dan Google Gemini.
