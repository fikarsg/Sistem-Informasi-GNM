import Link from "next/link";
import { Building2, ShieldCheck, Droplet, Trash2, Wallet, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">SIP-GNM</span>
              <span className="hidden sm:inline-block text-xs text-slate-500 ml-2 border-l border-slate-300 pl-2">
                Sistem Informasi Perumahan
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors duration-150"
            >
              Masuk ke Akun
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            Sistem Informasi Perumahan Terpadu
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight text-balance leading-tight">
            Transparansi, Efisiensi, & Pengelolaan Warga Mandiri
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto text-balance leading-relaxed">
            Kelola data rumah, pencatatan meter air, iuran kebersihan sampah, dan pemisahan kas keuangan secara real-time dan terbuka.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all"
            >
              Portal Login Warga & Pengurus
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">Fitur Utama Sistem</h2>
            <p className="text-sm text-slate-500 mt-1">Dirancang khusus sesuai kebutuhan operasional dan transparansi warga</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Pencatatan Tagihan Air</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan meteran air per bulan, kalkulasi otomatis pemakaian m³, dan riwayat pembayaran transparan.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Iuran Sampah Terpadu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pembuatan tagihan kebersihan berkala otomatis untuk seluruh rumah aktif dan pemantauan tunggakan.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Pemisahan 3 Kantong Kas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemisahan saldo Kas Umum, Dana Air, dan Dana Sampah secara independen tanpa risiko percampuran dana.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Portal Mandiri Warga</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Warga dapat memantau tagihan rumah sendiri, riwayat bukti bayar, dan ringkasan keuangan perumahan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 Sistem Informasi Perumahan Griya Nusantara Mandiri (SIP-GNM). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
