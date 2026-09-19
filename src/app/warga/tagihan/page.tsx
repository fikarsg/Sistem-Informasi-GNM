'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WaterBill, GarbageBill } from '@/lib/types/database';
import { formatRupiah, formatDateIndo, formatPeriodIndo } from '@/lib/utils';
import { Receipt, Droplet, Trash2, Loader2, Calendar, Gauge } from 'lucide-react';

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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          Tagihan Rumah Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar seluruh tagihan penggunaan air & iuran kebersihan rumah Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('AIR')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            tab === 'AIR'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Droplet className="w-4 h-4" />
          Tagihan Air ({waterBills.length})
        </button>
        <button
          onClick={() => setTab('SAMPAH')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            tab === 'SAMPAH'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Iuran Sampah ({garbageBills.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs">Memuat data tagihan...</p>
        </div>
      )}

      {/* Water Bills Tab */}
      {!loading && tab === 'AIR' && (
        <>
          {waterBills.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Belum ada catatan tagihan air untuk rumah Anda.
            </div>
          ) : (
            <>
              {/* Mobile View: Card List (khusus layar HP) */}
              <div className="block md:hidden space-y-3">
                {waterBills.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-cyan-50 text-cyan-700 rounded-lg">
                          <Droplet className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {formatPeriodIndo(b.period)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'LUNAS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Catatan Meter:</span>
                        <span className="font-mono text-slate-700 text-xs">
                          {b.previous_meter} → {b.current_meter}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Pemakaian:</span>
                        <span className="font-bold text-cyan-800 text-xs">{b.usage} m³</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Total Tagihan</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatRupiah(b.total_amount)}
                        </span>
                      </div>
                      {b.due_date && (
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Jatuh Tempo</span>
                          <span className="text-[11px] text-slate-600">
                            {formatDateIndo(b.due_date)}
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
                    {waterBills.map((b) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Garbage Bills Tab */}
      {!loading && tab === 'SAMPAH' && (
        <>
          {garbageBills.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Belum ada catatan iuran sampah untuk rumah Anda.
            </div>
          ) : (
            <>
              {/* Mobile View: Card List (khusus layar HP) */}
              <div className="block md:hidden space-y-3">
                {garbageBills.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {formatPeriodIndo(b.period)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'LUNAS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Iuran Sampah:</span>
                        <span className="font-semibold text-slate-800">{formatRupiah(b.amount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Jatuh Tempo:</span>
                        <span className="text-[11px] text-slate-600">{formatDateIndo(b.due_date)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="text-slate-400 text-[10px]">Total Bayar:</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatRupiah(b.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Full Table (Layar Komputer/Tablet) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
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
                    {garbageBills.map((b) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
