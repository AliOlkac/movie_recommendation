import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import Navbar from "@/components/Navbar"; // Navbar importunu kaldır

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Film Öneri Sistemi",
  description: "Kişiselleştirilmiş film önerileri alın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* <Navbar /> Navbar çağrısını kaldır */}
        {children}
      </body>
    </html>
  );
}
