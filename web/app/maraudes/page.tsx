"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { MapPin, Users, Calendar, ChevronRight, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Maraude {
  id: string;
  title: string;
  description: string;
  date_start: string;
  meeting_point: string;
  city: string;
  volunteers_count: number;
  max_volunteers: number;
  status: string;
  association_name: string;
  is_joined: boolean;
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
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">🚶 Maraudes</h1>
            <p className="text-gray-500 mt-1">Rejoignez une équipe près de chez vous</p>
          </div>
          {user && (
            <Link href="/maraudes/creer" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition">
              <Plus size={16} />Créer une maraude
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Rechercher par ville ou titre..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
          />
        </div>

        {/* Liste */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse h-32" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🚶</div>
            <p className="text-lg font-medium">Aucune maraude dans cette zone</p>
            <p className="text-sm mt-1">Soyez le premier à en organiser une !</p>
            <Link href="/maraudes/creer" className="mt-4 inline-block px-6 py-2 bg-emerald-500 text-white rounded-xl">
              Créer une maraude
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(m => (
              <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-emerald-200 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {m.volunteers_count >= m.max_volunteers ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">Complet</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs rounded-full font-medium">Places disponibles</span>
                      )}
                      {m.association_name && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{m.association_name}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{m.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(m.date_start).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />{m.meeting_point}{m.city ? `, ${m.city}` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />{m.volunteers_count}/{m.max_volunteers} bénévoles
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.is_joined ? (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-sm font-medium">✓ Inscrit</span>
                    ) : (
                      <button onClick={() => join(m.id)} disabled={m.volunteers_count >= m.max_volunteers}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        Rejoindre
                      </button>
                    )}
                    <Link href={`/maraudes/${m.id}`} className="p-2 text-gray-400 hover:text-emerald-600 transition">
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.volunteers_count / m.max_volunteers) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
