"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";

export default function CreerAssociationPage() {
  const user = getUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ name: "", description: "", address: "", city: "", phone: "", email: "", website: "", siret: "" });

  function geolocate() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocating(false); toast.error("Géolocalisation refusée"); }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return router.push("/connexion");
    setLoading(true);
    try {
      await api.post("/associations", { ...form, ...coords });
      toast.success("Association créée !");
      router.push(`/dashboard/association`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur";
      toast.error(msg);
    } finally { setLoading(false); }
  }

  if (!user) { router.push("/connexion"); return null; }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="text-2xl font-black text-gray-900">Créer mon association</h1>
          <p className="text-gray-500 text-sm mt-1">Rejoignez le réseau Solivo pour organiser des maraudes et recevoir des dons.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
          <input required placeholder="Nom de l'association *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
          <textarea placeholder="Description (mission, territoire...)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Ville *" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
            <input placeholder="Téléphone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
          </div>
          <input placeholder="Adresse" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
          <input type="email" placeholder="Email de l'association" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="SIRET (optionnel)" value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 text-sm" />
            <input placeholder="Site web" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 text-sm" />
          </div>
          <button type="button" onClick={geolocate} disabled={locating}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-medium transition ${coords ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-300 text-gray-500 hover:border-emerald-300"}`}>
            <MapPin size={16} />{locating ? "Détection..." : coords ? "✓ Position enregistrée" : "📍 Géolocaliser l'association (optionnel)"}
          </button>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition disabled:opacity-60 text-lg">
            {loading ? "Création..." : "🚀 Créer mon association"}
          </button>
        </form>
      </div>
    </div>
  );
}
