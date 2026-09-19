'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types/database';
import { User, Phone, Mail, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function WargaProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);

    try {
      if (!profile) return;
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      setFeedback({ type: 'success', message: 'Data profil berhasil diperbarui.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Kata sandi minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setSavingPassword(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', message: 'Kata sandi berhasil diganti.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        Memuat data profil...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" />
          Profil Akun Warga
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pengaturan kontak WhatsApp dan pembaruan kata sandi akun Anda.
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

      {/* Profil Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Informasi Akun</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Terdaftar</label>
            <input
              type="text"
              disabled
              value={profile?.email || '-'}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
            <input
              type="text"
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Simpan Profil
            </button>
          </div>
        </form>
      </div>

      {/* Ganti Password */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" />
          Ganti Kata Sandi
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Perbarui Kata Sandi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
