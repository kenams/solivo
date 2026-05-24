"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin } from "lucide-react";

export default function CreerMaraudePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", date_start: "", date_end: "",
    meeting_point: "", city: "", lat: "", lng: "", max_volunteers: "10",
  });

  if (!user) return (
    <div className="pt-24 text-center">
      <p className="text-gray-500">Vous devez être connecté pour créer une maraude.</p>
      <Link href="/connexion" className="mt-3 inline-block px-5 py-2 bg-emerald-500 text-white rounded-xl">Se connecter</Link>
    </div>
  );

  async function geolocate() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }));
      setLocating(false);
      toast.success("Position détectée");
    }, () => { setLocating(false); toast.error("Géolocalisation refusée"); });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lat || !form.lng) return toast.error("Géolocalisez le point de rendez-vous");
    setLoading(true);
    try {
      const maraude = await api.post("/maraudes", {
        ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), max_volunteers: parseInt(form.max_volunteers),
      });
      toast.success("Maraude créée !");
      router.push(`/maraudes/${maraude.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setLoading(false); }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6">
        <Link href="/maraudes" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-600 mb-6">
          <ArrowLeft size={14} />Retour
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">🚶 Créer une maraude</h1>
        <p className="text-gray-500 mb-8">Organisez une sortie solidaire et invitez des bénévoles à vous rejoindre.</p>

        <form onSubmit={submit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre de la maraude *</label>
            <input required value={form.title} onChange={set("title")} placeholder="Ex: Maraude du lundi soir — Paris 13e"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set("description")}
              placeholder="Détails : type de distribution, zone couverte, ce qu'il faut apporter..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date et heure de départ *</label>
              <input required type="datetime-local" value={form.date_start} onChange={set("date_start")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure de fin (estimée)</label>
              <input type="datetime-local" value={form.date_end} onChange={set("date_end")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Point de rendez-vous *</label>
            <input required value={form.meeting_point} onChange={set("meeting_point")} placeholder="Ex: Parvis de l'église Saint-Michel"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
              <input value={form.city} onChange={set("city")} placeholder="Paris"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bénévoles max</label>
              <input type="number" min="2" max="100" value={form.max_volunteers} onChange={set("max_volunteers")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
              />
            </div>
          </div>

          {/* Géolocalisation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Coordonnées GPS du RDV *</label>
            <button type="button" onClick={geolocate} disabled={locating}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-medium transition-all mb-2 ${form.lat ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-300 text-gray-500 hover:border-emerald-300"}`}>
              <MapPin size={16} />
              {locating ? "Détection..." : form.lat ? `✓ ${parseFloat(form.lat).toFixed(4)}, ${parseFloat(form.lng).toFixed(4)}` : "Détecter ma position actuelle"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" placeholder="Latitude (ex: 48.8566)" value={form.lat} onChange={set("lat")}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <input type="number" step="any" placeholder="Longitude (ex: 2.3522)" value={form.lng} onChange={set("lng")}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-emerald-500 text-white font-bold text-lg rounded-2xl hover:bg-emerald-600 transition shadow-lg disabled:opacity-60">
            {loading ? "Création..." : "🚀 Créer la maraude"}
          </button>
        </form>
      </div>
    </div>
  );
}
