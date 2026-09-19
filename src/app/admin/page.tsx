'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatRupiah } from '@/lib/utils';
import {
  Home,
  Users,
  Droplet,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHouses: 0,
    activeHouses: 0,
    emptyHouses: 0,
    totalResidents: 0,
    waterBillTotal: 0,
    garbageBillTotal: 0,
    paidBillsCount: 0,
    unpaidBillsCount: 0,
    monthIncome: 0,
    monthExpense: 0,
    balanceKasUmum: 0,
    balanceDanaAir: 0,
    balanceDanaSampah: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const supabase = createClient();

        // 1. Houses count
        const { data: houses } = await supabase.from('houses').select('status');
        const totalHouses = houses?.length || 0;
        const activeHouses = houses?.filter(h => h.status === 'AKTIF').length || 0;
        const emptyHouses = houses?.filter(h => h.status !== 'AKTIF').length || 0;

        // 2. Residents count
        const { count: totalResidents } = await supabase
          .from('residents')
          .select('*', { count: 'exact', head: true });

        // Current period: YYYY-MM
        const currentPeriod = new Date().toISOString().slice(0, 7);

        // 3. Water bills current period
        const { data: waterBills } = await supabase
          .from('water_bills')
          .select('status, total_amount')
          .eq('period', currentPeriod);

        // 4. Garbage bills current period
        const { data: garbageBills } = await supabase
          .from('garbage_bills')
          .select('status, total_amount')
          .eq('period', currentPeriod);

        const waterTotal = waterBills?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
        const garbageTotal = garbageBills?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

        const paidCount =
          (waterBills?.filter(b => b.status === 'LUNAS').length || 0) +
          (garbageBills?.filter(b => b.status === 'LUNAS').length || 0);

        const unpaidCount =
          (waterBills?.filter(b => b.status === 'BELUM_BAYAR' || b.status === 'JATUH_TEMPO').length || 0) +
          (garbageBills?.filter(b => b.status === 'BELUM_BAYAR' || b.status === 'JATUH_TEMPO').length || 0);

        // 5. Cash transactions & 3-Fund Separation balances
        const { data: txs } = await supabase
          .from('cash_transactions')
          .select('transaction_date, fund_type, transaction_type, amount, status')
          .eq('status', 'VALID');

        let bKasUmum = 0;
        let bDanaAir = 0;
        let bDanaSampah = 0;
        let monthInc = 0;
        let monthExp = 0;

        const currentYearMonth = currentPeriod;

        txs?.forEach(tx => {
          const amt = Number(tx.amount);
          const isIncome = tx.transaction_type === 'MASUK';
          const net = isIncome ? amt : -amt;

          if (tx.fund_type === 'KAS_UMUM') bKasUmum += net;
          else if (tx.fund_type === 'DANA_AIR') bDanaAir += net;
          else if (tx.fund_type === 'DANA_SAMPAH') bDanaSampah += net;

          // Check if current month
          if (tx.transaction_date && tx.transaction_date.startsWith(currentYearMonth)) {
            if (isIncome) monthInc += amt;
            else monthExp += amt;
          }
        });

        setStats({
          totalHouses,
          activeHouses,
          emptyHouses,
          totalResidents: totalResidents || 0,
          waterBillTotal: waterTotal,
          garbageBillTotal: garbageTotal,
          paidBillsCount: paidCount,
          unpaidBillsCount: unpaidCount,
          monthIncome: monthInc,
          monthExpense: monthExp,
          balanceKasUmum: bKasUmum,
          balanceDanaAir: bDanaAir,
          balanceDanaSampah: bDanaSampah,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header with Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Pengurus</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan operasional, data perumahan, tagihan, dan 3 kantong kas perumahan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/pembayaran"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Pembayaran
          </Link>
          <Link
            href="/admin/keuangan"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Wallet className="w-4 h-4" />
            Catat Kas
          </Link>
        </div>
      </div>

      {/* Saldo 3 Kantong Kas (PRD Section 16 - Pemisahan Dana Kritis) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            Saldo 3 Kantong Dana Perumahan
          </h2>
          <span className="text-[11px] text-slate-400">Pemisahan saldo independen</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kantong 1: Kas Umum */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-3 bottom-3 opacity-15">
              <Wallet className="w-20 h-20" />
            </div>
            <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Kas Umum Perumahan</p>
            <h3 className="text-2xl font-extrabold mt-1 tracking-tight">
              {loading ? 'Memuat...' : formatRupiah(stats.balanceKasUmum)}
            </h3>
            <p className="text-[11px] text-blue-200 mt-2">Iuran warga, keamanan, kebersihan & umum</p>
          </div>

          {/* Kantong 2: Dana Air */}
          <div className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-3 bottom-3 opacity-15">
              <Droplet className="w-20 h-20" />
            </div>
            <p className="text-xs font-medium text-cyan-100 uppercase tracking-wider">Dana Pengelolaan Air</p>
            <h3 className="text-2xl font-extrabold mt-1 tracking-tight">
              {loading ? 'Memuat...' : formatRupiah(stats.balanceDanaAir)}
            </h3>
            <p className="text-[11px] text-cyan-200 mt-2">Penerimaan meter air & operasional pompa</p>
          </div>

          {/* Kantong 3: Dana Sampah */}
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-3 bottom-3 opacity-15">
              <Trash2 className="w-20 h-20" />
            </div>
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Dana Kebersihan Sampah</p>
            <h3 className="text-2xl font-extrabold mt-1 tracking-tight">
              {loading ? 'Memuat...' : formatRupiah(stats.balanceDanaSampah)}
            </h3>
            <p className="text-[11px] text-emerald-200 mt-2">Iuran sampah & operasional pengangkutan</p>
          </div>
        </div>
      </div>

      {/* Grid Statistik Operasional */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rumah */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Data Rumah</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalHouses}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">{stats.activeHouses} Aktif</span> • {stats.emptyHouses} Kosong
          </p>
        </div>

        {/* Total Warga */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Warga</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalResidents}</p>
          <p className="text-[11px] text-slate-500 mt-1">Terdaftar di sistem</p>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pemasukan Bulan Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2">{formatRupiah(stats.monthIncome)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total semua kas masuk</p>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengeluaran Bulan Ini</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-rose-600 mt-2">{formatRupiah(stats.monthExpense)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total semua kas keluar</p>
        </div>
      </div>

      {/* Tagihan Bulan Berjalan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Pembayaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Status Pembayaran Bulan Ini</span>
            <Link href="/admin/laporan" className="text-xs text-blue-600 font-medium flex items-center hover:underline">
              Lihat Laporan <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-emerald-700 font-medium">Tagihan Lunas</p>
                <p className="text-xl font-bold text-emerald-800">{stats.paidBillsCount}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs text-amber-700 font-medium">Belum Lunas / Jatuh Tempo</p>
                <p className="text-xl font-bold text-amber-800">{stats.unpaidBillsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Nilai Tagihan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Nilai Tagihan Bulan Berjalan</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Droplet className="w-4 h-4 text-cyan-600" />
                <span>Total Tagihan Air</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatRupiah(stats.waterBillTotal)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Trash2 className="w-4 h-4 text-emerald-600" />
                <span>Total Tagihan Sampah</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatRupiah(stats.garbageBillTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
