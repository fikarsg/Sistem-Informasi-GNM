import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Droplet,
  Trash2,
  Wallet,
  Users,
  ArrowRight,
  CheckCircle2,
  Lock,
  Smartphone,
  BarChart3,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans antialiased relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-[-60px] right-1/4 w-[450px] h-[450px] bg-indigo-400/15 rounded-full blur-3xl" />
        <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-300/10 rounded-full blur-3xl" />
      </div>

      {/* Header / Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">SIP-GNM</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  V1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Perumahan Griya Nusantara Mandiri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Masuk ke Akun
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Status pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-sm text-slate-700 text-xs font-semibold mb-6 hover:border-slate-300 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sistem Informasi Terpadu & Transparansi Lingkungan</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] text-balance">
            Transparansi, Efisiensi, &{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              Pengelolaan Warga Mandiri
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed text-balance">
            Prinsip utama: <strong className="text-slate-800 font-semibold">Pengurus mengelola</strong> secara akuntabel,{' '}
            <strong className="text-slate-800 font-semibold">warga mengetahui</strong> secara transparan. Dari meter air, iuran sampah, hingga pembagian 3 kantong kas dana lingkungan.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/35"
            >
              Buka Portal Warga & Pengurus
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium text-slate-500">Pemisahan Dana</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">3 Kantong Kas</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Umum, Air, & Sampah</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium text-slate-500">Pencatatan Air</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Meter Otomatis</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Kalkulasi m³ transparan</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium text-slate-500">Transparansi</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">100% Real-time</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dapat dipantau warga</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium text-slate-500">Akses Mandiri</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Portal Online</p>
              <p className="text-[11px] text-slate-400 mt-0.5">HP / Komputer 24 Jam</p>
            </div>
          </div>
        </div>

        {/* Mockup Preview Card */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16">
          <div className="relative rounded-3xl border border-slate-200/90 bg-white/95 p-3 sm:p-5 shadow-2xl shadow-slate-300/40 backdrop-blur-md">
            {/* Window header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">portal-warga.gnm.id</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Dilindungi RLS Supabase
              </span>
            </div>

            {/* Mockup Content */}
            <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200/70">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Ringkasan Tagihan & Transparansi Kas Rumah
                  </h4>
                  <p className="text-xs text-slate-500">Hunian Terkait: Blok B No. 04 • Status: Kepala Keluarga</p>
                </div>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm">
                  Status: Tertib Iuran
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Tagihan Air Bulan Ini</span>
                    <Droplet className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">Rp 52.500</p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    ✓ Lunas (Pemakaian 15 m³)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Iuran Kebersihan Sampah</span>
                    <Trash2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">Rp 25.000</p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    ✓ Lunas Terjadwal
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Transparansi Saldo Kas</span>
                    <Wallet className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">Rp 18.420.000</p>
                  <span className="inline-block mt-2 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    3 Kantong Terpisah Akuntabel
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Fitur Lengkap
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dirancang Khusus untuk Kebutuhan Pengurus & Warga
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Semua alur pengelolaan operasional perumahan dibuat praktis, otomatis, dan transparan dari awal hingga akhir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Air */}
            <div className="group p-6 bg-slate-50/80 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100/80 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Pencatatan Meter Air</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan meteran air per bulan, kalkulasi otomatis pemakaian m³, dan validasi angka agar tidak ada kesalahan catat.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-[11px] font-semibold text-blue-600">
                <span>Formula m³ otomatis</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Sampah */}
            <div className="group p-6 bg-slate-50/80 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-100/80 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Iuran Sampah Terpadu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penerbitan tagihan kebersihan berkala otomatis untuk seluruh rumah aktif dan pemantauan status tunggakan tanpa repot.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-[11px] font-semibold text-emerald-600">
                <span>Batch generate otomatis</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: 3 Kantong Kas */}
            <div className="group p-6 bg-slate-50/80 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-amber-100/80 text-amber-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Pemisahan 3 Kantong Kas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemisahan saldo Kas Umum, Dana Air, dan Dana Sampah secara independen tanpa risiko percampuran dana iuran.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-[11px] font-semibold text-amber-600">
                <span>Anti percampuran dana</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Portal Warga */}
            <div className="group p-6 bg-slate-50/80 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100/80 text-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Portal Mandiri Warga</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Warga login dengan akun sendiri untuk melihat tagihan rumah, riwayat pembayaran, transparansi kas, dan pengumuman.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-[11px] font-semibold text-purple-600">
                <span>Akses privasi per rumah</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Perspective: Untuk Siapa? */}
      <section className="py-16 sm:py-24 bg-slate-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Satu Sistem, Dua Pengalaman Khusus
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Didesain agar Pengurus leluasa mengelola dan Warga merasa tenang karena keterbukaan informasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Box Warga */}
            <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4 border border-emerald-200/60">
                <Smartphone className="w-3.5 h-3.5" />
                UNTUK WARGA PERUMAHAN
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Kemudahan & Transparansi Penuh</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Tidak perlu lagi bingung menghitung meteran air atau bertanya bukti setoran iuran. Semua terpantau jelas dari ponsel Anda.
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Melihat rincian tagihan air bulanan & riwayat pemakaian m³</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mengecek status pembayaran iuran sampah rumah sendiri</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Transparansi arus kas dana lingkungan tanpa ada yang disembunyikan</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Menerima pengumuman resmi dan agenda kegiatan warga secara aktual</span>
                </li>
              </ul>
            </div>

            {/* Box Pengurus */}
            <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-4 border border-blue-200/60">
                <BarChart3 className="w-3.5 h-3.5" />
                UNTUK PENGURUS RT / LINGKUNGAN
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pengelolaan Rapi & Akuntabel</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Tinggalkan pencatatan manual di buku kas yang rawan selisih. Seluruh proses pembukuan dan verifikasi terotomatisasi.
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Input meter air cepat dengan validasi toleransi angka otomatis</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Penerbitan akun login warga 1-klik dengan integrasi kirim WhatsApp</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Pemisahan 3 kantong kas (Umum, Air, Sampah) yang akurat dan otomatis</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Ekspor laporan lengkap ke Excel & rekap audit log setiap aktivitas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Siap Mengakses Sistem Informasi Lingkungan?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Masuk dengan akun terdaftar untuk memeriksa tagihan rumah atau mengelola operasional perumahan.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm sm:text-base font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-2xl shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-white/20"
            >
              Masuk ke Portal Sekarang
              <ArrowRight className="w-4 h-4 ml-2 text-blue-600" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-200">SIP-GNM</span>
            <span className="text-slate-500">| Perumahan Griya Nusantara Mandiri</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistem Online & Terkoneksi</span>
          </div>

          <p className="text-slate-500 text-[11px]">
            © 2026 SIP-GNM. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
