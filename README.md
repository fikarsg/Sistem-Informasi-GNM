# Sistem Informasi Perumahan (SIP-GNM)
**Versi 1.0**

Website sistem informasi perumahan untuk mengelola data hunian, warga, pencatatan meter air, iuran kebersihan sampah, pencatatan kas masuk & kas keluar dengan pemisahan 3 kantong dana, laporan keuangan, transparansi warga, dan audit log.

---

## 🚀 Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Supabase Auth)
- **Auth & Middleware**: `@supabase/ssr` (Server Components, Route protection by Role)
- **Reporting & Export**: SheetJS (`xlsx`) & Print-ready styling
- **Deployment**: [Vercel](https://vercel.com/) (terhubung otomatis dengan GitHub)

---

## 📂 Struktur Modul & Navigasi

### 1. Panel Pengurus (`/admin`)
- **Dashboard**: Statistik rumah (aktif/kosong), total warga, tagihan bulan berjalan, status pelunasan, dan saldo 3 kantong dana independen.
- **Data Perumahan**:
  - `Data Rumah`: Manajemen blok, nomor rumah, status hunian, dan nomor meter air.
  - `Data Warga`: Data penghuni, kontak WhatsApp, status kepemilikan (Pemilik/Pengontrak/Keluarga).
- **Tagihan**:
  - `Tagihan Air`: Pencatatan meter awal & akhir, kalkulasi otomatis pemakaian $m^3$, tarif, denda, dan total tagihan.
  - `Tagihan Sampah`: Generator tagihan bulanan seluruh rumah aktif dalam 1 klik.
- **Catat Pembayaran**: Pencatatan pelunasan warga (tunai/transfer, nomor referensi) dan sinkronisasi otomatis status tagihan ke `LUNAS`.
- **Keuangan & Kas**: Pemisahan 3 Kantong Dana (`KAS_UMUM`, `DANA_AIR`, `DANA_SAMPAH`), saldo real-time, dan fitur pembatalan transaksi (`VOID`) tanpa hard delete (BR-006 & BR-008).
- **Laporan & Rekap**: Laporan kas periode, rekap tunggakan air, rekap tunggakan sampah, dan ekspor ke Excel (`.xlsx`).
- **Pengumuman**: Pembuatan dan publikasi pengumuman ke seluruh warga.
- **Audit Log**: Jejak audit riwayat aktivitas sistem.
- **Pengaturan**: Konfigurasi nama perumahan, tarif air dasar/m³, iuran sampah, dan batas tanggal jatuh tempo.

### 2. Portal Warga Mandiri (`/warga`)
- **Dashboard Warga**: Ringkasan hunian, tagihan air & sampah terbaru, total tagihan belum bayar, riwayat pembayaran terbaru, dan pengumuman.
- **Rumah Saya**: Info nomor rumah, nomor meter air, dan daftar penghuni terdaftar.
- **Tagihan Saya**: Rincian tagihan air (meter awal, akhir, m³) dan tagihan sampah.
- **Riwayat Pembayaran**: Catatan pembayaran rumah sendiri.
- **Transparansi Keuangan**: Laporan ringkasan kas bulanan (Pemasukan, Pengeluaran, Saldo per jenis dana) tanpa membocorkan privasi/nomor rekening warga lain.
- **Pengumuman**: Membaca surat edaran dan informasi resmi paguyuban.
- **Profil**: Mengubah kontak WhatsApp dan kata sandi.

---

## 🛠️ Panduan Setup Supabase (2 Menit)

1. Buka dashboard Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Buat Project Baru (misal dengan nama: `sip-gnm`).
3. Setelah project dibuat, buka menu **SQL Editor** -> klik **New Query**.
4. Buka file `supabase/all_migrations_combined.sql` yang ada di proyek ini, copy seluruh kodenya, paste ke SQL Editor Supabase, lalu klik **Run**.
5. Buka menu **Project Settings -> API**, salin:
   - **Project URL**
   - **Anon / Public Key**
6. Tempelkan ke file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## 💻 Menjalankan Secara Lokal

```bash
# 1. Install dependencies
npm run install

# 2. Jalankan server development
npm run dev

# 3. Buka di browser
# http://localhost:3000
```

---

## 🌐 Deployment ke Vercel

1. Push repository ke GitHub: `https://github.com/fikarsg/Sistem-Informasi-GNM`
2. Buka dashboard Vercel: [https://vercel.com/new](https://vercel.com/new)
3. Pilih repository `Sistem-Informasi-GNM`.
4. Tambahkan Environment Variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klik **Deploy**!
