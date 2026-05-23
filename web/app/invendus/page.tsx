"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";
import { MapPin, Clock, Package, Search, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Invenu {
  id: string; title: string; description: string; quantity: number; unit: string;
  available_until: string | null; status: string; created_at: string;
  commerce_id: string; commerce_name: string; commerce_type: string;
  lat: number; lng: number; city: string; address: string; commerce_phone: string;
}

const TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️", bakery: "🥖", supermarket: "🛒", other: "🏪",
};

function timeLeft(until: string | null): { text: string; urgent: boolean } {
  if (!until) return { text: "Sans délai", urgent: false };
  const diff = new Date(until).getTime() - Date.now();
  if (diff < 0) return { text: "Expiré", urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 2) return { text: h > 0 ? `${h}h${m}m` : `${m}min`, urgent: true };
  if (h > 24) return { text: `${Math.floor(h / 24)}j`, urgent: false };
  return { text: `${h}h${m > 0 ? m + "m" : ""}`, urgent: false };
}

export default function InvendusPage() {
  const user = getUser();
  const [invendus, setInvendus] = useState<Invenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [reserving, setReserving] = useState<string | null>(null);
  const [assoId, setAssoId] = useState("");
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => { loadInvendus(); }, []);

  async function loadInvendus() {
    try {
      const data = await api.get("/marketplace/invendus");
      setInvendus(data);
    } catch { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }

  async function reserve(invenuId: string) {
    if (!user) return toast.error("Connectez-vous pour réserver");
    if (!assoId) return toast.error("Renseignez l'ID de votre association");
    setReserving(invenuId);
    try {
      await api.post("/marketplace/collecte-requests", { invenu_id: invenuId, association_id: assoId, collector_name: user.name });
      toast.success("Demande envoyée ! Le commerce va confirmer.");
      setShowModal(null);
      loadInvendus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      if (msg.includes("already_requested")) toast.error("Demande déjà en cours pour cet invenu");
      else toast.error("Erreur lors de la demande");
    } finally { setReserving(null); }
  }

  const filtered = invendus.filter(i => {
    const q = search.toLowerCase();
    const cityMatch = !city || i.city?.toLowerCase().includes(city.toLowerCase());
    const searchMatch = !q || i.title.toLowerCase().includes(q) || i.commerce_name.toLowerCase().includes(q);
    return cityMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      <div className="relative bg-[#060f1e] py-16 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            <Sparkles size={13} />Anti-gaspillage alimentaire
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Invendus disponibles</h1>
          <p className="text-white/50 text-lg">Des surplus de commerçants locaux — à récupérer avant qu&apos;ils ne soient perdus.</p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Filtres */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Rechercher un invenu..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-gray-800 shadow-sm transition-all" />
          </div>
          <input placeholder="Ville..." value={city} onChange={e => setCity(e.target.value)}
            className="w-36 px-4 py-3.5 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-gray-800 shadow-sm" />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍞</div>
            <p className="text-xl font-black text-gray-800 mb-2">Aucun invenu disponible</p>
            <p className="text-gray-500 mb-6">Revenez plus tard ou invitez un commerce à rejoindre le réseau.</p>
            <Link href="/partenaires/commerce"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all">
              Inviter un commerce <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5 font-medium">{filtered.length} invenu{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((inv, i) => {
                const tl = timeLeft(inv.available_until);
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{TYPE_ICONS[inv.commerce_type] || "🏪"}</span>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{inv.commerce_name}</span>
                          </div>
                          <h3 className="font-black text-gray-900 text-lg leading-tight">{inv.title}</h3>
                        </div>
                        <span className={`ml-3 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                          tl.urgent ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          <Clock size={11} />{tl.text}
                        </span>
                      </div>

                      {inv.description && (
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{inv.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Package size={13} className="text-emerald-500" />
                            <span className="font-semibold text-gray-700">{inv.quantity} {inv.unit}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-gray-400" />{inv.city}
                          </span>
                        </div>
                        <button onClick={() => setShowModal(inv.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200">
                          Réserver <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* CTA commerce */}
        <div className="mt-14 relative bg-[#060f1e] rounded-3xl p-10 overflow-hidden text-center">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-emerald-500/10 rounded-full blur-[60px]" />
          <div className="relative">
            <div className="text-4xl mb-4">🏪</div>
            <h2 className="text-3xl font-black text-white mb-2">Vous êtes un commerce ?</h2>
            <p className="text-white/50 mb-6">Publiez vos invendus et contribuez à lutter contre le gaspillage. 1,50€/collecte confirmée.</p>
            <Link href="/partenaires/commerce"
              className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 hover:-translate-y-1 transition-all">
              Devenir partenaire — Gratuit <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal réservation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-3xl mb-3 text-center">🤝</div>
            <h3 className="font-black text-gray-900 text-xl mb-1 text-center">Demande de collecte</h3>
            <p className="text-sm text-gray-500 mb-5 text-center">Renseignez l&apos;ID de votre association.</p>
            <input
              placeholder="ID association (ex: abc123-...)"
              value={assoId}
              onChange={e => setAssoId(e.target.value)}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-gray-800 mb-4 bg-gray-50"
            />
            <div className="flex gap-3">
              <button onClick={() => reserve(showModal)} disabled={!!reserving || !assoId}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black rounded-2xl shadow-md disabled:opacity-60 hover:-translate-y-0.5 transition-all">
                {reserving ? "Envoi..." : "Envoyer la demande"}
              </button>
              <button onClick={() => setShowModal(null)}
                className="px-4 py-3.5 border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
