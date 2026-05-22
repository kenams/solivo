"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import toast from "react-hot-toast";
import { AlertTriangle, Plus, X } from "lucide-react";

interface Alerte {
  id: string; type: string; titre: string; description: string;
  city: string; niveau: string; active: boolean; created_at: string;
}

const TYPES = [
  { value: "grand_froid", label: "Grand froid", emoji: "🥶", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "canicule", label: "Canicule", emoji: "🌡️", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "urgence", label: "Urgence", emoji: "🚨", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "collecte", label: "Collecte urgente", emoji: "📦", color: "bg-purple-100 text-purple-800 border-purple-200" },
];

const NIVEAUX = { info: "bg-blue-500", warning: "bg-orange-500", critical: "bg-red-500 animate-pulse" };

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "grand_froid", titre: "", description: "", city: "", niveau: "warning" });
  const [loading, setLoading] = useState(false);
  const user = getUser();

  useEffect(() => {
    api.get("/terrain/alertes").then(setAlertes).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const a = await api.post("/terrain/alertes", form);
      setAlertes(prev => [a, ...prev]);
      setShowForm(false);
      toast.success("Alerte publiée");
    } catch { toast.error("Erreur"); } finally { setLoading(false); }
  }

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">🚨 Alertes actives</h1>
            <p className="text-gray-500 mt-1">Grand froid, canicule, urgences sociales — restez informés</p>
          </div>
          {user && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition">
              <Plus size={16} />Créer une alerte
            </button>
          )}
        </div>

        {/* Formulaire */}
        {showForm && (
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">Nouvelle alerte</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {TYPES.map(t => (
                <button type="button" key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`p-3 rounded-xl border text-left text-sm font-medium transition ${form.type === t.value ? t.color : "border-gray-200 text-gray-600"}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <input required value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Titre de l'alerte *"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description, consignes, où chercher..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ville (optionnel)"
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <select value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                  <option value="info">ℹ️ Information</option>
                  <option value="warning">⚠️ Avertissement</option>
                  <option value="critical">🚨 Critique</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-60">
                {loading ? "..." : "Publier l'alerte"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition">
                <X size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Liste alertes */}
        {alertes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-medium">Aucune alerte active</p>
            <p className="text-sm">Tout va bien dans votre zone !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertes.map(a => {
              const typeInfo = TYPES.find(t => t.value === a.type);
              return (
                <div key={a.id} className={`p-5 rounded-2xl border ${typeInfo?.color || "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${NIVEAUX[a.niveau as keyof typeof NIVEAUX] || "bg-gray-400"}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{typeInfo?.emoji}</span>
                          <h3 className="font-bold text-gray-900">{a.titre}</h3>
                        </div>
                        {a.city && <p className="text-xs font-medium mb-1">📍 {a.city}</p>}
                        {a.description && <p className="text-sm opacity-80">{a.description}</p>}
                        <p className="text-xs opacity-60 mt-2">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
