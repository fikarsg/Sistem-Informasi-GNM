import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIP-GNM | Sistem Informasi Perumahan Graha Nanggala Mekar",
  description: "Sistem Informasi Pengelolaan Tagihan, Kas, dan Administrasi Warga Perumahan Graha Nanggala Mekar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
