-- ==========================================================
-- SISTEM INFORMASI PERUMAHAN (SIP) - MIGRATION 001
-- Initial Schema: Tables, Relationships & Constraints
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('PENGURUS', 'WARGA')),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'NONAKTIF')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. HOUSES (Data Rumah)
CREATE TABLE IF NOT EXISTS public.houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block TEXT NOT NULL,
    house_number TEXT NOT NULL,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'KOSONG', 'NONAKTIF')),
    water_meter_number TEXT,
    water_status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (water_status IN ('AKTIF', 'NONAKTIF')),
    garbage_status TEXT NOT NULL DEFAULT 'AKTIF' CHECK (garbage_status IN ('AKTIF', 'NONAKTIF')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_house_block_number UNIQUE (block, house_number)
);

-- 3. RESIDENTS (Data Warga / Penghuni)
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    resident_status TEXT NOT NULL DEFAULT 'PEMILIK' CHECK (resident_status IN ('PEMILIK', 'PENGONTRAK', 'KELUARGA')),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WATER BILLS (Tagihan Air Berdasarkan Meter)
CREATE TABLE IF NOT EXISTS public.water_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- Format YYYY-MM, contoh: 2026-09
    previous_meter NUMERIC(10, 2) NOT NULL DEFAULT 0,
    current_meter NUMERIC(10, 2) NOT NULL DEFAULT 0,
    usage NUMERIC(10, 2) GENERATED ALWAYS AS (GREATEST(0, current_meter - previous_meter)) STORED,
    rate_per_m3 NUMERIC(12, 2) NOT NULL DEFAULT 3500,
    base_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    penalty NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'BELUM_BAYAR' CHECK (status IN ('BELUM_BAYAR', 'LUNAS', 'JATUH_TEMPO', 'DIBATALKAN')),
    meter_image_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_meter_validity CHECK (current_meter >= previous_meter),
    CONSTRAINT uq_water_bill_period UNIQUE (house_id, period)
);

-- 5. GARBAGE BILLS (Tagihan Sampah)
CREATE TABLE IF NOT EXISTS public.garbage_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- Format YYYY-MM
    amount NUMERIC(12, 2) NOT NULL DEFAULT 25000,
    penalty NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 25000,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'BELUM_BAYAR' CHECK (status IN ('BELUM_BAYAR', 'LUNAS', 'JATUH_TEMPO', 'DIBATALKAN')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_garbage_bill_period UNIQUE (house_id, period)
);

-- 6. PAYMENTS (Pencatatan Pembayaran)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('AIR', 'SAMPAH', 'LAINNYA')),
    water_bill_id UUID REFERENCES public.water_bills(id) ON DELETE SET NULL,
    garbage_bill_id UUID REFERENCES public.garbage_bills(id) ON DELETE SET NULL,
    period TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL DEFAULT 'TUNAI' CHECK (payment_method IN ('TUNAI', 'TRANSFER', 'LAINNYA')),
    reference_number TEXT,
    proof_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CASH TRANSACTIONS (Pemisahan 3 Kantong Dana: KAS_UMUM, DANA_AIR, DANA_SAMPAH)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fund_type TEXT NOT NULL CHECK (fund_type IN ('KAS_UMUM', 'DANA_AIR', 'DANA_SAMPAH')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('MASUK', 'KELUAR')),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    proof_url TEXT,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'VOID')),
    void_reason TEXT,
    void_at TIMESTAMPTZ,
    void_by UUID REFERENCES public.profiles(id),
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ANNOUNCEMENTS (Pengumuman Warga)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    published_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. AUDIT LOGS (Audit Trail Aktivitas Penting)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    role TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('HOUSING_NAME', 'Perumahan Griya Nusantara Mandiri (GNM)', 'Nama perumahan'),
('WATER_RATE_PER_M3', '3500', 'Tarif air default per m3 (Rp)'),
('GARBAGE_FEE_MONTHLY', '25000', 'Iuran sampah default per bulan (Rp)'),
('DUE_DATE_DAY_OF_MONTH', '20', 'Tanggal jatuh tempo bulanan (1-28)')
ON CONFLICT (key) DO NOTHING;
