'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Users,
  Droplet,
  Trash2,
  CreditCard,
  Wallet,
  BarChart3,
  Megaphone,
  History,
  Settings,
  LogOut,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  {
    name: 'Data Perumahan',
    items: [
      { name: 'Data Rumah', href: '/admin/rumah', icon: Home },
      { name: 'Data Warga', href: '/admin/warga', icon: Users },
    ],
  },
  {
    name: 'Tagihan',
    items: [
      { name: 'Tagihan Air', href: '/admin/tagihan-air', icon: Droplet },
      { name: 'Tagihan Sampah', href: '/admin/tagihan-sampah', icon: Trash2 },
    ],
  },
  { name: 'Catat Pembayaran', href: '/admin/pembayaran', icon: CreditCard },
  { name: 'Keuangan & Kas', href: '/admin/keuangan', icon: Wallet },
  { name: 'Laporan', href: '/admin/laporan', icon: BarChart3 },
  { name: 'Pengumuman', href: '/admin/pengumuman', icon: Megaphone },
  { name: 'Audit Log', href: '/admin/audit-log', icon: History },
  { name: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-900 leading-tight">SIP-GNM</h1>
          <p className="text-[11px] text-blue-600 font-medium">Panel Pengurus</p>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navigation.map((group, idx) => {
          if ('items' in group && group.items) {
            return (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.name}
                </p>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            );
          }

          const isActive = pathname === group.href;
          const Icon = group.icon;
          return (
            <div key={idx}>
              <Link
                href={group.href!}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />}
                {group.name}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar (Logout)
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900">SIP-GNM (Pengurus)</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 max-w-[80vw] bg-white h-full z-10 shadow-xl">
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0">
        <NavContent />
      </aside>
    </>
  );
}
