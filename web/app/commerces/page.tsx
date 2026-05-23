"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { MapPin, Search, Phone, Globe } from "lucide-react";

interface Commerce {
  id: string; name: string; type: string; address: string; city: string;
  phone: string; email: string; active: boolean; created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️", bakery: "🥖", supermarket: "🛒", other: "🏪",
};
const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant", bakery: "Boulangerie", supermarket: "Supermarché", other: "Commerce",
};

export default function CommercesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    api.get("/commerces").then(setCommerces).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = commerces.filter(c => {
    const q = search.toLowerCase();
    const cityMatch = !city || c.city?.toLowerCase().includes(city.toLowerCase());
    const searchMatch = !q || c.name.toLowerCase().includes(q) || c.type.includes(q);
    return cityMatch && searchMatch;
  });

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Commerces partenaires</h1>
          <p className="text-gray-500 text-lg">Ces commerçants s&apos;engagent à donner leurs invendus aux associations locales.</p>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Rechercher un commerce..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
          </div>
          <input placeholder="Ville..." value={city} onChange={e => setCity(e.target.value)}
            className="w-36 px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 animate-pulse">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏪</div>
            <p className="text-lg font-medium">Aucun commerce partenaire{city ? ` à ${city}` : ""}</p>
            <p className="text-sm mt-1 mb-5">Soyez le premier à rejoindre le réseau Solivo dans votre ville !</p>
            <Link href="/partenaires/commerce" className="inline-block px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">
              Rejoindre le réseau
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} partenaire{filtered.length > 1 ? "s" : ""}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-2xl mb-1">{TYPE_ICONS[c.type] || "🏪"}</div>
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <span className="text-xs text-gray-400">{TYPE_LABELS[c.type] || "Commerce"}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Partenaire</span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-500">
                    {c.address && (
                      <p className="flex items-start gap-1.5"><MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />{c.address}</p>
                    )}
                    {c.city && (
                      <p className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-500 shrink-0" />{c.city}</p>
                    )}
                    {c.phone && (
                      <p className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" />{c.phone}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-8 text-white">
          <div className="md:flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black mb-2">Votre commerce n&apos;est pas là ?</h2>
              <p className="text-emerald-100">Rejoignez le réseau Solivo. 1,50€ par collecte confirmée. Rien si personne ne collecte.</p>
            </div>
            <Link href="/partenaires/commerce"
              className="mt-5 md:mt-0 inline-block px-6 py-3 bg-white text-emerald-700 font-black rounded-xl hover:bg-emerald-50 transition whitespace-nowrap ml-4">
              Rejoindre — Gratuit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
