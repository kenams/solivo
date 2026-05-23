import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Solivo — Solidarité locale, impact mondial",
  description: "Rejoignez les maraudes près de chez vous, signalez des personnes dans le besoin, faites des dons transparents.",
  keywords: "maraude, solidarité, bénévolat, don alimentaire, aide sans-abri, association, entraide",
  openGraph: {
    title: "Solivo — Solidarité locale, impact mondial",
    description: "La plateforme collaborative de maraudes et d'entraide sociale.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans bg-white text-gray-900 antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f1f35",
              color: "#fff",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#34d399", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
