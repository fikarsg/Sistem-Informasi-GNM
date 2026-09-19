'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WaterBill, House, BillStatus } from '@/lib/types/database';
import { formatRupiah, formatPeriodIndo, formatDateIndo } from '@/lib/utils';
import { Droplet, Plus, Search, CheckCircle2, AlertCircle, X, Loader2, Filter, Receipt } from 'lucide-react';

export default function TagihanAirPage() {
  const [bills, setBills] = useState<(WaterBill & { house?: House })[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formHouseId, setFormHouseId] = useState('');
  const [formPeriod, setFormPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [formPrevMeter, setFormPrevMeter] = useState<number>(0);
  const [formCurrMeter, setFormCurrMeter] = useState<number>(0);
  const [formRate, setFormRate] = useState<number>(3500);
  const [formPenalty, setFormPenalty] = useState<number>(0);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const supabase = createClient();

  // Calculated values
  const usage = Math.max(0, formCurrMeter - formPrevMeter);
  const baseAmount = usage * formRate;
  const totalAmount = Math.max(0, baseAmount + formPenalty - formDiscount);

  const fetchData = async () => {
    setLoading(true);

    // Fetch houses
    const { data: houseData } = await supabase
      .from('houses')
      .select('*')
      .eq('water_status', 'AKTIF')
      .order('block', { ascending: true })
      .order('house_number', { ascending: true });

    if (houseData) setHouses(houseData);

    // Fetch bills
    const { data: billData } = await supabase
      .from('water_bills')
      .select('*, house:houses(*)')
      .order('created_at', { ascending: false });

    if (billData) setBills(billData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When house changes in form, auto-fetch last recorded meter as previous_meter!
  const handleHouseChange = async (hId: string) => {
    setFormHouseId(hId);
    if (!hId) return;

    // Find the latest water bill for this house
    const { data: lastBill } = await supabase
      .from('water_bills')
      .select('current_meter')
      .eq('house_id', hId)
      .order('period', { ascending: false })
      .limit(1)
      .single();

    if (lastBill) {
      setFormPrevMeter(Number(lastBill.current_meter));
      setFormCurrMeter(Number(lastBill.current_meter));
    } else {
      setFormPrevMeter(0);
      setFormCurrMeter(0);
    }
  };

  const openAddModal = () => {
    const currentYYYYMM = new Date().toISOString().slice(0, 7);
    setFormHouseId(houses[0]?.id || '');
    if (houses[0]?.id) {
      handleHouseChange(houses[0].id);
    }
    setFormPeriod(currentYYYYMM);
    setFormRate(3500);
    setFormPenalty(0);
    setFormDiscount(0);
    // default due date: 20th of current month
    setFormDueDate(`${currentYYYYMM}-20`);
    setFormNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    // Validation (PRD BR-009)
    if (formCurrMeter < formPrevMeter) {
      setModalError('Meter Akhir tidak boleh lebih kecil daripada Meter Awal!');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from('water_bills').insert({
        house_id: formHouseId,
        period: formPeriod,
        previous_meter: formPrevMeter,
        current_meter: formCurrMeter,
        rate_per_m3: formRate,
        base_amount: baseAmount,
        penalty: formPenalty,
        discount: formDiscount,
        total_amount: totalAmount,
        due_date: formDueDate || null,
        notes: formNotes || null,
        status: 'BELUM_BAYAR',
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Tagihan air untuk rumah ini pada periode ${formPeriod} sudah pernah dibuat!`);
        }
        throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan tagihan air.');
    } finally {
      setSaving(false);
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
            <Droplet className="w-6 h-6 text-cyan-600" />
            Tagihan Air Berdasarkan Meter
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan meter awal & akhir, kalkulasi otomatis pemakaian m³, dan penerbitan tagihan (PRD Modul 10).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Catat Meter & Buat Tagihan
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari rumah (Blok / No)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Rumah</th>
                <th className="px-5 py-3.5">Periode</th>
                <th className="px-5 py-3.5">Meter Awal - Akhir</th>
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
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat tagihan air...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada tagihan air untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      Blok {b.house?.block} - No. {b.house?.house_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{formatPeriodIndo(b.period)}</td>
                    <td className="px-5 py-3.5 font-mono">
                      {b.previous_meter} → {b.current_meter}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-cyan-700">{b.usage} m³</td>
                    <td className="px-5 py-3.5">{formatRupiah(b.rate_per_m3)}</td>
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

      {/* Modal Catat Meter Air */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-cyan-600" />
                Input Meter & Tagihan Air
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pilih Rumah *</label>
                <select
                  value={formHouseId}
                  onChange={(e) => handleHouseChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">-- Pilih Rumah --</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      Blok {h.block} - No. {h.house_number} ({h.water_meter_number || 'Tanpa Meter'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Periode Tagihan *</label>
                <input
                  type="month"
                  required
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Meter Awal (m³)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrevMeter}
                    onChange={(e) => setFormPrevMeter(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Meter Akhir (m³) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formCurrMeter}
                    onChange={(e) => setFormCurrMeter(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Real-time Calculation Box */}
              <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Pemakaian Air:</span>
                  <span className="font-semibold text-cyan-800">{usage.toFixed(2)} m³</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tarif per m³:</span>
                  <span>{formatRupiah(formRate)}</span>
                </div>
                <div className="flex justify-between border-t border-cyan-100 pt-1.5 font-bold text-slate-900 text-sm">
                  <span>Total Tagihan:</span>
                  <span className="text-cyan-900">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Denda (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formPenalty}
                    onChange={(e) => setFormPenalty(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Terbitkan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
