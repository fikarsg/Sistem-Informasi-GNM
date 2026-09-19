'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { House, Resident } from '@/lib/types/database';
import { Home, Users, Droplet, Shield, Loader2, Phone, Mail } from 'lucide-react';

export default function WargaRumahPage() {
  const [house, setHouse] = useState<House | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchHouseDetails() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentRes } = await supabase
        .from('residents')
        .select('*, house:houses(*)')
        .eq('user_id', user.id)
        .single();

      if (currentRes?.house) {
        setHouse(currentRes.house as House);

        // Fetch all residents living in this same house
        const { data: allRes } = await supabase
          .from('residents')
          .select('*')
          .eq('house_id', currentRes.house.id)
          .order('is_primary', { ascending: false });

        if (allRes) setResidents(allRes);
      }
      setLoading(false);
    }

    fetchHouseDetails();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        Memuat informasi rumah Anda...
      </div>
    );
  }

  if (!house) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
        Akun Anda belum terhubung dengan data rumah manapun. Hubungi pengurus perumahan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Home className="w-6 h-6 text-emerald-600" />
          Informasi Rumah Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Rincian nomor hunian, meteran air, dan daftar keluarga terdaftar.
        </p>
      </div>

      {/* House Specs Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
              <Home className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Blok {house.block} - Nomor {house.house_number}
              </h2>
              <p className="text-xs text-slate-500">{house.address || 'Perumahan Graha Nanggala Mekar'}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
            {house.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Nomor Meter Air:</span>
            <div className="flex items-center gap-2 font-mono font-bold text-slate-900 text-sm">
              <Droplet className="w-4 h-4 text-cyan-600" />
              {house.water_meter_number || 'Belum Terpasang'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Layanan Kebersihan Sampah:</span>
            <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
              <Shield className="w-4 h-4 text-emerald-600" />
              Status: {house.garbage_status}
            </div>
          </div>
        </div>
      </div>

      {/* Residents List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          Daftar Penghuni Rumah Terdaftar ({residents.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {residents.map((r) => (
            <div key={r.id} className="py-3.5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{r.full_name}</span>
                  {r.is_primary && (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      Kepala Keluarga
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  {r.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" /> {r.phone}
                    </span>
                  )}
                  {r.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {r.email}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {r.resident_status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
