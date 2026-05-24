"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, Users, AlertTriangle, Building2, MapPin, CreditCard, ShieldCheck, LogOut, ExternalLink } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/signalements", label: "Signalements", icon: AlertTriangle },
  { href: "/admin/associations", label: "Associations", icon: Building2 },
  { href: "/admin/maraudes", label: "Maraudes", icon: MapPin },
  { href: "/admin/donations", label: "Transactions Stripe", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.replace("/connexion");
    } else {
      setChecked(true);
    }
  }, [user, loading, router]);

  if (!checked) return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center">
      <div className="text-white/40 text-sm animate-pulse">Vérification accès admin...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#060f1e] fixed top-0 left-0 bottom-0 z-40 flex flex-col">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-white font-black text-sm">Solivo Admin</span>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-emerald-500/15 text-emerald-400" : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                }`}>
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 py-4 border-t border-white/[0.06]">
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={15} />Déconnexion
          </button>
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#635bff]/60 hover:text-[#635bff] hover:bg-[#635bff]/10 transition-all">
            <ExternalLink size={11} />Stripe Dashboard
          </a>
          <Link href="/" className="mt-0.5 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-all">
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
