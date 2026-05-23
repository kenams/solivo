"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";
import { MapPin, Clock, Package, Leaf, Search } from "lucide-react";

interface Invenu {
  id: string; title: string; description: string; quantity: number; unit: string;
  available_until: string | null; status: string; created_at: string;
  commerce_id: string; commerce_name: string; commerce_type: string;
  lat: number; lng: number; city: string; address: string; commerce_phone: string;
}

const TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️", bakery: "🥖", supermarket: "🛒", other: "🏪",
};

function timeLeft(until: string | null): string {
  if (!until) return "Sans délai";
  const diff = new Date(until).getTime() - Date.now();
  if (diff < 0) return "Expiré";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}j`;
  if (h > 0) return `${h}h${m > 0 ? m + "m" : ""}`;
  return `${m}min`;
}

export default function InvendusPage() {
  const user = getUser();
  const [invendus, setInvendus] = useState<Invenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [reserving, setReserving] = useState<string | null>(null);
  const [assoId, setAssoId] = useState("");
  const [showAssoModal, setShowAssoModal] = useState<string | null>(null);

  useEffect(() => {
    loadInvendus();
  }, []);

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
      await api.post("/marketplace/collecte-requests", {
        invenu_id: invenuId,
        association_id: assoId,
        collector_name: user.name,
      });
      toast.success("Demande de collecte envoyée ! Le commerce va confirmer.");
      setShowAssoModal(null);
      loadInvendus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      if (msg.includes("already_requested")) toast.error("Vous avez déjà une demande pour cet invenu");
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
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">♻️</div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Invendus disponibles</h1>
          <p className="text-gray-500 text-lg">Des surplus alimentaires de commerçants locaux — à récupérer avant qu&apos;ils ne soient perdus.</p>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
          </div>
          <input placeholder="Ville..." value={city} onChange={e => setCity(e.target.value)}
            className="w-36 px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 animate-pulse">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🍞</div>
            <p className="text-lg font-medium">Aucun invenu disponible</p>
            <p className="text-sm mt-1">Revenez plus tard ou élargissez votre recherche</p>
            <Link href="/partenaires/commerce" className="mt-4 inline-block px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition text-sm">
              Inviter un commerce
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} invenu{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{inv.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        {TYPE_ICONS[inv.commerce_type]} {inv.commerce_name}
                      </p>
                    </div>
                    <span className="ml-3 flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full whitespace-nowrap">
                      <Clock size={11} />{timeLeft(inv.available_until)}
                    </span>
                  </div>

                  {inv.description && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{inv.description}</p>}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Package size={13} className="text-emerald-500" />{inv.quantity} {inv.unit}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{inv.city}</span>
                    </div>
                    <button onClick={() => setShowAssoModal(inv.id)}
                      className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition">
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal réservation */}
        {showAssoModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssoModal(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-black text-gray-900 mb-2">Demande de collecte</h3>
              <p className="text-sm text-gray-500 mb-4">Renseignez l&apos;ID de votre association pour envoyer la demande au commerce.</p>
              <input placeholder="ID association (ex: abc123-...)" value={assoId} onChange={e => setAssoId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 mb-4" />
              <div className="flex gap-3">
                <button onClick={() => reserve(showAssoModal)} disabled={!!reserving || !assoId}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition disabled:opacity-60">
                  {reserving ? "Envoi..." : "Envoyer la demande"}
                </button>
                <button onClick={() => setShowAssoModal(null)} className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600">Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* CTA commerce */}
        <div className="mt-12 bg-emerald-600 rounded-2xl p-8 text-white text-center">
          <div className="text-3xl mb-3">🏪</div>
          <h2 className="text-2xl font-black mb-2">Vous êtes un commerce ?</h2>
          <p className="text-emerald-100 mb-5">Publiez vos invendus et contribuez à lutter contre le gaspillage alimentaire.</p>
          <Link href="/partenaires/commerce" className="inline-block px-6 py-3 bg-white text-emerald-700 font-black rounded-xl hover:bg-emerald-50 transition">
            Devenir partenaire — Gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}
