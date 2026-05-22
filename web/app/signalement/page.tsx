"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { AlertTriangle, MapPin, Send, Check } from "lucide-react";
import toast from "react-hot-toast";

const TYPES = [
  { value: "homeless", label: "Personne à la rue", emoji: "🏚️" },
  { value: "food", label: "Besoin alimentaire", emoji: "🍞" },
  { value: "medical", label: "Besoin médical", emoji: "🏥" },
  { value: "family", label: "Famille en difficulté", emoji: "👨‍👩‍👧" },
  { value: "urgent", label: "Urgence sociale", emoji: "🆘" },
  { value: "other", label: "Autre", emoji: "📌" },
];

export default function SignalementPage() {
  const [form, setForm] = useState({ type: "", description: "", address: "", city: "", anonymous: true });
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function geolocate() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocating(false);
      toast.success("Position détectée");
    }, () => {
      setLocating(false);
      toast.error("Impossible de détecter votre position");
    });
  }

  async function submit() {
    if (!form.type) return toast.error("Sélectionnez le type de besoin");
    if (!coords) return toast.error("Veuillez géolocaliser le signalement");
    setLoading(true);
    try {
      await api.post("/signalements", { ...form, ...coords });
      setSent(true);
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <div className="pt-24 pb-16 min-h-screen bg-orange-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-3">Signalement envoyé</h2>
        <p className="text-gray-600 mb-6">Les équipes de maraude dans votre zone ont été alertées. Merci de votre vigilance.</p>
        <button onClick={() => setSent(false)} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition">
          Nouveau signalement
        </button>
      </div>
    </div>
  );

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Signalement anonyme</h1>
          <p className="text-gray-500">Alertez discrètement pour aider rapidement. Aucune information personnelle requise.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type de besoin *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button key={t.value}
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left ${form.type === t.value ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-700 hover:border-orange-200"}`}>
                  <span>{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Localisation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localisation *</label>
            <button onClick={geolocate} disabled={locating}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-medium transition-all ${coords ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-300 text-gray-500 hover:border-orange-300 hover:text-orange-600"}`}>
              <MapPin size={18} />
              {locating ? "Détection en cours..." : coords ? `✓ Position détectée (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "Cliquez pour détecter la position"}
            </button>
            <div className="flex gap-2 mt-2">
              <input placeholder="Adresse précise (optionnel)"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <input placeholder="Ville"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Donnez des précisions pour aider les bénévoles (apparence, lieu exact, situation...)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 text-sm"
              rows={3}
            />
          </div>

          {/* Anonymat */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-50">
            <input type="checkbox" checked={form.anonymous} onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
            <div>
              <div className="font-medium text-gray-700">Signalement anonyme</div>
              <p className="text-xs text-gray-500">Votre identité ne sera jamais révélée</p>
            </div>
          </label>

          <button onClick={submit} disabled={loading}
            className="w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-2xl hover:bg-orange-600 transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            <Send size={20} />
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </button>
        </div>
      </div>
    </div>
  );
}
