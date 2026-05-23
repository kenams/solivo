"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { MapPin, Users, Calendar, ChevronRight, Plus, Search, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Maraude {
  id: string; title: string; description: string; date_start: string;
  meeting_point: string; city: string; volunteers_count: number;
  max_volunteers: number; status: string; association_name: string; is_joined: boolean;
}

export default function MaraudesPage() {
  const [maraudes, setMaraudes] = useState<Maraude[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const user = getUser();

  useEffect(() => {
    api.get("/maraudes?limit=50").then(d => setMaraudes(d.maraudes)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = maraudes.filter(m =>
    !filter || m.city?.toLowerCase().includes(filter.toLowerCase()) || m.title?.toLowerCase().includes(filter.toLowerCase())
  );

  async function join(id: string) {
    if (!user) return toast.error("Connectez-vous pour rejoindre une maraude");
    try {
      await api.post(`/maraudes/${id}/join`, {});
      toast.success("Inscription confirmée ! 🎉");
      setMaraudes(prev => prev.map(m => m.id === id ? { ...m, is_joined: true, volunteers_count: m.volunteers_count + 1 } : m));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      <div className="relative bg-[#060f1e] py-16 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute bottom-0 left-1/3 w-72 h-48 bg-blue-500/10 rounded-full blur-[80px]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-5xl mx-auto px-6 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
              <Sparkles size={13} />Bénévolat de terrain
            </div>
            <h1 className="text-5xl font-black text-white mb-3">Maraudes</h1>
            <p className="text-white/50 text-lg">Rejoignez une équipe près de chez vous et agissez concrètement.</p>
          </div>
          {user && (
            <Link href="/maraudes/creer"
              className="btn-primary flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all whitespace-nowrap mt-auto">
              <Plus size={16} />Créer une maraude
            </Link>
          )}
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Search */}
        <div className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ville ou titre..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-gray-800 shadow-sm transition-all text-base"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-36 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚶</div>
            <p className="text-xl font-black text-gray-800 mb-2">Aucune maraude dans cette zone</p>
            <p className="text-gray-500 mb-6">Soyez le premier à en organiser une !</p>
            <Link href="/maraudes/creer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all">
              Créer une maraude <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m, i) => {
              const full = m.volunteers_count >= m.max_volunteers;
              const pct = Math.min(100, (m.volunteers_count / m.max_volunteers) * 100);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {full ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-full font-bold border border-red-100">Complet</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full font-bold border border-emerald-100">Places dispo</span>
                          )}
                          {m.association_name && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{m.association_name}</span>
                          )}
                          {m.status === "ongoing" && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-bold border border-blue-100 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />En cours
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-gray-900 text-xl mb-3 leading-tight">{m.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-emerald-500" />
                            {new Date(m.date_start).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />{m.meeting_point}{m.city ? `, ${m.city}` : ""}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-blue-400" />{m.volunteers_count}/{m.max_volunteers} bénévoles
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {m.is_joined ? (
                          <span className="px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100">✓ Inscrit</span>
                        ) : (
                          <button onClick={() => join(m.id)} disabled={full}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200">
                            Rejoindre
                          </button>
                        )}
                        <Link href={`/maraudes/${m.id}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors">
                          Détails <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-5">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${full ? "bg-red-400" : "bg-gradient-to-r from-emerald-400 to-green-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
