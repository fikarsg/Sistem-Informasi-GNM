'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PengaturanPage() {
  const [housingName, setHousingName] = useState('Perumahan Graha Nanggala Mekar (GNM)');
  const [waterRate, setWaterRate] = useState('3500');
  const [garbageFee, setGarbageFee] = useState('25000');
  const [dueDateDay, setDueDateDay] = useState('20');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      const { data } = await supabase.from('system_settings').select('*');
      if (data) {
        data.forEach((s) => {
          if (s.key === 'HOUSING_NAME') setHousingName(s.value);
          if (s.key === 'WATER_RATE_PER_M3') setWaterRate(s.value);
          if (s.key === 'GARBAGE_FEE_MONTHLY') setGarbageFee(s.value);
          if (s.key === 'DUE_DATE_DAY_OF_MONTH') setDueDateDay(s.value);
        });
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const updates = [
        { key: 'HOUSING_NAME', value: housingName },
        { key: 'WATER_RATE_PER_M3', value: waterRate },
        { key: 'GARBAGE_FEE_MONTHLY', value: garbageFee },
        { key: 'DUE_DATE_DAY_OF_MONTH', value: dueDateDay },
      ];

      for (const item of updates) {
        await supabase
          .from('system_settings')
          .upsert(item, { onConflict: 'key' });
      }

      setFeedback({ type: 'success', message: 'Pengaturan sistem berhasil diperbarui.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Pengaturan Sistem Perumahan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi tarif default, tanggal jatuh tempo, dan informasi identitas perumahan.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Memuat konfigurasi...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perumahan / Paguyuban
              </label>
              <input
                type="text"
                required
                value={housingName}
                onChange={(e) => setHousingName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tarif Air Dasar per m³ (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  value={waterRate}
                  onChange={(e) => setWaterRate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Iuran Sampah Bulanan Default (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="5000"
                  value={garbageFee}
                  onChange={(e) => setGarbageFee(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Batas Jatuh Tempo Tagihan Bulanan (1 - 28)
              </label>
              <input
                type="number"
                required
                min="1"
                max="28"
                value={dueDateDay}
                onChange={(e) => setDueDateDay(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
