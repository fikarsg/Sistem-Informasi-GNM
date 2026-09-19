'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuditLog } from '@/lib/types/database';
import { formatDateIndo } from '@/lib/utils';
import { History, Search, Shield, Loader2 } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase()) ||
      (l.record_id && l.record_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          Audit Log Aktivitas Sistem
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Rekaman riwayat perubahan data krusial, tagihan, dan mutasi keuangan (PRD Modul 23).
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari aktivitas, modul, atau record ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Waktu</th>
                <th className="px-5 py-3.5">Aktor / Role</th>
                <th className="px-5 py-3.5">Modul</th>
                <th className="px-5 py-3.5">Aktivitas</th>
                <th className="px-5 py-3.5">ID Terkait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat catatan audit log...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-700 font-mono text-[11px]">
                      {new Date(l.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        <Shield className="w-3 h-3 text-blue-600" />
                        {l.role || 'PENGURUS'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{l.module}</td>
                    <td className="px-5 py-3.5 font-medium text-blue-700">{l.action}</td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{l.record_id || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
