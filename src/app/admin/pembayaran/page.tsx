'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Payment, House, WaterBill, GarbageBill, PaymentMethod, PaymentType } from '@/lib/types/database';
import { formatRupiah, formatDateIndo, formatPeriodIndo } from '@/lib/utils';
import { CreditCard, Plus, Search, CheckCircle2, AlertCircle, X, Loader2, Calendar, FileText } from 'lucide-react';

export default function PembayaranPage() {
  const [payments, setPayments] = useState<(Payment & { house?: House })[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [unpaidWaterBills, setUnpaidWaterBills] = useState<WaterBill[]>([]);
  const [unpaidGarbageBills, setUnpaidGarbageBills] = useState<GarbageBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formHouseId, setFormHouseId] = useState('');
  const [formPaymentType, setFormPaymentType] = useState<PaymentType>('AIR');
  const [formBillId, setFormBillId] = useState('');
  const [formPeriod, setFormPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaymentDate, setFormPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [formRefNumber, setFormRefNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const supabase = createClient();

  const fetchPayments = async () => {
    setLoading(true);
    const { data: payData } = await supabase
      .from('payments')
      .select('*, house:houses(*)')
      .order('payment_date', { ascending: false });

    const { data: houseData } = await supabase
      .from('houses')
      .select('*')
      .order('block', { ascending: true })
      .order('house_number', { ascending: true });

    if (payData) setPayments(payData);
    if (houseData) setHouses(houseData);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // When house or payment type changes, load corresponding unpaid bills
  const handleHouseOrTypeChange = async (hId: string, type: PaymentType) => {
    setFormHouseId(hId);
    setFormPaymentType(type);
    setFormBillId('');
    setFormAmount(0);

    if (!hId) return;

    if (type === 'AIR') {
      const { data } = await supabase
        .from('water_bills')
        .select('*')
        .eq('house_id', hId)
        .in('status', ['BELUM_BAYAR', 'JATUH_TEMPO'])
        .order('period', { ascending: true });

      setUnpaidWaterBills(data || []);
      if (data && data.length > 0) {
        setFormBillId(data[0].id);
        setFormPeriod(data[0].period);
        setFormAmount(Number(data[0].total_amount));
      }
    } else if (type === 'SAMPAH') {
      const { data } = await supabase
        .from('garbage_bills')
        .select('*')
        .eq('house_id', hId)
        .in('status', ['BELUM_BAYAR', 'JATUH_TEMPO'])
        .order('period', { ascending: true });

      setUnpaidGarbageBills(data || []);
      if (data && data.length > 0) {
        setFormBillId(data[0].id);
        setFormPeriod(data[0].period);
        setFormAmount(Number(data[0].total_amount));
      }
    }
  };

  const handleBillSelect = (billId: string) => {
    setFormBillId(billId);
    if (formPaymentType === 'AIR') {
      const b = unpaidWaterBills.find((w) => w.id === billId);
      if (b) {
        setFormPeriod(b.period);
        setFormAmount(Number(b.total_amount));
      }
    } else if (formPaymentType === 'SAMPAH') {
      const b = unpaidGarbageBills.find((g) => g.id === billId);
      if (b) {
        setFormPeriod(b.period);
        setFormAmount(Number(b.total_amount));
      }
    }
  };

  const openAddModal = () => {
    const initialHId = houses[0]?.id || '';
    setFormPaymentType('AIR');
    setFormPaymentDate(new Date().toISOString().slice(0, 10));
    setFormPaymentMethod('TUNAI');
    setFormRefNumber('');
    setFormNotes('');
    setModalError(null);
    setIsModalOpen(true);
    if (initialHId) {
      handleHouseOrTypeChange(initialHId, 'AIR');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    try {
      // Get current user id
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('payments').insert({
        house_id: formHouseId,
        payment_type: formPaymentType,
        water_bill_id: formPaymentType === 'AIR' ? formBillId || null : null,
        garbage_bill_id: formPaymentType === 'SAMPAH' ? formBillId || null : null,
        period: formPeriod,
        amount: formAmount,
        payment_date: formPaymentDate,
        payment_method: formPaymentMethod,
        reference_number: formRefNumber.trim() || null,
        notes: formNotes.trim() || null,
        recorded_by: user?.id || null,
      });

      if (error) throw error;

      setIsModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      setModalError(err.message || 'Gagal mencatat pembayaran.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.house?.block.toLowerCase().includes(search.toLowerCase()) ||
      p.house?.house_number.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference_number && p.reference_number.toLowerCase().includes(search.toLowerCase()));

    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Pencatatan Pembayaran Tagihan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mencatat pembayaran warga (tunai/transfer), memperbarui status tagihan menjadi lunas (PRD Modul 13).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Catat Pembayaran Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari rumah atau nomor referensi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500">
          Total: <strong>{filteredPayments.length}</strong> transaksi pembayaran
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Rumah</th>
                <th className="px-5 py-3.5">Jenis & Periode</th>
                <th className="px-5 py-3.5">Nominal</th>
                <th className="px-5 py-3.5">Metode Bayar</th>
                <th className="px-5 py-3.5">No. Referensi / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat riwayat pembayaran...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Belum ada riwayat pembayaran yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-800 font-medium">
                      {formatDateIndo(p.payment_date)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      Blok {p.house?.block} - No. {p.house?.house_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold mr-1.5 ${
                          p.payment_type === 'AIR'
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {p.payment_type}
                      </span>
                      <span className="text-slate-600">{formatPeriodIndo(p.period)}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {p.reference_number ? (
                        <span className="font-mono text-[10px]">{p.reference_number}</span>
                      ) : (
                        p.notes || '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Pembayaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Catat Pembayaran Baru
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
                  onChange={(e) => handleHouseOrTypeChange(e.target.value, formPaymentType)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">-- Pilih Rumah --</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      Blok {h.block} - No. {h.house_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jenis Tagihan *</label>
                  <select
                    value={formPaymentType}
                    onChange={(e) => handleHouseOrTypeChange(formHouseId, e.target.value as PaymentType)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="AIR">Tagihan Air</option>
                    <option value="SAMPAH">Tagihan Sampah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tagihan Belum Lunas</label>
                  <select
                    value={formBillId}
                    onChange={(e) => handleBillSelect(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Pilih Tagihan --</option>
                    {formPaymentType === 'AIR'
                      ? unpaidWaterBills.map((b) => (
                          <option key={b.id} value={b.id}>
                            Periode {b.period} ({formatRupiah(b.total_amount)})
                          </option>
                        ))
                      : unpaidGarbageBills.map((b) => (
                          <option key={b.id} value={b.id}>
                            Periode {b.period} ({formatRupiah(b.total_amount)})
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nominal Bayar (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Pembayaran *</label>
                  <input
                    type="date"
                    required
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Metode Bayar</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="TUNAI">TUNAI</option>
                    <option value="TRANSFER">TRANSFER BANK</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Ref / Bukti Transfer</label>
                  <input
                    type="text"
                    placeholder="Contoh: TF-839210"
                    value={formRefNumber}
                    onChange={(e) => setFormRefNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan (opsional)..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
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
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
