'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Announcement } from '@/lib/types/database';
import { formatDateIndo } from '@/lib/utils';
import { Megaphone, Search, Loader2 } from 'lucide-react';

export default function WargaPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('published_at', { ascending: false });

      if (data) setAnnouncements(data);
      setLoading(false);
    }

    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-emerald-600" />
          Pengumuman & Informasi Perumahan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Informasi resmi, surat edaran, dan kegiatan paguyuban perumahan.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat pengumuman warga...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada pengumuman yang dipublikasikan.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <span className="text-[11px] text-slate-400 font-medium">
                Diterbitkan pada {formatDateIndo(item.published_at)}
              </span>
              <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
