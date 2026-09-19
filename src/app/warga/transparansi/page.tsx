'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FinancialSummary } from '@/lib/types/database';
import { formatRupiah, formatPeriodIndo } from '@/lib/utils';
import { PieChart, ShieldCheck, Wallet, Droplet, Trash2, Loader2 } from 'lucide-react';

export default function WargaTransparansiPage() {
  const [summaries, setSummaries] = useState<FinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));

  const supabase = createClient();

  useEffect(() => {
    async function fetchFinancialTransparency() {
      setLoading(true);
      // Fetch from the secure VIEW created in migration 002
      const { data, error } = await supabase
        .from('v_transparansi_keuangan')
        .select('*');

      if (!error && data) {
        setSummaries(data);
      }
      setLoading(false);
    }

    fetchFinancialTransparency();
  }, []);

  // Filter for selected period
  const periodData = summaries.filter((s) => s.periode === selectedPeriod);

  const kasUmum = periodData.find((s) => s.fund_type === 'KAS_UMUM');
  const danaAir = periodData.find((s) => s.fund_type === 'DANA_AIR');
  const danaSampah = periodData.find((s) => s.fund_type === 'DANA_SAMPAH');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <PieChart className="w-6 h-6 text-emerald-600" />
          Transparansi Keuangan Perumahan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Laporan keterbukaan kas perumahan bulanan sesuai prinsip transparansi warga (PRD Bagian 20).
        </p>
      </div>

      {/* Info notice about transparency privacy */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Transparansi Terpercaya & Terjaga</p>
          <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
            Data disajikan dalam bentuk rekapitulasi pemasukan, pengeluaran, dan saldo per kantong dana untuk menjamin akuntabilitas tanpa memperlihatkan nomor rekening atau privasi transaksi pribadi warga.
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-700">Pilih Periode Bulan:</span>
        <input
          type="month"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Memuat ringkasan kas transparansi...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kas Umum */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kas Umum</h3>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {formatPeriodIndo(selectedPeriod)}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Pemasukan:</span>
                <span className="font-semibold text-emerald-700">
                  {formatRupiah(kasUmum?.total_pemasukan || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pengeluaran:</span>
                <span className="font-semibold text-rose-700">
                  {formatRupiah(kasUmum?.total_pengeluaran || 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Surplus / Defisit:</span>
                <span className={kasUmum && kasUmum.saldo_periode >= 0 ? 'text-blue-900' : 'text-rose-700'}>
                  {formatRupiah(kasUmum?.saldo_periode || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Dana Air */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Droplet className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dana Air</h3>
              </div>
              <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                {formatPeriodIndo(selectedPeriod)}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Pemasukan Tagihan:</span>
                <span className="font-semibold text-emerald-700">
                  {formatRupiah(danaAir?.total_pemasukan || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Operasional:</span>
                <span className="font-semibold text-rose-700">
                  {formatRupiah(danaAir?.total_pengeluaran || 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Surplus / Defisit:</span>
                <span className={danaAir && danaAir.saldo_periode >= 0 ? 'text-cyan-900' : 'text-rose-700'}>
                  {formatRupiah(danaAir?.saldo_periode || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Dana Sampah */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dana Sampah</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {formatPeriodIndo(selectedPeriod)}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Penerimaan Iuran:</span>
                <span className="font-semibold text-emerald-700">
                  {formatRupiah(danaSampah?.total_pemasukan || 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Angkut:</span>
                <span className="font-semibold text-rose-700">
                  {formatRupiah(danaSampah?.total_pengeluaran || 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Surplus / Defisit:</span>
                <span className={danaSampah && danaSampah.saldo_periode >= 0 ? 'text-emerald-900' : 'text-rose-700'}>
                  {formatRupiah(danaSampah?.saldo_periode || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
