'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CashTransaction, WaterBill, GarbageBill, House } from '@/lib/types/database';
import { formatRupiah, formatDateIndo, formatPeriodIndo } from '@/lib/utils';
import { BarChart3, Download, Printer, Filter, Loader2, Droplet, Trash2, Wallet, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LaporanPage() {
  const [tab, setTab] = useState<'KAS' | 'TUNGGAKAN_AIR' | 'TUNGGAKAN_SAMPAH'>('KAS');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [fundFilter, setFundFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Data states
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [waterArrears, setWaterArrears] = useState<(WaterBill & { house?: House })[]>([]);
  const [garbageArrears, setGarbageArrears] = useState<(GarbageBill & { house?: House })[]>([]);

  const supabase = createClient();

  const fetchReports = async () => {
    setLoading(true);

    // 1. Transactions for selected period
    let q = supabase
      .from('cash_transactions')
      .select('*')
      .eq('status', 'VALID')
      .order('transaction_date', { ascending: true });

    if (period) {
      // starts with YYYY-MM
      q = q.gte('transaction_date', `${period}-01`).lte('transaction_date', `${period}-31`);
    }

    const { data: txData } = await q;
    if (txData) setTransactions(txData);

    // 2. Water Arrears (Belum Lunas / Jatuh Tempo)
    const { data: wData } = await supabase
      .from('water_bills')
      .select('*, house:houses(*)')
      .in('status', ['BELUM_BAYAR', 'JATUH_TEMPO'])
      .order('period', { ascending: false });

    if (wData) setWaterArrears(wData);

    // 3. Garbage Arrears
    const { data: gData } = await supabase
      .from('garbage_bills')
      .select('*, house:houses(*)')
      .in('status', ['BELUM_BAYAR', 'JATUH_TEMPO'])
      .order('period', { ascending: false });

    if (gData) setGarbageArrears(gData);

    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  // Export to Excel handler
  const exportToExcel = () => {
    if (tab === 'KAS') {
      const data = transactions.map((t) => ({
        Tanggal: t.transaction_date,
        'Kantong Dana': t.fund_type,
        Tipe: t.transaction_type,
        Kategori: t.category,
        Keterangan: t.description,
        Nominal: t.amount,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kas');
      XLSX.writeFile(wb, `Laporan_Kas_${period}.xlsx`);
    } else if (tab === 'TUNGGAKAN_AIR') {
      const data = waterArrears.map((w) => ({
        Rumah: `Blok ${w.house?.block} No. ${w.house?.house_number}`,
        Periode: w.period,
        'Pemakaian (m3)': w.usage,
        'Total Tunggakan': w.total_amount,
        'Jatuh Tempo': w.due_date,
        Status: w.status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tunggakan Air');
      XLSX.writeFile(wb, `Tunggakan_Air_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else {
      const data = garbageArrears.map((g) => ({
        Rumah: `Blok ${g.house?.block} No. ${g.house?.house_number}`,
        Periode: g.period,
        'Total Tunggakan': g.total_amount,
        'Jatuh Tempo': g.due_date,
        Status: g.status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tunggakan Sampah');
      XLSX.writeFile(wb, `Tunggakan_Sampah_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  // Filtered transactions by fund
  const filteredTxs = transactions.filter((t) => fundFilter === 'ALL' || t.fund_type === fundFilter);
  const totalMasuk = filteredTxs.filter((t) => t.transaction_type === 'MASUK').reduce((s, t) => s + Number(t.amount), 0);
  const totalKeluar = filteredTxs.filter((t) => t.transaction_type === 'KELUAR').reduce((s, t) => s + Number(t.amount), 0);
  const surplusDefisit = totalMasuk - totalKeluar;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Laporan Keuangan & Rekap Tunggakan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekap transaksi kas, keuangan per jenis dana, dan daftar tunggakan air/sampah (PRD Modul 17, 18, 19).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setTab('KAS')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'KAS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Laporan Kas & Rekap Dana
        </button>
        <button
          onClick={() => setTab('TUNGGAKAN_AIR')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'TUNGGAKAN_AIR'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Droplet className="w-4 h-4" />
          Rekap Tunggakan Air ({waterArrears.length})
        </button>
        <button
          onClick={() => setTab('TUNGGAKAN_SAMPAH')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'TUNGGAKAN_SAMPAH'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Rekap Tunggakan Sampah ({garbageArrears.length})
        </button>
      </div>

      {/* Tab 1: Kas Keuangan */}
      {tab === 'KAS' && (
        <div className="space-y-4">
          {/* Filter Periode & Dana */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Pilih Bulan Periode:</span>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter Jenis Dana:</span>
              <select
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white font-medium"
              >
                <option value="ALL">Semua Kantong Dana</option>
                <option value="KAS_UMUM">Kas Umum</option>
                <option value="DANA_AIR">Dana Air</option>
                <option value="DANA_SAMPAH">Dana Sampah</option>
              </select>
            </div>
          </div>

          {/* Ringkasan Angka Bulan Ini */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <span className="text-xs font-semibold text-emerald-700">Total Pemasukan Periode</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{formatRupiah(totalMasuk)}</p>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <span className="text-xs font-semibold text-rose-700">Total Pengeluaran Periode</span>
              <p className="text-xl font-bold text-rose-800 mt-1">{formatRupiah(totalKeluar)}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <span className="text-xs font-semibold text-blue-700">Surplus / Defisit Periode</span>
              <p className={`text-xl font-bold mt-1 ${surplusDefisit >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
                {formatRupiah(surplusDefisit)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Kantong Dana</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Keterangan</th>
                    <th className="px-5 py-3.5 text-right">Pemasukan (Rp)</th>
                    <th className="px-5 py-3.5 text-right">Pengeluaran (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                        Memuat data laporan kas...
                      </td>
                    </tr>
                  ) : filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Tidak ada transaksi pada periode {formatPeriodIndo(period)}.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3.5 text-slate-800">{formatDateIndo(t.transaction_date)}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700">{t.fund_type.replace('_', ' ')}</td>
                        <td className="px-5 py-3.5 font-medium">{t.category}</td>
                        <td className="px-5 py-3.5 text-slate-500">{t.description}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                          {t.transaction_type === 'MASUK' ? formatRupiah(t.amount) : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-rose-700">
                          {t.transaction_type === 'KELUAR' ? formatRupiah(t.amount) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tunggakan Air */}
      {tab === 'TUNGGAKAN_AIR' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Daftar Rumah yang Menunggak Pembayaran Air
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Total Tunggakan: {formatRupiah(waterArrears.reduce((s, w) => s + Number(w.total_amount), 0))}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Rumah</th>
                  <th className="px-5 py-3.5">Periode Tagihan</th>
                  <th className="px-5 py-3.5">Pemakaian</th>
                  <th className="px-5 py-3.5">Nominal Tunggakan</th>
                  <th className="px-5 py-3.5">Jatuh Tempo</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waterArrears.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Luar biasa! Tidak ada tunggakan air yang belum lunas.
                    </td>
                  </tr>
                ) : (
                  waterArrears.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        Blok {w.house?.block} - No. {w.house?.house_number}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{formatPeriodIndo(w.period)}</td>
                      <td className="px-5 py-3.5 text-cyan-800 font-semibold">{w.usage} m³</td>
                      <td className="px-5 py-3.5 font-bold text-rose-700">{formatRupiah(w.total_amount)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateIndo(w.due_date)}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {w.status}
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

      {/* Tab 3: Tunggakan Sampah */}
      {tab === 'TUNGGAKAN_SAMPAH' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Daftar Rumah yang Menunggak Iuran Sampah
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Total Tunggakan: {formatRupiah(garbageArrears.reduce((s, g) => s + Number(g.total_amount), 0))}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Rumah</th>
                  <th className="px-5 py-3.5">Periode Tagihan</th>
                  <th className="px-5 py-3.5">Nominal Tunggakan</th>
                  <th className="px-5 py-3.5">Jatuh Tempo</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {garbageArrears.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Hebat! Seluruh rumah sudah melunasi iuran sampah.
                    </td>
                  </tr>
                ) : (
                  garbageArrears.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        Blok {g.house?.block} - No. {g.house?.house_number}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{formatPeriodIndo(g.period)}</td>
                      <td className="px-5 py-3.5 font-bold text-rose-700">{formatRupiah(g.total_amount)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateIndo(g.due_date)}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {g.status}
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
