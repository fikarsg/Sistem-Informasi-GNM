'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WaterBill, GarbageBill } from '@/lib/types/database';
import { formatRupiah, formatDateIndo, formatPeriodIndo } from '@/lib/utils';
import { Receipt, Droplet, Trash2, Loader2, CheckCircle2, Clock } from 'lucide-react';

export default function WargaTagihanPage() {
  const [tab, setTab] = useState<'AIR' | 'SAMPAH'>('AIR');
  const [waterBills, setWaterBills] = useState<WaterBill[]>([]);
  const [garbageBills, setGarbageBills] = useState<GarbageBill[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchBills() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: resident } = await supabase
        .from('residents')
        .select('house_id')
        .eq('user_id', user.id)
        .single();

      if (resident?.house_id) {
        // Fetch water bills
        const { data: wData } = await supabase
          .from('water_bills')
          .select('*')
          .eq('house_id', resident.house_id)
          .order('period', { ascending: false });

        // Fetch garbage bills
        const { data: gData } = await supabase
          .from('garbage_bills')
          .select('*')
          .eq('house_id', resident.house_id)
          .order('period', { ascending: false });

        if (wData) setWaterBills(wData);
        if (gData) setGarbageBills(gData);
      }
      setLoading(false);
    }

    fetchBills();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-emerald-600" />
          Tagihan Rumah Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar seluruh tagihan penggunaan air & iuran kebersihan rumah Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setTab('AIR')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'AIR'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Droplet className="w-4 h-4" />
          Tagihan Meter Air ({waterBills.length})
        </button>
        <button
          onClick={() => setTab('SAMPAH')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'SAMPAH'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Tagihan Iuran Sampah ({garbageBills.length})
        </button>
      </div>

      {/* Water Bills Tab */}
      {tab === 'AIR' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Periode</th>
                  <th className="px-5 py-3.5">Catatan Meter</th>
                  <th className="px-5 py-3.5">Pemakaian</th>
                  <th className="px-5 py-3.5">Tarif / m³</th>
                  <th className="px-5 py-3.5">Total Tagihan</th>
                  <th className="px-5 py-3.5">Jatuh Tempo</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-600" />
                      Memuat tagihan air...
                    </td>
                  </tr>
                ) : waterBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Belum ada tagihan air untuk rumah Anda.
                    </td>
                  </tr>
                ) : (
                  waterBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{formatPeriodIndo(b.period)}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        {b.previous_meter} → {b.current_meter}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-cyan-700">{b.usage} m³</td>
                      <td className="px-5 py-3.5">{formatRupiah(b.rate_per_m3)}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">{formatRupiah(b.total_amount)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateIndo(b.due_date)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'LUNAS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Garbage Bills Tab */}
      {tab === 'SAMPAH' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Periode</th>
                  <th className="px-5 py-3.5">Iuran Bulanan</th>
                  <th className="px-5 py-3.5">Total Tagihan</th>
                  <th className="px-5 py-3.5">Jatuh Tempo</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Memuat tagihan sampah...
                    </td>
                  </tr>
                ) : garbageBills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Belum ada tagihan sampah untuk rumah Anda.
                    </td>
                  </tr>
                ) : (
                  garbageBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{formatPeriodIndo(b.period)}</td>
                      <td className="px-5 py-3.5">{formatRupiah(b.amount)}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">{formatRupiah(b.total_amount)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateIndo(b.due_date)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'LUNAS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
