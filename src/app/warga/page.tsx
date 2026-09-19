'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { House, WaterBill, GarbageBill, Payment, Announcement } from '@/lib/types/database';
import { formatRupiah, formatDateIndo, formatPeriodIndo } from '@/lib/utils';
import {
  Home,
  Droplet,
  Trash2,
  Receipt,
  History,
  Megaphone,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  PieChart
} from 'lucide-react';
import Link from 'next/link';

export default function WargaDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);
  const [activeWaterBill, setActiveWaterBill] = useState<WaterBill | null>(null);
  const [activeGarbageBill, setActiveGarbageBill] = useState<GarbageBill | null>(null);
  const [totalUnpaid, setTotalUnpaid] = useState<number>(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchWargaData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get resident & house linked to this user
        const { data: resident } = await supabase
          .from('residents')
          .select('*, house:houses(*)')
          .eq('user_id', user.id)
          .single();

        const userHouse = resident?.house as House;
        if (userHouse) {
          setHouse(userHouse);

          // 2. Fetch latest bills for this house
          const { data: waterBills } = await supabase
            .from('water_bills')
            .select('*')
            .eq('house_id', userHouse.id)
            .order('period', { ascending: false });

          const { data: garbageBills } = await supabase
            .from('garbage_bills')
            .select('*')
            .eq('house_id', userHouse.id)
            .order('period', { ascending: false });

          if (waterBills && waterBills.length > 0) {
            setActiveWaterBill(waterBills[0]);
          }

          if (garbageBills && garbageBills.length > 0) {
            setActiveGarbageBill(garbageBills[0]);
          }

          // Calculate total unpaid bills
          const unpaidWater = waterBills?.filter(b => b.status === 'BELUM_BAYAR' || b.status === 'JATUH_TEMPO') || [];
          const unpaidGarbage = garbageBills?.filter(b => b.status === 'BELUM_BAYAR' || b.status === 'JATUH_TEMPO') || [];

          const sumWater = unpaidWater.reduce((s, b) => s + Number(b.total_amount), 0);
          const sumGarbage = unpaidGarbage.reduce((s, b) => s + Number(b.total_amount), 0);
          setTotalUnpaid(sumWater + sumGarbage);

          // 3. Fetch recent payments for this house
          const { data: payData } = await supabase
            .from('payments')
            .select('*')
            .eq('house_id', userHouse.id)
            .order('payment_date', { ascending: false })
            .limit(3);

          if (payData) setRecentPayments(payData);
        }

        // 4. Fetch recent published announcements
        const { data: annoData } = await supabase
          .from('announcements')
          .select('*')
          .eq('status', 'PUBLISHED')
          .order('published_at', { ascending: false })
          .limit(2);

        if (annoData) setRecentAnnouncements(annoData);
      } catch (err) {
        console.error('Error fetching warga dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWargaData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        Memuat informasi rumah Anda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            Portal Warga Mandiri
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {house ? `Blok ${house.block} - No. ${house.house_number}` : 'Rumah Warga'}
          </h1>
          <p className="text-xs text-emerald-100">
            {house?.address || 'Perumahan Griya Nusantara Mandiri (GNM)'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 sm:text-right">
          <span className="text-[11px] text-emerald-100 block">Total Tagihan Belum Lunas</span>
          <span className="text-xl font-extrabold text-white">
            {formatRupiah(totalUnpaid)}
          </span>
        </div>
      </div>

      {/* Active Bills Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tagihan Air */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Tagihan Air Terbaru</h3>
                <p className="text-[11px] text-slate-500">
                  {activeWaterBill ? formatPeriodIndo(activeWaterBill.period) : 'Belum ada tagihan'}
                </p>
              </div>
            </div>
            {activeWaterBill && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeWaterBill.status === 'LUNAS'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {activeWaterBill.status}
              </span>
            )}
          </div>

          {activeWaterBill ? (
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Catatan Meter:</span>
                <span className="font-mono">
                  {activeWaterBill.previous_meter} → {activeWaterBill.current_meter}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pemakaian:</span>
                <span className="font-semibold text-cyan-800">{activeWaterBill.usage} m³</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Bayar:</span>
                <span className="text-sm text-cyan-900">{formatRupiah(activeWaterBill.total_amount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">Belum ada catatan meter air untuk rumah ini.</p>
          )}

          <Link
            href="/warga/tagihan"
            className="text-xs text-cyan-700 font-semibold flex items-center hover:underline pt-1"
          >
            Lihat Rincian Tagihan Air <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {/* Tagihan Sampah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Tagihan Iuran Sampah</h3>
                <p className="text-[11px] text-slate-500">
                  {activeGarbageBill ? formatPeriodIndo(activeGarbageBill.period) : 'Belum ada tagihan'}
                </p>
              </div>
            </div>
            {activeGarbageBill && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeGarbageBill.status === 'LUNAS'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {activeGarbageBill.status}
              </span>
            )}
          </div>

          {activeGarbageBill ? (
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Iuran Kebersihan:</span>
                <span>{formatRupiah(activeGarbageBill.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Batas Pembayaran:</span>
                <span className="text-slate-500">{formatDateIndo(activeGarbageBill.due_date)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Bayar:</span>
                <span className="text-sm text-emerald-900">{formatRupiah(activeGarbageBill.total_amount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3">Belum ada tagihan sampah untuk rumah ini.</p>
          )}

          <Link
            href="/warga/tagihan"
            className="text-xs text-emerald-700 font-semibold flex items-center hover:underline pt-1"
          >
            Lihat Rincian Tagihan Sampah <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>

      {/* Riwayat Pembayaran Terbaru & Pengumuman */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Riwayat Bayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              Riwayat Pembayaran Terbaru
            </h3>
            <Link href="/warga/riwayat" className="text-[11px] text-emerald-700 font-semibold hover:underline">
              Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat pembayaran yang tercatat.</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Tagihan {p.payment_type} ({formatPeriodIndo(p.period)})
                    </span>
                    <p className="text-[10px] text-slate-400">{formatDateIndo(p.payment_date)} • {p.payment_method}</p>
                  </div>
                  <span className="font-bold text-emerald-700">{formatRupiah(p.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-blue-600" />
              Pengumuman Terbaru
            </h3>
            <Link href="/warga/pengumuman" className="text-[11px] text-blue-700 font-semibold hover:underline">
              Semua
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Tidak ada pengumuman baru.</p>
            ) : (
              recentAnnouncements.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400">{formatDateIndo(a.published_at)}</span>
                  <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{a.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick link to financial transparency */}
      <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Transparansi Keuangan Perumahan</h4>
            <p className="text-[11px] text-slate-600">
              Lihat ringkasan kas umum, pemasukan & pengeluaran dana air serta sampah per bulan secara terbuka.
            </p>
          </div>
        </div>
        <Link
          href="/warga/transparansi"
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors"
        >
          Buka Laporan Kas
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
