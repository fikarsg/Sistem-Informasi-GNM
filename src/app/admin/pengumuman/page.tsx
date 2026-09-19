'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Announcement, AnnouncementStatus } from '@/lib/types/database';
import { formatDateIndo } from '@/lib/utils';
import { Megaphone, Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function AdminPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<AnnouncementStatus>('PUBLISHED');

  const supabase = createClient();

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('published_at', { ascending: false });

    if (data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormStatus('PUBLISHED');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormStatus(item.status);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingItem) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formTitle.trim(),
            content: formContent.trim(),
            status: formStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert({
          title: formTitle.trim(),
          content: formContent.trim(),
          status: formStatus,
          created_by: user?.id || null,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan pengumuman.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus pengumuman "${title}"?`)) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      fetchAnnouncements();
    }
  };

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Pengumuman Warga Perumahan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publikasikan informasi penting, jadwal kegiatan, dan surat edaran kepada warga (PRD Modul 21).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Pengumuman Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul atau isi pengumuman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Memuat pengumuman...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada pengumuman yang dibuat.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDateIndo(item.published_at || item.created_at)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{item.content}</p>
              </div>

              <div className="flex sm:flex-col justify-end items-end gap-2 shrink-0">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Edit Pengumuman"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Hapus Pengumuman"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
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
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kerja Bakti Massal Minggu Depan"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Publikasi</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AnnouncementStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="PUBLISHED">PUBLISHED (Dilihat Seluruh Warga)</option>
                  <option value="DRAFT">DRAFT (Hanya Pengurus)</option>
                  <option value="ARCHIVED">ARCHIVED (Arsip)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Isi Pengumuman *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tuliskan isi pengumuman atau informasi secara lengkap..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
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
                  Simpan & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
