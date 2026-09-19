'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GarbageBill, House } from '@/lib/types/database';
import { formatRupiah, formatPeriodIndo, formatDateIndo } from '@/lib/utils';
import { Trash2, Plus, Search, Filter, Loader2, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function TagihanSampahPage() {
  const [bills, setBills] = useState<(GarbageBill & { house?: House })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Batch Generation State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchPeriod, setBatchPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [batchAmount, setBatchAmount] = useState<number>(25000);
  const [batchDueDate, setBatchDueDate] = useState<string>(`${new Date().toISOString().slice(0, 7)}-20`);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  const fetchBills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('garbage_bills')
      .select('*, house:houses(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBills(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setFeedback(null);

    try {
      // 1. Fetch all active houses
      const { data: activeHouses, error: houseErr } = await supabase
        .from('houses')
        .select('id, block, house_number')
        .eq('status', 'AKTIF')
        .eq('garbage_status', 'AKTIF');

      if (houseErr) throw houseErr;

      if (!activeHouses || activeHouses.length === 0) {
        throw new Error('Tidak ada rumah aktif dengan langganan sampah aktif.');
      }

      // 2. Prepare bulk insert rows
      const rows = activeHouses.map((h) => ({
        house_id: h.id,
        period: batchPeriod,
        amount: batchAmount,
        total_amount: batchAmount,
        due_date: batchDueDate || null,
        status: 'BELUM_BAYAR',
      }));

      // 3. Upsert / Insert ignore duplicate
      const { error: insertErr } = await supabase
        .from('garbage_bills')
        .upsert(rows, { onConflict: 'house_id,period', ignoreDuplicates: true });

      if (insertErr) throw insertErr;

      setFeedback({
        type: 'success',
        message: `Berhasil membuat tagihan sampah periode ${formatPeriodIndo(batchPeriod)} untuk ${activeHouses.length} rumah aktif!`,
      });
      setBatchModalOpen(false);
      fetchBills();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal membuat tagihan massal.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchSearch =
      b.house?.block.toLowerCase().includes(search.toLowerCase()) ||
      b.house?.house_number.toLowerCase().includes(search.toLowerCase());

    const matchPeriod = !periodFilter || b.period === periodFilter;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchSearch && matchPeriod && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-emerald-600" />
            Tagihan Iuran Sampah & Kebersihan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan iuran sampah dan generator tagihan bulanan seluruh rumah aktif (PRD Modul 11).
          </p>
        </div>
        <button
          onClick={() => {
            setFeedback(null);
            setBatchModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Generate Tagihan Seluruh Rumah
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari rumah (Blok / No)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Periode:</span>
            <input
              type="month"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
            >
              <option value="ALL">Semua</option>
              <option value="BELUM_BAYAR">Belum Bayar</option>
              <option value="LUNAS">Lunas</option>
              <option value="JATUH_TEMPO">Jatuh Tempo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Rumah</th>
                <th className="px-5 py-3.5">Periode</th>
                <th className="px-5 py-3.5">Nominal Iuran</th>
                <th className="px-5 py-3.5">Total Tagihan</th>
                <th className="px-5 py-3.5">Jatuh Tempo</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data tagihan sampah...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Belum ada tagihan sampah untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      Blok {b.house?.block} - No. {b.house?.house_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{formatPeriodIndo(b.period)}</td>
                    <td className="px-5 py-3.5">{formatRupiah(b.amount)}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{formatRupiah(b.total_amount)}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDateIndo(b.due_date)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.status === 'LUNAS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'BELUM_BAYAR'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
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

      {/* Batch Generator Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Generate Tagihan Sampah Bulanan
              </h2>
              <button onClick={() => setBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Fitur ini akan secara otomatis membuat tagihan sampah untuk <strong>seluruh rumah berstatus AKTIF</strong> pada periode yang dipilih.
            </p>

            <form onSubmit={handleGenerateBatch} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Periode Tagihan *</label>
                <input
                  type="month"
                  required
                  value={batchPeriod}
                  onChange={(e) => {
                    setBatchPeriod(e.target.value);
                    setBatchDueDate(`${e.target.value}-20`);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nominal Iuran Sampah (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo *</label>
                <input
                  type="date"
                  required
                  value={batchDueDate}
                  onChange={(e) => setBatchDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
