'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Resident, House, ResidentStatus } from '@/lib/types/database';
import { Users, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, X, Loader2, Phone, Home } from 'lucide-react';

export default function DataWargaPage() {
  const [residents, setResidents] = useState<(Resident & { house?: House })[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formFullName, setFormFullName] = useState('');
  const [formHouseId, setFormHouseId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formResidentStatus, setFormResidentStatus] = useState<ResidentStatus>('PEMILIK');
  const [formIsPrimary, setFormIsPrimary] = useState(true);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    // Fetch residents with houses
    const { data: resData } = await supabase
      .from('residents')
      .select('*, house:houses(*)')
      .order('full_name', { ascending: true });

    // Fetch houses for dropdown
    const { data: houseData } = await supabase
      .from('houses')
      .select('*')
      .order('block', { ascending: true })
      .order('house_number', { ascending: true });

    if (resData) setResidents(resData);
    if (houseData) setHouses(houseData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingResident(null);
    setFormFullName('');
    setFormHouseId(houses[0]?.id || '');
    setFormPhone('');
    setFormEmail('');
    setFormResidentStatus('PEMILIK');
    setFormIsPrimary(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Resident) => {
    setEditingResident(r);
    setFormFullName(r.full_name);
    setFormHouseId(r.house_id || '');
    setFormPhone(r.phone || '');
    setFormEmail(r.email || '');
    setFormResidentStatus(r.resident_status);
    setFormIsPrimary(r.is_primary);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    try {
      if (editingResident) {
        const { error } = await supabase
          .from('residents')
          .update({
            full_name: formFullName.trim(),
            house_id: formHouseId || null,
            phone: formPhone.trim(),
            email: formEmail.trim() || null,
            resident_status: formResidentStatus,
            is_primary: formIsPrimary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingResident.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('residents').insert({
          full_name: formFullName.trim(),
          house_id: formHouseId || null,
          phone: formPhone.trim(),
          email: formEmail.trim() || null,
          resident_status: formResidentStatus,
          is_primary: formIsPrimary,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan data warga.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data warga ${name}?`)) return;
    const { error } = await supabase.from('residents').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      fetchData();
    }
  };

  const filteredResidents = residents.filter((r) => {
    const matchSearch =
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.phone && r.phone.includes(search)) ||
      (r.email && r.email.toLowerCase().includes(search.toLowerCase())) ||
      (r.house && (r.house.block + r.house.house_number).toLowerCase().includes(search.toLowerCase()));

    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Warga Perumahan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan penghuni, kontak WhatsApp, status kepemilikan, dan relasi rumah (PRD Modul 9).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Warga Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, atau rumah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500">
          Total: <strong>{filteredResidents.length}</strong> warga terdaftar
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Nama Lengkap</th>
                <th className="px-5 py-3.5">Rumah Ditinggali</th>
                <th className="px-5 py-3.5">Kontak WhatsApp</th>
                <th className="px-5 py-3.5">Status Hunian</th>
                <th className="px-5 py-3.5">Penanggung Jawab</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data warga...
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada data warga ditemukan.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {r.full_name.charAt(0)}
                        </div>
                        <div>
                          <p>{r.full_name}</p>
                          {r.email && <p className="text-[10px] text-slate-400 font-normal">{r.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.house ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                          <Home className="w-3 h-3 text-slate-500" />
                          Blok {r.house.block} - No. {r.house.house_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum dikaitkan</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.phone ? (
                        <a
                          href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {r.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {r.resident_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.is_primary ? (
                        <span className="text-emerald-700 font-medium text-[11px]">Kepala Keluarga</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Anggota</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, r.full_name)}
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
                {editingResident ? 'Edit Data Warga' : 'Tambah Warga Baru'}
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
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Bambang Sutrisno"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rumah Terkait *</label>
                <select
                  value={formHouseId}
                  onChange={(e) => setFormHouseId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih Rumah --</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      Blok {h.block} - No. {h.house_number} ({h.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Penghuni</label>
                  <select
                    value={formResidentStatus}
                    onChange={(e) => setFormResidentStatus(e.target.value as ResidentStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="PEMILIK">PEMILIK</option>
                    <option value="PENGONTRAK">PENGONTRAK</option>
                    <option value="KELUARGA">KELUARGA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="bambang@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={formIsPrimary}
                  onChange={(e) => setFormIsPrimary(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="primaryCheck" className="text-xs text-slate-700 cursor-pointer">
                  Jadikan Kepala Keluarga / Kontak Utama Rumah
                </label>
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
                  Simpan Warga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
