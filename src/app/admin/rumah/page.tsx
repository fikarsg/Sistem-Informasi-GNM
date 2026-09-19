'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { House, HouseStatus } from '@/lib/types/database';
import { Home, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function DataRumahPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formBlock, setFormBlock] = useState('A');
  const [formNumber, setFormNumber] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState<HouseStatus>('AKTIF');
  const [formWaterMeter, setFormWaterMeter] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const supabase = createClient();

  const fetchHouses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .order('block', { ascending: true })
      .order('house_number', { ascending: true });

    if (!error && data) {
      setHouses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const openAddModal = () => {
    setEditingHouse(null);
    setFormBlock('A');
    setFormNumber('');
    setFormAddress('');
    setFormStatus('AKTIF');
    setFormWaterMeter('');
    setFormNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (h: House) => {
    setEditingHouse(h);
    setFormBlock(h.block);
    setFormNumber(h.house_number);
    setFormAddress(h.address || '');
    setFormStatus(h.status);
    setFormWaterMeter(h.water_meter_number || '');
    setFormNotes(h.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    try {
      if (editingHouse) {
        // Update
        const { error } = await supabase
          .from('houses')
          .update({
            block: formBlock.trim().toUpperCase(),
            house_number: formNumber.trim(),
            address: formAddress.trim(),
            status: formStatus,
            water_meter_number: formWaterMeter.trim(),
            notes: formNotes.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingHouse.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('houses').insert({
          block: formBlock.trim().toUpperCase(),
          house_number: formNumber.trim(),
          address: formAddress.trim(),
          status: formStatus,
          water_meter_number: formWaterMeter.trim(),
          notes: formNotes.trim(),
        });

        if (error) {
          if (error.code === '23505') {
            throw new Error(`Rumah Blok ${formBlock.toUpperCase()} No. ${formNumber} sudah terdaftar!`);
          }
          throw error;
        }
      }

      setIsModalOpen(false);
      fetchHouses();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan data rumah.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Hapus data rumah ${label}? Data tagihan terkait mungkin ikut terhapus.`)) return;

    const { error } = await supabase.from('houses').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      fetchHouses();
    }
  };

  const filteredHouses = houses.filter((h) => {
    const matchSearch =
      h.block.toLowerCase().includes(search.toLowerCase()) ||
      h.house_number.toLowerCase().includes(search.toLowerCase()) ||
      (h.address && h.address.toLowerCase().includes(search.toLowerCase())) ||
      (h.water_meter_number && h.water_meter_number.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Rumah Perumahan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar blok, nomor rumah, status hunian, dan nomor meter air (PRD Modul 8).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Rumah Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari blok, nomor rumah, atau meter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Aktif</option>
            <option value="KOSONG">Kosong</option>
            <option value="NONAKTIF">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Houses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Blok / Nomor</th>
                <th className="px-5 py-3.5">Alamat</th>
                <th className="px-5 py-3.5">Meter Air</th>
                <th className="px-5 py-3.5">Status Hunian</th>
                <th className="px-5 py-3.5">Catatan</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data rumah...
                  </td>
                </tr>
              ) : filteredHouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada data rumah yang cocok.
                  </td>
                </tr>
              ) : (
                filteredHouses.map((house) => (
                  <tr key={house.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                        <Home className="w-3.5 h-3.5" />
                        Blok {house.block} - No. {house.house_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{house.address || '-'}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-700">
                      {house.water_meter_number || '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          house.status === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : house.status === 'KOSONG'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {house.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">{house.notes || '-'}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(house)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(house.id, `Blok ${house.block} No. ${house.house_number}`)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingHouse ? 'Edit Data Rumah' : 'Tambah Rumah Baru'}
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
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Blok *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: A"
                    value={formBlock}
                    onChange={(e) => setFormBlock(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Rumah *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 12A"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Nusantara Utama No. 12"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Hunian</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as HouseStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="KOSONG">KOSONG</option>
                    <option value="NONAKTIF">NONAKTIF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Meter Air</label>
                  <input
                    type="text"
                    placeholder="Contoh: WM-A12"
                    value={formWaterMeter}
                    onChange={(e) => setFormWaterMeter(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan khusus rumah (opsional)..."
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
                  Simpan Rumah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
