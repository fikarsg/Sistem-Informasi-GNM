import { WargaNavbar } from '@/components/warga/WargaNavbar';

export const dynamic = 'force-dynamic';

export default function WargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pb-0">
      <WargaNavbar />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
