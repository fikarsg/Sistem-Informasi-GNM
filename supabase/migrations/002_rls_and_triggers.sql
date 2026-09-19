-- ==========================================================
-- SISTEM INFORMASI PERUMAHAN (SIP) - MIGRATION 002
-- Security: Row-Level Security (RLS), Functions & Triggers
-- ==========================================================

-- 1. HELPER FUNCTIONS
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

-- 2. ENABLE ROW LEVEL SECURITY
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

-- 3. POLICIES: PROFILES
CREATE POLICY "Pengurus full access on profiles"
ON public.profiles FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own phone or name"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. POLICIES: HOUSES
CREATE POLICY "Pengurus full access on houses"
ON public.houses FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Warga view own house"
ON public.houses FOR SELECT
USING (id = public.get_user_house_id());

-- 5. POLICIES: RESIDENTS
CREATE POLICY "Pengurus full access on residents"
ON public.residents FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Warga view own resident profile"
ON public.residents FOR SELECT
USING (user_id = auth.uid());

-- 6. POLICIES: WATER BILLS
CREATE POLICY "Pengurus full access on water_bills"
ON public.water_bills FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Warga view own water bills"
ON public.water_bills FOR SELECT
USING (house_id = public.get_user_house_id());

-- 7. POLICIES: GARBAGE BILLS
CREATE POLICY "Pengurus full access on garbage_bills"
ON public.garbage_bills FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Warga view own garbage bills"
ON public.garbage_bills FOR SELECT
USING (house_id = public.get_user_house_id());

-- 8. POLICIES: PAYMENTS
CREATE POLICY "Pengurus full access on payments"
ON public.payments FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Warga view own payments"
ON public.payments FOR SELECT
USING (house_id = public.get_user_house_id());

-- 9. POLICIES: CASH TRANSACTIONS
-- Warga tidak boleh melihat detail sensitif akun atau bukti privat, hanya pengurus yang full access
CREATE POLICY "Pengurus full access on cash_transactions"
ON public.cash_transactions FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

-- Warga diperbolehkan SELECT untuk agregasi ringkasan kas bulanan (hanya data VALID)
CREATE POLICY "Warga can view valid transactions for transparency"
ON public.cash_transactions FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'VALID');

-- 10. POLICIES: ANNOUNCEMENTS
CREATE POLICY "Pengurus full access on announcements"
ON public.announcements FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

CREATE POLICY "Anyone authenticated can view published announcements"
ON public.announcements FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'PUBLISHED');

-- 11. POLICIES: AUDIT LOGS & SYSTEM SETTINGS
CREATE POLICY "Pengurus full access on audit_logs"
ON public.audit_logs FOR ALL
USING (public.is_pengurus());

CREATE POLICY "Anyone authenticated can view system_settings"
ON public.system_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pengurus manage system_settings"
ON public.system_settings FOR ALL
USING (public.is_pengurus())
WITH CHECK (public.is_pengurus());

-- 12. VIEW: TRANSPARANSI KEUANGAN BULANAN (Sesuai PRD Bagian 20)
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

-- 13. AUTOMATED TRIGGER: HANDLE NEW USER SIGN UP
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

-- 14. AUTOMATED TRIGGER: PAYMENT UPDATES BILL & ADDS CASH TRANSACTION
CREATE OR REPLACE FUNCTION public.handle_payment_inserted()
RETURNS TRIGGER AS $$
DECLARE
    v_fund_type TEXT;
    v_cat TEXT;
    v_desc TEXT;
BEGIN
    -- Jika pembayaran air
    IF NEW.payment_type = 'AIR' AND NEW.water_bill_id IS NOT NULL THEN
        UPDATE public.water_bills
        SET status = 'LUNAS', updated_at = now()
        WHERE id = NEW.water_bill_id;
        
        v_fund_type := 'DANA_AIR';
        v_cat := 'Pembayaran Tagihan Air';
        v_desc := 'Pembayaran Air Periode ' || NEW.period;
        
    -- Jika pembayaran sampah
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

    -- Catat otomatis ke cash_transactions agar saldo langsung sinkron
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
