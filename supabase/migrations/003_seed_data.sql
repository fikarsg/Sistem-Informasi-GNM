-- ==========================================================
-- SISTEM INFORMASI PERUMAHAN (SIP) - MIGRATION 003
-- Seed Initial Data: Rumah Contoh, Pengumuman Perdana & Rekap
-- ==========================================================

-- 1. DATA RUMAH CONTOH (Blok A, B, C)
INSERT INTO public.houses (block, house_number, address, status, water_meter_number, notes) VALUES
('A', '01', 'Jl. Nusantara 1 No. 01', 'AKTIF', 'WM-A01', 'Dekat pos satpam utama'),
('A', '02', 'Jl. Nusantara 1 No. 02', 'AKTIF', 'WM-A02', ''),
('A', '03', 'Jl. Nusantara 1 No. 03', 'AKTIF', 'WM-A03', ''),
('A', '04', 'Jl. Nusantara 1 No. 04', 'KOSONG', 'WM-A04', 'Renovasi'),
('B', '01', 'Jl. Nusantara 2 No. 01', 'AKTIF', 'WM-B01', ''),
('B', '02', 'Jl. Nusantara 2 No. 02', 'AKTIF', 'WM-B02', ''),
('B', '03', 'Jl. Nusantara 2 No. 03', 'AKTIF', 'WM-B03', ''),
('C', '01', 'Jl. Nusantara 3 No. 01', 'AKTIF', 'WM-C01', ''),
('C', '02', 'Jl. Nusantara 3 No. 02', 'AKTIF', 'WM-C02', '')
ON CONFLICT (block, house_number) DO NOTHING;

-- 2. PENGUMUMAN PERDANA
INSERT INTO public.announcements (title, content, status, published_at) VALUES
(
    'Selamat Datang di Sistem Informasi Perumahan (SIP-GNM)',
    'Sistem Informasi Perumahan resmi diluncurkan untuk mempermudah pengecekan tagihan air, tagihan sampah, dan riwayat pembayaran, serta menyajikan transparansi pengelolaan keuangan kas perumahan kita. Silakan periksa data rumah dan tagihan masing-masing.',
    'PUBLISHED',
    now()
),
(
    'Jadwal Pengambilan Sampah & Batas Pembayaran Bulanan',
    'Pengambilan sampah rutin setiap hari Selasa, Kamis, dan Sabtu pagi. Pembayaran tagihan air dan iuran kebersihan sampah jatuh tempo setiap tanggal 20 setiap bulannya. Mohon dapat melakukan pelunasan tepat waktu demi kelancaran operasional bersama.',
    'PUBLISHED',
    now()
);

-- 3. INITIAL KAS TRANSACTIONS (Saldo Awal Contoh)
INSERT INTO public.cash_transactions (transaction_date, fund_type, transaction_type, category, amount, description, status) VALUES
(CURRENT_DATE - INTERVAL '30 days', 'KAS_UMUM', 'MASUK', 'Saldo Awal', 5000000, 'Saldo kas umum pembukaan sistem', 'VALID'),
(CURRENT_DATE - INTERVAL '30 days', 'DANA_AIR', 'MASUK', 'Saldo Awal', 2500000, 'Saldo kas air pembukaan sistem', 'VALID'),
(CURRENT_DATE - INTERVAL '30 days', 'DANA_SAMPAH', 'MASUK', 'Saldo Awal', 1200000, 'Saldo kas sampah pembukaan sistem', 'VALID');
