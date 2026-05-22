"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getUser, logout } from "@/lib/auth";
import { Heart, Map, Users, AlertTriangle, Trophy, Menu, X, LogOut, User } from "lucide-react";

export function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string; points: number } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const links = [
    { href: "/carte", label: "Carte", icon: <Map size={16} /> },
    { href: "/maraudes", label: "Maraudes", icon: <Users size={16} /> },
    { href: "/signalement", label: "Signaler", icon: <AlertTriangle size={16} /> },
    { href: "/don", label: "Faire un don", icon: <Heart size={16} /> },
    { href: "/transparence", label: "Transparence", icon: <Trophy size={16} /> },
    { href: "/alertes", label: "Alertes", icon: <AlertTriangle size={16} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-emerald-600">
          <span className="text-2xl">🤝</span>
          <span>Solivo</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
              {l.icon}{l.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">⚡ {user.points} pts</span>
              <Link href="/profil" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition">
                <User size={14} />{user.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link href="/connexion" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition">Connexion</Link>
              <Link href="/inscription" className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition shadow-sm">
                Rejoindre
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600">
              {l.icon}{l.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2">
            {user ? (
              <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-500">
                <LogOut size={14} />Se déconnecter
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/connexion" onClick={() => setOpen(false)} className="flex-1 text-center px-3 py-2 text-sm border border-gray-200 rounded-lg">Connexion</Link>
                <Link href="/inscription" onClick={() => setOpen(false)} className="flex-1 text-center px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg">Rejoindre</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
