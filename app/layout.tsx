import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-menu-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-menu-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Dijital Kartvizit & Menü Stüdyosu",
  description:
    "İşletmeniz için saniyeler içinde profesyonel bir dijital kartvizit veya dijital menü oluşturun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50">{children}</body>
    </html>
  );
}
