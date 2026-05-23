"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getUser, logout } from "@/lib/auth";
import { Heart, Map, Users, AlertTriangle, Trophy, Menu, X, LogOut, User, Recycle, LayoutDashboard, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string; points: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getUser());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mainLinks = [
    { href: "/carte", label: "Carte", icon: <Map size={15} /> },
    { href: "/maraudes", label: "Maraudes", icon: <Users size={15} /> },
    { href: "/invendus", label: "Invendus", icon: <Recycle size={15} /> },
    { href: "/don", label: "Faire un don", icon: <Heart size={15} /> },
    { href: "/transparence", label: "Transparence", icon: <Trophy size={15} /> },
    { href: "/signalement", label: "Signaler", icon: <AlertTriangle size={15} /> },
  ];

  const dashboardLink = user?.role === "commerce"
    ? { href: "/dashboard/commerce", label: "Mon espace" }
    : user?.role === "association"
    ? { href: "/dashboard/association", label: "Mon asso" }
    : null;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060f1e]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/40 transition-shadow">
            <span className="text-sm">🤝</span>
          </div>
          <span className="font-black text-xl text-white tracking-tight">Solivo</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {mainLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.07] transition-all duration-200">
              <span className="text-emerald-400">{l.icon}</span>{l.label}
            </Link>
          ))}
          {dashboardLink && (
            <Link href={dashboardLink.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/15 transition-all duration-200 ml-1">
              <LayoutDashboard size={15} />{dashboardLink.label}
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                ⚡ {user.points} pts
              </div>
              <Link href="/profil"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-white text-sm font-medium hover:bg-white/10 transition-all">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xs font-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={logout}
                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Link href="/connexion" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link href="/inscription"
                className="btn-primary px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200">
                Rejoindre
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2 text-white/70 hover:text-white transition-colors" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#060f1e]/98 backdrop-blur-xl border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {mainLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.07] transition-all">
                  <span className="text-emerald-400">{l.icon}</span>{l.label}
                </Link>
              ))}
              {dashboardLink && (
                <Link href={dashboardLink.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-400 bg-emerald-400/10">
                  <LayoutDashboard size={15} />{dashboardLink.label}
                </Link>
              )}
              <div className="border-t border-white/[0.06] pt-3 mt-2">
                {user ? (
                  <div className="flex items-center justify-between px-4 py-2">
                    <Link href="/profil" onClick={() => setOpen(false)} className="text-sm text-white/70 flex items-center gap-2">
                      <User size={14} className="text-emerald-400" />{user.name}
                    </Link>
                    <button onClick={logout} className="flex items-center gap-1 text-sm text-red-400">
                      <LogOut size={14} />Sortir
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 px-2">
                    <Link href="/connexion" onClick={() => setOpen(false)}
                      className="flex-1 text-center px-4 py-2.5 text-sm border border-white/10 rounded-xl text-white/70">
                      Connexion
                    </Link>
                    <Link href="/inscription" onClick={() => setOpen(false)}
                      className="flex-1 text-center px-4 py-2.5 text-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl">
                      Rejoindre
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
