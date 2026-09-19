-- ==============================================================================
-- SISTEM INFORMASI PERUMAHAN (SIP-GNM)
-- RUN THIS COMPLETE SCRIPT IN SUPABASE SQL EDITOR
-- (Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
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

CREATE TABLE IF NOT EXISTS public.water_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.garbage_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('HOUSING_NAME', 'Perumahan Griya Nusantara Mandiri (GNM)', 'Nama perumahan'),
('WATER_RATE_PER_M3', '3500', 'Tarif air default per m3 (Rp)'),
('GARBAGE_FEE_MONTHLY', '25000', 'Iuran sampah default per bulan (Rp)'),
('DUE_DATE_DAY_OF_MONTH', '20', 'Tanggal jatuh tempo bulanan (1-28)')
ON CONFLICT (key) DO NOTHING;

-- 3. FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_pengurus()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'PENGURUS' AND status = 'AKTIF'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_house_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT house_id FROM public.residents
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garbage_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Pengurus full access on profiles" ON public.profiles;
CREATE POLICY "Pengurus full access on profiles" ON public.profiles FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own phone or name" ON public.profiles;
CREATE POLICY "Users can update their own phone or name" ON public.profiles FOR UPDATE
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Houses
DROP POLICY IF EXISTS "Pengurus full access on houses" ON public.houses;
CREATE POLICY "Pengurus full access on houses" ON public.houses FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Warga view own house" ON public.houses;
CREATE POLICY "Warga view own house" ON public.houses FOR SELECT
USING (id = public.get_user_house_id());

-- Residents
DROP POLICY IF EXISTS "Pengurus full access on residents" ON public.residents;
CREATE POLICY "Pengurus full access on residents" ON public.residents FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Warga view own resident profile" ON public.residents;
CREATE POLICY "Warga view own resident profile" ON public.residents FOR SELECT
USING (user_id = auth.uid());

-- Water bills
DROP POLICY IF EXISTS "Pengurus full access on water_bills" ON public.water_bills;
CREATE POLICY "Pengurus full access on water_bills" ON public.water_bills FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Warga view own water bills" ON public.water_bills;
CREATE POLICY "Warga view own water bills" ON public.water_bills FOR SELECT
USING (house_id = public.get_user_house_id());

-- Garbage bills
DROP POLICY IF EXISTS "Pengurus full access on garbage_bills" ON public.garbage_bills;
CREATE POLICY "Pengurus full access on garbage_bills" ON public.garbage_bills FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Warga view own garbage bills" ON public.garbage_bills;
CREATE POLICY "Warga view own garbage bills" ON public.garbage_bills FOR SELECT
USING (house_id = public.get_user_house_id());

-- Payments
DROP POLICY IF EXISTS "Pengurus full access on payments" ON public.payments;
CREATE POLICY "Pengurus full access on payments" ON public.payments FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Warga view own payments" ON public.payments;
CREATE POLICY "Warga view own payments" ON public.payments FOR SELECT
USING (house_id = public.get_user_house_id());

-- Cash transactions
DROP POLICY IF EXISTS "Pengurus full access on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Pengurus full access on cash_transactions" ON public.cash_transactions FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Warga can view valid transactions for transparency" ON public.cash_transactions;
CREATE POLICY "Warga can view valid transactions for transparency" ON public.cash_transactions FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'VALID');

-- Announcements
DROP POLICY IF EXISTS "Pengurus full access on announcements" ON public.announcements;
CREATE POLICY "Pengurus full access on announcements" ON public.announcements FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

DROP POLICY IF EXISTS "Anyone authenticated can view published announcements" ON public.announcements;
CREATE POLICY "Anyone authenticated can view published announcements" ON public.announcements FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'PUBLISHED');

-- Audit logs
DROP POLICY IF EXISTS "Pengurus full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Pengurus full access on audit_logs" ON public.audit_logs FOR ALL
USING (public.is_pengurus());

-- System Settings
DROP POLICY IF EXISTS "Anyone authenticated can view system_settings" ON public.system_settings;
CREATE POLICY "Anyone authenticated can view system_settings" ON public.system_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Pengurus manage system_settings" ON public.system_settings;
CREATE POLICY "Pengurus manage system_settings" ON public.system_settings FOR ALL
USING (public.is_pengurus()) WITH CHECK (public.is_pengurus());

-- 5. VIEW TRANSPARANSI KEUANGAN (PRD 20)
CREATE OR REPLACE VIEW public.v_transparansi_keuangan AS
SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') AS periode,
    fund_type,
    SUM(CASE WHEN transaction_type = 'MASUK' THEN amount ELSE 0 END) AS total_pemasukan,
    SUM(CASE WHEN transaction_type = 'KELUAR' THEN amount ELSE 0 END) AS total_pengeluaran,
    SUM(CASE WHEN transaction_type = 'MASUK' THEN amount ELSE -amount END) AS saldo_periode
FROM public.cash_transactions
WHERE status = 'VALID'
GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), fund_type
ORDER BY periode DESC;

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'WARGA'),
    'AKTIF'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_payment_inserted()
RETURNS TRIGGER AS $$
DECLARE
    v_fund_type TEXT;
    v_cat TEXT;
    v_desc TEXT;
BEGIN
    IF NEW.payment_type = 'AIR' AND NEW.water_bill_id IS NOT NULL THEN
        UPDATE public.water_bills
        SET status = 'LUNAS', updated_at = now()
        WHERE id = NEW.water_bill_id;
        
        v_fund_type := 'DANA_AIR';
        v_cat := 'Pembayaran Tagihan Air';
        v_desc := 'Pembayaran Air Periode ' || NEW.period;
        
    ELSIF NEW.payment_type = 'SAMPAH' AND NEW.garbage_bill_id IS NOT NULL THEN
        UPDATE public.garbage_bills
        SET status = 'LUNAS', updated_at = now()
        WHERE id = NEW.garbage_bill_id;
        
        v_fund_type := 'DANA_SAMPAH';
        v_cat := 'Pembayaran Tagihan Sampah';
        v_desc := 'Pembayaran Sampah Periode ' || NEW.period;
        
    ELSE
        v_fund_type := 'KAS_UMUM';
        v_cat := 'Penerimaan Iuran / Lainnya';
        v_desc := 'Penerimaan Pembayaran Periode ' || NEW.period;
    END IF;

    INSERT INTO public.cash_transactions (
        transaction_date,
        fund_type,
        transaction_type,
        category,
        amount,
        description,
        proof_url,
        payment_id,
        status,
        recorded_by
    ) VALUES (
        NEW.payment_date,
        v_fund_type,
        'MASUK',
        v_cat,
        NEW.amount,
        v_desc,
        NEW.proof_url,
        NEW.id,
        'VALID',
        NEW.recorded_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_inserted ON public.payments;
CREATE TRIGGER on_payment_inserted
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_payment_inserted();

-- 7. INITIAL SAMPLE DATA
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

INSERT INTO public.cash_transactions (transaction_date, fund_type, transaction_type, category, amount, description, status) VALUES
(CURRENT_DATE - INTERVAL '30 days', 'KAS_UMUM', 'MASUK', 'Saldo Awal', 5000000, 'Saldo kas umum pembukaan sistem', 'VALID'),
(CURRENT_DATE - INTERVAL '30 days', 'DANA_AIR', 'MASUK', 'Saldo Awal', 2500000, 'Saldo kas air pembukaan sistem', 'VALID'),
(CURRENT_DATE - INTERVAL '30 days', 'DANA_SAMPAH', 'MASUK', 'Saldo Awal', 1200000, 'Saldo kas sampah pembukaan sistem', 'VALID');
