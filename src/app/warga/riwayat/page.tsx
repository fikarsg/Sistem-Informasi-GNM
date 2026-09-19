'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Payment } from '@/lib/types/database';
import { formatRupiah, formatDateIndo, formatPeriodIndo } from '@/lib/utils';
import { History, Loader2, CheckCircle2, Calendar, Receipt } from 'lucide-react';

export default function WargaRiwayatPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: resident } = await supabase
        .from('residents')
        .select('house_id')
        .eq('user_id', user.id)
        .single();

      if (resident?.house_id) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('house_id', resident.house_id)
          .order('payment_date', { ascending: false });

        if (data) setPayments(data);
      }
      setLoading(false);
    }

    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          Riwayat Pembayaran Rumah Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Semua catatan pelunasan tagihan air & sampah yang telah diverifikasi oleh pengurus.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs">Memuat riwayat pembayaran...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
          Belum ada riwayat pembayaran untuk rumah ini.
        </div>
      ) : (
        <>
          {/* Mobile View: Card List (Khusus Layar HP) */}
          <div className="block md:hidden space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.payment_type === 'AIR'
                        ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    Tagihan {p.payment_type}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {formatDateIndo(p.payment_date)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Periode Tagihan:</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {formatPeriodIndo(p.period)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Metode Bayar:</span>
                    <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                      {p.payment_method}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nominal Lunas:</span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {formatRupiah(p.amount)}
                    </span>
                  </div>
                  {(p.reference_number || p.notes) && (
                    <div className="text-right max-w-[140px] truncate">
                      <span className="text-slate-400 text-[10px] block">Referensi / Catatan:</span>
                      <span className="text-[11px] font-mono text-slate-600 truncate block">
                        {p.reference_number || p.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Full Table (Layar Komputer/Tablet) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Tanggal Pembayaran</th>
                  <th className="px-5 py-3.5">Jenis Tagihan</th>
                  <th className="px-5 py-3.5">Periode</th>
                  <th className="px-5 py-3.5">Nominal Lunas</th>
                  <th className="px-5 py-3.5">Metode Bayar</th>
                  <th className="px-5 py-3.5">No. Referensi / Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {formatDateIndo(p.payment_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.payment_type === 'AIR'
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {formatPeriodIndo(p.period)}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-emerald-700">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {p.reference_number || p.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
