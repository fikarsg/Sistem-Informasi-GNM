'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Resident, House, ResidentStatus } from '@/lib/types/database';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Phone,
  Home,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Copy,
  Check,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  createResidentAction,
  createAccountForExistingResidentAction,
  resetResidentPasswordAction,
  deleteResidentWithAccountAction,
} from './actions';

export default function DataWargaPage() {
  const [residents, setResidents] = useState<(Resident & { house?: House })[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Tambah / Edit Resident
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
  const [formCreateAccount, setFormCreateAccount] = useState(true);
  const [formPassword, setFormPassword] = useState('');

  // Modal Buat Akun untuk Warga yang Sudah Ada
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [targetResident, setTargetResident] = useState<Resident | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Modal Reset Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetResident, setResetTargetResident] = useState<Resident | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Modal Popup Sukses Akun Dibuat
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    house?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = 'gnm';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

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
    setFormCreateAccount(true);
    setFormPassword(generateRandomPassword());
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
    setFormCreateAccount(false);
    setFormPassword('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openCreateAccountModal = (r: Resident) => {
    setTargetResident(r);
    setAccountEmail(r.email || (r.phone ? `warga.${r.phone.replace(/[^0-9]/g, '')}@gnm.id` : ''));
    setAccountPassword(generateRandomPassword());
    setAccountError(null);
    setIsCreateAccountModalOpen(true);
  };

  const openResetPasswordModal = (r: Resident) => {
    setResetTargetResident(r);
    setNewPassword(generateRandomPassword());
    setResetError(null);
    setIsResetModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    try {
      if (editingResident) {
        // Edit resident data
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
        setIsModalOpen(false);
        fetchData();
      } else {
        // Tambah resident baru via Server Action (bisa langsung buat akun login)
        const res = await createResidentAction({
          fullName: formFullName,
          houseId: formHouseId || null,
          phone: formPhone || null,
          email: formEmail || null,
          residentStatus: formResidentStatus,
          isPrimary: formIsPrimary,
          createAccount: formCreateAccount,
          password: formPassword || null,
        });

        if (!res.success) {
          throw new Error(res.error);
        }

        setIsModalOpen(false);
        await fetchData();

        // Jika akun login dibuat, tampilkan popup kredensial
        if (formCreateAccount && res.credentials) {
          const selectedHouse = houses.find((h) => h.id === formHouseId);
          setCreatedCredentials({
            name: formFullName,
            email: res.credentials.email,
            password: res.credentials.password,
            phone: formPhone,
            house: selectedHouse ? `Blok ${selectedHouse.block} No. ${selectedHouse.house_number}` : undefined,
          });
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan data warga.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResident) return;

    setAccountSaving(true);
    setAccountError(null);

    try {
      const res = await createAccountForExistingResidentAction({
        residentId: targetResident.id,
        email: accountEmail,
        password: accountPassword,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setIsCreateAccountModalOpen(false);
      await fetchData();

      const houseName = targetResident.house
        ? `Blok ${targetResident.house.block} No. ${targetResident.house.house_number}`
        : undefined;

      setCreatedCredentials({
        name: targetResident.full_name,
        email: accountEmail,
        password: accountPassword,
        phone: targetResident.phone,
        house: houseName,
      });
    } catch (err: any) {
      setAccountError(err.message || 'Gagal membuat akun.');
    } finally {
      setAccountSaving(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetResident || !resetTargetResident.user_id) return;

    setResetSaving(true);
    setResetError(null);

    try {
      const res = await resetResidentPasswordAction({
        userId: resetTargetResident.user_id,
        newPassword,
        residentName: resetTargetResident.full_name,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setIsResetModalOpen(false);
      alert(`Password untuk ${resetTargetResident.full_name} berhasil diubah menjadi: ${newPassword}`);
    } catch (err: any) {
      setResetError(err.message || 'Gagal mereset password.');
    } finally {
      setResetSaving(false);
    }
  };

  const handleDelete = async (r: Resident) => {
    const hasAccount = !!r.user_id;
    const confirmMsg = hasAccount
      ? `Hapus data warga ${r.full_name}? Akun login warga ini juga akan dihapus dari sistem.`
      : `Hapus data warga ${r.full_name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await deleteResidentWithAccountAction(r.id);
      if (!res.success) {
        alert('Gagal menghapus: ' + res.error);
      } else {
        fetchData();
      }
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `*AKSES LOGIN SISTEM INFORMASI GNM*\n\n` +
      `Halo Bapak/Ibu ${createdCredentials.name},\n` +
      (createdCredentials.house ? `Rumah: ${createdCredentials.house}\n` : '') +
      `Silakan login ke portal warga:\n` +
      `🌐 Link: https://sistem-informasi-gnm.vercel.app/login\n` +
      `📧 Email: ${createdCredentials.email}\n` +
      `🔑 Password: ${createdCredentials.password}\n\n` +
      `Melalui portal ini Anda dapat melihat riwayat tagihan air, iuran sampah, dan transparansi keuangan perumahan.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!createdCredentials || !createdCredentials.phone) return;
    const cleanPhone = createdCredentials.phone.replace(/[^0-9]/g, '');
    const phoneFormatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const text = `*AKSES LOGIN SISTEM INFORMASI GNM*\n\n` +
      `Halo Bapak/Ibu ${createdCredentials.name},\n` +
      (createdCredentials.house ? `Rumah: ${createdCredentials.house}\n` : '') +
      `Silakan login ke portal warga perumahan kami:\n` +
      `🌐 Link: https://sistem-informasi-gnm.vercel.app/login\n` +
      `📧 Email: ${createdCredentials.email}\n` +
      `🔑 Password: ${createdCredentials.password}\n\n` +
      `Melalui portal ini Anda dapat memantau rincian tagihan air, pembayaran iuran sampah, dan transparansi keuangan kas RT.`;

    window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(text)}`, '_blank');
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Warga & Akun Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan penghuni rumah, kontak WhatsApp, serta penerbitan akun login warga untuk portal mandiri.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Tambah Warga & Akun
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, email, atau blok rumah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Punya Akun: <strong>{residents.filter((r) => !!r.user_id).length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Belum Ada Akun: <strong>{residents.filter((r) => !r.user_id).length}</strong>
          </span>
          <span>
            Total: <strong>{filteredResidents.length}</strong> warga
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Nama & Kontak</th>
                <th className="px-5 py-3.5">Rumah Ditinggali</th>
                <th className="px-5 py-3.5">Status Hunian</th>
                <th className="px-5 py-3.5">Status Akun Login</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data warga...
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Tidak ada data warga ditemukan.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nama & Kontak */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {r.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{r.full_name}</span>
                            {r.is_primary && (
                              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                Kepala Keluarga
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] font-normal text-slate-500">
                            {r.phone ? (
                              <a
                                href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {r.phone}
                              </a>
                            ) : (
                              <span>No WA: -</span>
                            )}
                            {r.email && <span className="text-slate-400">| {r.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rumah */}
                    <td className="px-5 py-3.5">
                      {r.house ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 bg-slate-100/80 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                          <Home className="w-3.5 h-3.5 text-blue-600" />
                          Blok {r.house.block} - No. {r.house.house_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum dikaitkan rumah</span>
                      )}
                    </td>

                    {/* Status Hunian */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.resident_status === 'PEMILIK'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : r.resident_status === 'PENGONTRAK'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.resident_status}
                      </span>
                    </td>

                    {/* Status Akun Login */}
                    <td className="px-5 py-3.5">
                      {r.user_id ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Akun Aktif
                          </span>
                          <button
                            onClick={() => openResetPasswordModal(r)}
                            className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                            title="Reset password login warga ini"
                          >
                            <KeyRound className="w-3 h-3" />
                            Reset Password
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                            Belum Ada Akun
                          </span>
                          <button
                            onClick={() => openCreateAccountModal(r)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:bg-blue-50 font-semibold px-2 py-0.5 rounded border border-blue-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Buatkan Akun
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                        title="Edit Data Warga"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                        title="Hapus Data & Akun"
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

      {/* MODAL 1: Tambah / Edit Resident */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingResident ? 'Edit Data Warga' : 'Tambah Warga Baru'}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingResident
                    ? 'Perbarui profil dan kontak warga.'
                    : 'Daftarkan penghuni rumah dan buatkan akun login portal mandiri.'}
                </p>
              </div>
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Bambang Sutrisno"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rumah Terkait *</label>
                <select
                  value={formHouseId}
                  onChange={(e) => setFormHouseId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
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
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      if (!editingResident && !formEmail && e.target.value) {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        setFormEmail(`warga.${clean}@gnm.id`);
                      }
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Penghuni</label>
                  <select
                    value={formResidentStatus}
                    onChange={(e) => setFormResidentStatus(e.target.value as ResidentStatus)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="PEMILIK">PEMILIK</option>
                    <option value="PENGONTRAK">PENGONTRAK</option>
                    <option value="KELUARGA">KELUARGA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email {!editingResident && formCreateAccount ? '(Digunakan untuk login) *' : '(Opsional)'}
                </label>
                <input
                  type="email"
                  required={!editingResident && formCreateAccount}
                  placeholder="bambang@gmail.com atau warga.08123@gnm.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  Jadikan Kepala Keluarga / Penanggung Jawab Utama Rumah
                </label>
              </div>

              {/* Box Pembuatan Akun Otomatis (Hanya untuk Tambah Baru) */}
              {!editingResident && (
                <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="createAccountCheck"
                        checked={formCreateAccount}
                        onChange={(e) => setFormCreateAccount(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="createAccountCheck" className="text-xs font-bold text-slate-900 cursor-pointer">
                        Buatkan Akun Login Portal Warga Sekaligus
                      </label>
                    </div>
                    {formCreateAccount && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Siap Terbit
                      </span>
                    )}
                  </div>

                  {formCreateAccount && (
                    <div className="pt-2 space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700">Password Login *</label>
                          <button
                            type="button"
                            onClick={() => setFormPassword(generateRandomPassword())}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Acak Password
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Akun ini memungkinkan warga login di{' '}
                        <code className="text-blue-600 font-semibold">/login</code> dan otomatis melihat tagihan air & sampah rumah ini.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
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
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors shadow-blue-500/20"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {editingResident ? 'Simpan Perubahan' : 'Daftarkan Warga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Buat Akun untuk Warga yang Sudah Terdaftar */}
      {isCreateAccountModalOpen && targetResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Terbitkan Akun Login</h2>
                <p className="text-xs text-slate-500 mt-0.5">Untuk: {targetResident.full_name}</p>
              </div>
              <button onClick={() => setIsCreateAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {accountError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{accountError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Login *</label>
                <input
                  type="email"
                  required
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="contoh: bambang@gmail.com"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Password Awal *</label>
                  <button
                    type="button"
                    onClick={() => setAccountPassword(generateRandomPassword())}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Acak Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={accountSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors shadow-blue-500/20"
                >
                  {accountSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Aktifkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password Warga */}
      {isResetModalOpen && resetTargetResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Reset Password Warga</h2>
                <p className="text-xs text-slate-500 mt-0.5">Warga: {resetTargetResident.full_name}</p>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Password Baru *</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Acak Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors shadow-blue-500/20"
                >
                  {resetSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Popup Kredensial Akun Berhasil Dibuat */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-emerald-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h2 className="text-center text-lg font-bold text-slate-900">Akun Warga Siap Digunakan!</h2>
            <p className="text-center text-xs text-slate-500 mt-1">
              Akun portal mandiri untuk <strong>{createdCredentials.name}</strong> berhasil dibuat.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              {createdCredentials.house && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Rumah:</span>
                  <span className="font-semibold text-slate-800">{createdCredentials.house}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Email Login:</span>
                <span className="font-mono font-semibold text-blue-700">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Password:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  {createdCredentials.password}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Halaman Login:</span>
                <span className="font-mono text-slate-600 text-[11px]">sistem-informasi-gnm.vercel.app/login</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleCopyCredentials}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Berhasil Disalin ke Clipboard!' : 'Salin Informasi Akun'}
              </button>

              {createdCredentials.phone && (
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  Kirim Akses Akun via WhatsApp
                </button>
              )}

              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Tutup Jendela Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
