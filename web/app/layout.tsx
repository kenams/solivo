import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solivo — Solidarité locale, impact mondial",
  description: "Rejoignez les maraudes près de chez vous, signalez des personnes dans le besoin, faites des dons transparents.",
  keywords: "maraude, solidarité, bénévolat, don alimentaire, aide sans-abri, association, entraide",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
