'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Receipt,
  History,
  PieChart,
  Megaphone,
  User,
  LogOut,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const wargaLinks = [
  { name: 'Dashboard', href: '/warga', icon: LayoutDashboard },
  { name: 'Rumah Saya', href: '/warga/rumah', icon: Home },
  { name: 'Tagihan Saya', href: '/warga/tagihan', icon: Receipt },
  { name: 'Riwayat Bayar', href: '/warga/riwayat', icon: History },
  { name: 'Transparansi', href: '/warga/transparansi', icon: PieChart },
  { name: 'Pengumuman', href: '/warga/pengumuman', icon: Megaphone },
  { name: 'Profil', href: '/warga/profil', icon: User },
];

export function WargaNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 tracking-tight">SIP-GNM</span>
              <span className="text-[11px] text-emerald-600 font-semibold ml-2 bg-emerald-50 px-2 py-0.5 rounded-full">
                Warga
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1">
            {wargaLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </nav>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {wargaLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Keluar (Logout)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Sangat nyaman dioperasikan dengan satu jempol) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg shadow-slate-900/10 px-2 py-1.5 flex items-center justify-around">
        <Link
          href="/warga"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname === '/warga'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Beranda</span>
        </Link>
        <Link
          href="/warga/tagihan"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname === '/warga/tagihan'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Tagihan</span>
        </Link>
        <Link
          href="/warga/riwayat"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname === '/warga/riwayat'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Riwayat</span>
        </Link>
        <Link
          href="/warga/transparansi"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname === '/warga/transparansi'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Kas RT</span>
        </Link>
        <Link
          href="/warga/profil"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            pathname === '/warga/profil'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Profil</span>
        </Link>
      </nav>
    </>
  );
}
