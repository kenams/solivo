"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Users, Heart, Map, Trophy, Zap, RefreshCw } from "lucide-react";

interface Alerte { id: string; titre: string; niveau: string; city: string; }
interface Maraude { id: string; title: string; date_start: string; city: string; volunteers_count: number; max_volunteers: number; is_joined: boolean; }
interface Stats { donations_total_cents: number; donations_count: number; }

const NIVEAU_COLOR: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
const NIVEAU_LABEL: Record<string, string> = { critical: "🔴 Critique", warning: "🟠 Alerte", info: "🔵 Info" };

export function HomeDashboard() {
  const { user } = useAuth();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [maraudes, setMaraudes] = useState<Maraude[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/terrain/alertes?limit=3").catch(() => []),
      api.get("/maraudes?limit=3&status=upcoming").catch(() => ({ maraudes: [] })),
      api.get("/donations/stats").catch(() => null),
    ]).then(([a, m, s]) => {
      setAlertes(Array.isArray(a) ? a : []);
      setMaraudes((m?.maraudes || []).slice(0, 3));
      setStats(s);
    }).finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <section className="bg-[#060f1e] pt-16 pb-0">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-white">
              Bonjour, {user.name.split(" ")[0]} 👋
            </h2>
            <p className="text-white/50 mt-1">Ensemble, faisons la différence.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <Zap size={15} className="text-emerald-400" />
              <span className="text-emerald-400 font-black">{user.points} points</span>
            </div>
            <Link href="/profil" className="px-4 py-2 glass border border-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-all">
              Mon profil
            </Link>
          </div>
        </motion.div>

        {/* Stats bar */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Collectés", value: stats ? `${(stats.donations_total_cents / 100).toFixed(0)}€` : "0€", icon: "💚" },
              { label: "Maraudes dispo", value: `${maraudes.length}+`, icon: "🚶" },
              { label: "Alertes actives", value: String(alertes.length), icon: "🚨" },
            ].map((s, i) => (
              <div key={i} className="glass border border-white/[0.08] rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-white/40 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { href: "/signalement", icon: <AlertTriangle size={20} />, label: "Signaler", color: "from-orange-500/20 to-amber-500/10 border-orange-500/20 text-orange-300" },
            { href: "/don", icon: <Heart size={20} />, label: "Faire un don", color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-300" },
            { href: "/carte", icon: <Map size={20} />, label: "Carte", color: "from-blue-500/20 to-cyan-500/10 border-blue-500/20 text-blue-300" },
            { href: "/leaderboard", icon: <Trophy size={20} />, label: "Classement", color: "from-purple-500/20 to-pink-500/10 border-purple-500/20 text-purple-300" },
          ].map((a, i) => (
            <Link key={i} href={a.href}
              className={`group flex flex-col items-center gap-2 p-5 rounded-2xl bg-gradient-to-br border transition-all hover:-translate-y-0.5 ${a.color}`}>
              <div className="opacity-80 group-hover:opacity-100 transition-opacity">{a.icon}</div>
              <span className="text-sm font-bold text-white">{a.label}</span>
            </Link>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 pb-10">
          {/* Alertes */}
          {alertes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />Alertes en cours
              </h3>
              <div className="space-y-2">
                {alertes.map(a => (
                  <div key={a.id} className="glass border border-white/[0.06] rounded-xl p-4" style={{ borderLeftWidth: 3, borderLeftColor: NIVEAU_COLOR[a.niveau] || "#6b7280" }}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold" style={{ color: NIVEAU_COLOR[a.niveau] }}>{NIVEAU_LABEL[a.niveau] || a.niveau}</span>
                      {a.city && <span className="text-white/30 text-xs">{a.city}</span>}
                    </div>
                    <p className="text-white text-sm font-semibold">{a.titre}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Maraudes */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Users size={14} className="text-emerald-400" />Prochaines maraudes
              </h3>
              <Link href="/maraudes" className="text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors flex items-center gap-1">
                Voir tout <RefreshCw size={10} />
              </Link>
            </div>
            {maraudes.length === 0 ? (
              <p className="text-white/30 text-sm">Aucune maraude à venir.</p>
            ) : (
              <div className="space-y-2">
                {maraudes.map(m => (
                  <Link key={m.id} href={`/maraudes/${m.id}`}
                    className="block glass border border-white/[0.06] rounded-xl p-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{m.title}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          📅 {new Date(m.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {m.city ? ` · ${m.city}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-emerald-400 font-black text-sm">{m.volunteers_count}/{m.max_volunteers}</p>
                        <p className="text-white/30 text-xs">bénévoles</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
