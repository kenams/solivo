"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MapPin, Calendar, Users, Clock, ArrowLeft, CheckCircle, AlertTriangle, MessageSquare, BarChart2 } from "lucide-react";

interface Maraude {
  id: string; title: string; description: string;
  date_start: string; date_end: string;
  meeting_point: string; city: string; lat: number; lng: number;
  volunteers_count: number; max_volunteers: number;
  status: string; association_name: string;
  organizer_name: string; is_joined: boolean;
  participants: { id: string; name: string; avatar_url: string; status: string }[];
}

interface Rapport {
  personnes_rencontrees: number; repas_distribues: number;
  kits_distribues: number; orientations: number;
  bilan_qualitatif: string; duree_heures: number;
  redige_par_name: string;
}

const PHASES = [
  { key: "prep", label: "Préparation", emoji: "👨‍🍳", desc: "Cuisine collective, préparation des kits" },
  { key: "depart", label: "Départ", emoji: "🚶", desc: "Briefing d'équipe, répartition des rôles" },
  { key: "terrain", label: "Terrain", emoji: "🗺️", desc: "Distribution, rencontres, signalements" },
  { key: "retour", label: "Retour", emoji: "📋", desc: "Bilan, rapport, transmissions" },
];

export default function MaraudeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [maraude, setMaraude] = useState<Maraude | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [messages, setMessages] = useState<{ id: string; sender_name: string; content: string; type: string; created_at: string }[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const user = getUser();

  useEffect(() => {
    Promise.all([
      api.get(`/maraudes/${id}`).then(setMaraude),
      api.get(`/terrain/maraudes/${id}/rapport`).then(setRapport).catch(() => {}),
    ]).finally(() => setLoading(false));

    if (user) {
      api.get(`/terrain/maraudes/${id}/messages`).then(setMessages).catch(() => {});
    }
  }, [id]);

  async function join() {
    if (!user) { router.push("/connexion"); return; }
    setJoining(true);
    try {
      await api.post(`/maraudes/${id}/join`, {});
      toast.success("Inscription confirmée ! 🎉");
      setMaraude(m => m ? { ...m, is_joined: true, volunteers_count: m.volunteers_count + 1 } : m);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally { setJoining(false); }
  }

  async function sendMessage() {
    if (!msgInput.trim()) return;
    try {
      const msg = await api.post(`/terrain/maraudes/${id}/messages`, { content: msgInput });
      setMessages(prev => [...prev, { ...msg, sender_name: user?.name || "Moi" }]);
      setMsgInput("");
    } catch { toast.error("Erreur envoi message"); }
  }

  if (loading) return <div className="pt-24 text-center text-gray-400">Chargement...</div>;
  if (!maraude) return <div className="pt-24 text-center text-gray-400">Maraude introuvable</div>;

  const isUpcoming = maraude.status === "upcoming";
  const isOngoing = maraude.status === "ongoing";
  const isCompleted = maraude.status === "completed";
  const full = maraude.volunteers_count >= maraude.max_volunteers;
  const pct = Math.min(100, (maraude.volunteers_count / maraude.max_volunteers) * 100);
  const dateStr = new Date(maraude.date_start).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumb */}
        <Link href="/maraudes" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-600 transition mb-6">
          <ArrowLeft size={14} />Retour aux maraudes
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isCompleted ? "bg-gray-100 text-gray-600" :
                      isOngoing ? "bg-blue-100 text-blue-700 animate-pulse" :
                      full ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {isCompleted ? "✓ Terminée" : isOngoing ? "🔴 En cours" : full ? "Complet" : "✓ Places disponibles"}
                    </span>
                    {maraude.association_name && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{maraude.association_name}</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">{maraude.title}</h1>
                  {maraude.organizer_name && <p className="text-sm text-gray-500 mt-1">Organisé par {maraude.organizer_name}</p>}
                </div>
              </div>

              {maraude.description && <p className="text-gray-600 leading-relaxed mb-4">{maraude.description}</p>}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={15} className="text-emerald-500" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={15} className="text-emerald-500" />
                  <span>{maraude.meeting_point}{maraude.city ? `, ${maraude.city}` : ""}</span>
                  <a href={`https://www.openstreetmap.org/?mlat=${maraude.lat}&mlon=${maraude.lng}&zoom=16`} target="_blank" rel="noopener"
                    className="text-emerald-500 text-xs hover:underline">Voir sur la carte →</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={15} className="text-emerald-500" />
                  <span>{maraude.volunteers_count}/{maraude.max_volunteers} bénévoles inscrits</span>
                </div>
              </div>

              {/* Barre progression */}
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {/* Phases de maraude */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-4">🔄 Phases de la maraude</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PHASES.map((phase, i) => (
                  <div key={phase.key} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-2xl mb-1">{phase.emoji}</div>
                    <div className="text-xs font-bold text-gray-700">{phase.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{phase.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rapport post-maraude */}
            {isCompleted && rapport && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <h2 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                  <BarChart2 size={18} />Rapport de maraude
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Personnes rencontrées", value: rapport.personnes_rencontrees, emoji: "👥" },
                    { label: "Repas distribués", value: rapport.repas_distribues, emoji: "🍽️" },
                    { label: "Kits distribués", value: rapport.kits_distribues, emoji: "📦" },
                    { label: "Orientations", value: rapport.orientations, emoji: "🏥" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-3 text-center">
                      <div className="text-xl">{s.emoji}</div>
                      <div className="text-xl font-black text-emerald-700">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                {rapport.bilan_qualitatif && (
                  <p className="text-sm text-emerald-900 italic">"{rapport.bilan_qualitatif}"</p>
                )}
                {rapport.redige_par_name && (
                  <p className="text-xs text-emerald-600 mt-2">Rédigé par {rapport.redige_par_name}</p>
                )}
              </div>
            )}

            {/* Messagerie équipe */}
            {maraude.is_joined && (isUpcoming || isOngoing) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-500" />Messagerie d'équipe
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun message. Soyez le premier à écrire !</p>
                  ) : messages.map(m => (
                    <div key={m.id} className={`flex gap-2 ${m.type === "alert" ? "bg-red-50 p-2 rounded-lg" : ""}`}>
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
                        {m.sender_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-700">{m.sender_name}</span>
                        {m.type === "alert" && <span className="ml-1 text-xs text-red-500">🚨 ALERTE</span>}
                        <p className="text-sm text-gray-600">{m.content}</p>
                        <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Message à l'équipe..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition">
                    Envoyer
                  </button>
                </div>
              </div>
            )}

            {/* Participants */}
            {maraude.participants?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-4">👥 Bénévoles inscrits ({maraude.participants.length})</h2>
                <div className="flex flex-wrap gap-3">
                  {maraude.participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-600">
                        {p.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA inscription */}
            {isUpcoming && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
                {maraude.is_joined ? (
                  <div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-3">
                      <CheckCircle size={18} />Vous êtes inscrit
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Retrouvez l'équipe au point de rendez-vous. Pensez à confirmer votre présence la veille.</p>
                    <a href={`https://www.openstreetmap.org/?mlat=${maraude.lat}&mlon=${maraude.lng}&zoom=16`} target="_blank" rel="noopener"
                      className="w-full block text-center px-4 py-2 border border-emerald-300 text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-50 transition">
                      📍 Voir le point de RDV
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">Rejoignez cette maraude et faites partie de l'équipe.</p>
                    <button onClick={join} disabled={joining || full}
                      className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition disabled:opacity-50 mb-2">
                      {joining ? "..." : full ? "Complet" : "Rejoindre la maraude"}
                    </button>
                    {!user && <p className="text-xs text-gray-400 text-center">Connexion requise</p>}
                  </div>
                )}
              </div>
            )}

            {/* Alertes météo / urgence */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1">
                <AlertTriangle size={14} />Alertes actives
              </h3>
              <p className="text-xs text-blue-600">Consultez les alertes grand froid et urgences sur la carte avant de partir.</p>
              <Link href="/carte" className="mt-2 inline-block text-xs text-blue-600 font-medium hover:underline">
                Voir la carte →
              </Link>
            </div>

            {/* Conseils terrain */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">💡 Conseils terrain</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex gap-2"><span>👕</span>Habillez-vous chaudement et confortablement</li>
                <li className="flex gap-2"><span>📱</span>Gardez votre téléphone chargé</li>
                <li className="flex gap-2"><span>👥</span>Ne partez jamais seul, restez en binôme</li>
                <li className="flex gap-2"><span>🚨</span>En urgence médicale : appelez le 15</li>
                <li className="flex gap-2"><span>📝</span>Notez vos observations pour le rapport</li>
                <li className="flex gap-2"><span>❤️</span>L'écoute prime sur la distribution</li>
              </ul>
            </div>

            {/* Kit maraude */}
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-3 text-sm">🎒 Kit maraude recommandé</h3>
              <ul className="space-y-1 text-xs text-orange-700">
                <li>🍞 Nourriture (sandwichs, fruits)</li>
                <li>☕ Boissons chaudes (thermos)</li>
                <li>🧤 Gants, bonnets, couvertures</li>
                <li>🧼 Kits d'hygiène</li>
                <li>💊 Premiers secours de base</li>
                <li>📄 Liste des centres d'hébergement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
