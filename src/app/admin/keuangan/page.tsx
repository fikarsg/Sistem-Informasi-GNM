'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CashTransaction, FundType, TransactionType } from '@/lib/types/database';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Ban,
  Droplet,
  Trash2
} from 'lucide-react';

export default function KeuanganKasPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundFilter, setFundFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // 3-Fund balances
  const [balances, setBalances] = useState({
    kasUmum: 0,
    danaAir: 0,
    danaSampah: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<CashTransaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formFundType, setFormFundType] = useState<FundType>('KAS_UMUM');
  const [formTxType, setFormTxType] = useState<TransactionType>('MASUK');
  const [formCategory, setFormCategory] = useState('Iuran Warga');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formDescription, setFormDescription] = useState('');
  const [formProofUrl, setFormProofUrl] = useState('');

  const supabase = createClient();

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);

      // Calculate separate balances for each fund (only VALID txs - PRD BR-007, BR-008)
      let bUmum = 0;
      let bAir = 0;
      let bSampah = 0;

      data.forEach((tx) => {
        if (tx.status === 'VALID') {
          const amt = Number(tx.amount);
          const diff = tx.transaction_type === 'MASUK' ? amt : -amt;
          if (tx.fund_type === 'KAS_UMUM') bUmum += diff;
          else if (tx.fund_type === 'DANA_AIR') bAir += diff;
          else if (tx.fund_type === 'DANA_SAMPAH') bSampah += diff;
        }
      });

      setBalances({
        kasUmum: bUmum,
        danaAir: bAir,
        danaSampah: bSampah,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const openAddModal = (type: TransactionType = 'MASUK') => {
    setFormTxType(type);
    setFormFundType('KAS_UMUM');
    setFormCategory(type === 'MASUK' ? 'Iuran Warga' : 'Operasional');
    setFormAmount(0);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDescription('');
    setFormProofUrl('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    if (formAmount <= 0) {
      setModalError('Nominal transaksi harus lebih dari 0.');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('cash_transactions').insert({
        transaction_date: formDate,
        fund_type: formFundType,
        transaction_type: formTxType,
        category: formCategory.trim(),
        amount: formAmount,
        description: formDescription.trim(),
        proof_url: formProofUrl.trim() || null,
        status: 'VALID',
        recorded_by: user?.id || null,
      });

      if (error) throw error;

      setIsModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSaving(false);
    }
  };

  // Void Handler (PRD BR-006 & BR-008: Transaksi tidak dihapus permanen, gunakan status VOID)
  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('cash_transactions')
        .update({
          status: 'VOID',
          void_reason: voidReason.trim(),
          void_at: new Date().toISOString(),
          void_by: user?.id || null,
        })
        .eq('id', selectedTx.id);

      if (error) throw error;

      setIsVoidModalOpen(false);
      setSelectedTx(null);
      setVoidReason('');
      fetchTransactions();
    } catch (err: any) {
      alert('Gagal membatalkan transaksi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTxs = transactions.filter((tx) => {
    const matchSearch =
      tx.category.toLowerCase().includes(search.toLowerCase()) ||
      tx.description.toLowerCase().includes(search.toLowerCase());

    const matchFund = fundFilter === 'ALL' || tx.fund_type === fundFilter;
    const matchType = typeFilter === 'ALL' || tx.transaction_type === typeFilter;

    return matchSearch && matchFund && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Keuangan & Pemisahan 3 Kantong Kas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kas masuk & kas keluar dengan pemisahan saldo independen (PRD Modul 14, 15, 16).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModal('MASUK')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowDownRight className="w-4 h-4" />
            Kas Masuk
          </button>
          <button
            onClick={() => openAddModal('KELUAR')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            Kas Keluar
          </button>
        </div>
      </div>

      {/* 3 Fund Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kas Umum */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Kas Umum</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatRupiah(balances.kasUmum)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Iuran warga, operasional umum & keamanan</p>
        </div>

        {/* Dana Air */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">Dana Air</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatRupiah(balances.danaAir)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pembayaran air & perawatan pompa</p>
        </div>

        {/* Dana Sampah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Dana Sampah</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatRupiah(balances.danaSampah)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Iuran kebersihan & operasional sampah</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari kategori atau keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Kantong Dana:</span>
            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
            >
              <option value="ALL">Semua Dana</option>
              <option value="KAS_UMUM">Kas Umum</option>
              <option value="DANA_AIR">Dana Air</option>
              <option value="DANA_SAMPAH">Dana Sampah</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Tipe:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="MASUK">Kas Masuk</option>
              <option value="KELUAR">Kas Keluar</option>
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
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Kantong Dana</th>
                <th className="px-5 py-3.5">Tipe & Kategori</th>
                <th className="px-5 py-3.5">Keterangan</th>
                <th className="px-5 py-3.5">Nominal</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data kas...
                  </td>
                </tr>
              ) : filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Belum ada riwayat transaksi kas yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      tx.status === 'VOID' ? 'bg-slate-50/60 opacity-60' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {formatDateIndo(tx.transaction_date)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.fund_type === 'KAS_UMUM'
                            ? 'bg-blue-50 text-blue-700'
                            : tx.fund_type === 'DANA_AIR'
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {tx.fund_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold mr-1.5 ${
                          tx.transaction_type === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.transaction_type === 'MASUK' ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                        {tx.transaction_type}
                      </span>
                      <span className="text-slate-700">({tx.category})</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">
                      {tx.description}
                      {tx.void_reason && (
                        <p className="text-[10px] text-rose-500 italic">Alasan Batal: {tx.void_reason}</p>
                      )}
                    </td>
                    <td
                      className={`px-5 py-3.5 font-bold ${
                        tx.status === 'VOID'
                          ? 'line-through text-slate-400'
                          : tx.transaction_type === 'MASUK'
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {tx.transaction_type === 'MASUK' ? '+' : '-'} {formatRupiah(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {tx.status === 'VALID' && (
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setVoidReason('');
                            setIsVoidModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-medium transition-colors"
                          title="Batalkan Transaksi (VOID)"
                        >
                          <Ban className="w-3 h-3" />
                          VOID
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Transaksi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Catat Transaksi Kas ({formTxType})
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipe Transaksi *</label>
                  <select
                    value={formTxType}
                    onChange={(e) => setFormTxType(e.target.value as TransactionType)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="MASUK">Kas Masuk (Pemasukan)</option>
                    <option value="KELUAR">Kas Keluar (Pengeluaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kantong Dana *</label>
                  <select
                    value={formFundType}
                    onChange={(e) => setFormFundType(e.target.value as FundType)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    <option value="KAS_UMUM">KAS UMUM</option>
                    <option value="DANA_AIR">DANA AIR</option>
                    <option value="DANA_SAMPAH">DANA SAMPAH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Operasional Pompa"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nominal Transaksi (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Keterangan Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Penjelasan transaksi..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal VOID / Batalkan Transaksi */}
      {isVoidModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                Batalkan Transaksi (VOID)
              </h2>
              <button onClick={() => setIsVoidModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 mb-4">
              <p><strong>Transaksi:</strong> {selectedTx.category} ({selectedTx.transaction_type})</p>
              <p><strong>Nominal:</strong> {formatRupiah(selectedTx.amount)}</p>
              <p><strong>Kantong Dana:</strong> {selectedTx.fund_type}</p>
              <p className="text-[11px] text-slate-500">
                Sesuai aturan (PRD BR-006 & BR-008), transaksi tidak akan dihapus melainkan diberi status VOID dan tidak lagi dihitung dalam saldo.
              </p>
            </div>

            <form onSubmit={handleVoid} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan / Koreksi *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Misal: Salah input nominal / duplikat pencatatan..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Konfirmasi VOID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
