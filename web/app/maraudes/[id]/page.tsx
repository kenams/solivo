"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft, Users, Calendar, MapPin, Send, AlertTriangle,
  CheckSquare, FileText, Megaphone, Loader2, BarChart2,
  CheckCircle, MessageSquare
} from "lucide-react";

interface Maraude {
  id: string; title: string; description: string;
  date_start: string; date_end: string;
  meeting_point: string; city: string; lat: number; lng: number;
  volunteers_count: number; max_volunteers: number;
  status: string; association_name: string;
  organizer_name: string; is_joined: boolean;
  participants?: { id: string; name: string }[];
}

interface Rapport {
  personnes_rencontrees: number; repas_distribues: number;
  kits_distribues: number; orientations: number;
  bilan_qualitatif: string; redige_par_name: string;
}

interface Message {
  id: string; sender_name: string; content: string; type: string; created_at: string;
}

const PHASES = [
  { key: "prep",    emoji: "👨‍🍳", label: "Préparation" },
  { key: "depart",  emoji: "🚀",  label: "Départ" },
  { key: "terrain", emoji: "🗺️", label: "Terrain" },
  { key: "retour",  emoji: "📋",  label: "Bilan" },
];

export default function MaraudeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [maraude, setMaraude] = useState<Maraude | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [phase, setPhase] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [rapportForm, setRapportForm] = useState({ personnes: "", repas: "", kits: "", orientations: "", bilan: "" });
  const [submittingRapport, setSubmittingRapport] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/maraudes/${id}`).then((d: Maraude | { maraude: Maraude }) => setMaraude("maraude" in d ? d.maraude : d)),
      api.get(`/terrain/maraudes/${id}/rapport`).then(setRapport).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!maraude?.is_joined) return;
    api.get(`/terrain/maraudes/${id}/messages`).then(setMessages).catch(() => {});
    const interval = setInterval(() => {
      api.get(`/terrain/maraudes/${id}/messages`).then(setMessages).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [id, maraude?.is_joined]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function join() {
    if (!user) { router.push("/connexion"); return; }
    setJoining(true);
    try {
      await api.post(`/maraudes/${id}/join`, {});
      toast.success("Inscription confirmée ! 🎉");
      setMaraude(m => m ? { ...m, is_joined: true, volunteers_count: m.volunteers_count + 1 } : m);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setJoining(false); }
  }

  async function sendMsg() {
    if (!msgInput.trim()) return;
    setSendingMsg(true);
    try {
      const msg = await api.post(`/terrain/maraudes/${id}/messages`, { content: msgInput, type: "text" });
      setMessages(prev => [...prev, msg]);
      setMsgInput("");
    } catch { toast.error("Message non envoyé"); }
    finally { setSendingMsg(false); }
  }

  async function sendAlert() {
    const content = prompt("🚨 Décrivez l'urgence :");
    if (!content?.trim()) return;
    try {
      const msg = await api.post(`/terrain/maraudes/${id}/messages`, { content: `🚨 ALERTE: ${content}`, type: "alert" });
      setMessages(prev => [...prev, msg]);
      toast.success("Alerte envoyée à l'équipe !");
    } catch { toast.error("Erreur"); }
  }

  async function submitRapport() {
    setSubmittingRapport(true);
    try {
      await api.post(`/terrain/maraudes/${id}/rapport`, {
        personnes_rencontrees: parseInt(rapportForm.personnes) || 0,
        repas_distribues: parseInt(rapportForm.repas) || 0,
        kits_distribues: parseInt(rapportForm.kits) || 0,
        orientations: parseInt(rapportForm.orientations) || 0,
        bilan_qualitatif: rapportForm.bilan,
        duree_heures: 0,
      });
      toast.success("Rapport soumis ! Merci pour votre engagement 🙏");
    } catch { toast.error("Erreur lors de l'envoi"); }
    finally { setSubmittingRapport(false); }
  }

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="text-emerald-500 animate-spin" size={40} />
    </div>
  );
  if (!maraude) return null;

  const isUpcoming = maraude.status === "upcoming";
  const isOngoing = maraude.status === "ongoing";
  const isCompleted = maraude.status === "completed";
  const full = maraude.volunteers_count >= maraude.max_volunteers;
  const pct = Math.min(100, (maraude.volunteers_count / maraude.max_volunteers) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      <div className="relative bg-[#060f1e] py-12 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-5xl mx-auto px-6">
          <Link href="/maraudes" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} />Retour aux maraudes
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isCompleted ? (
                  <span className="px-3 py-1 bg-gray-500/20 border border-gray-500/30 text-gray-300 text-xs rounded-full font-bold">✓ Terminée</span>
                ) : isOngoing ? (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />En cours
                  </span>
                ) : full ? (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-full font-bold">Complet</span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-full font-bold">Places dispo</span>
                )}
                {maraude.is_joined && (
                  <span className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs rounded-full font-bold flex items-center gap-1">
                    <CheckCircle size={11} />Inscrit
                  </span>
                )}
                {maraude.association_name && (
                  <span className="px-3 py-1 glass border border-white/10 text-white/60 text-xs rounded-full">{maraude.association_name}</span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4">{maraude.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-400" />
                  {new Date(maraude.date_start).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                {maraude.meeting_point && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-white/30" />{maraude.meeting_point}{maraude.city ? `, ${maraude.city}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-blue-400" />{maraude.volunteers_count}/{maraude.max_volunteers} bénévoles
                </span>
              </div>
            </div>
            {!maraude.is_joined && isUpcoming && (
              <button onClick={join} disabled={full || joining}
                className="btn-primary px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none transition-all flex items-center gap-2 self-end">
                {joining ? <Loader2 size={16} className="animate-spin" /> : null}
                {joining ? "Inscription..." : full ? "Complet" : !user ? "Se connecter pour rejoindre" : "Rejoindre"}
              </button>
            )}
          </div>
          <div className="mt-5 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            {maraude.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-bold text-gray-800 mb-2">À propos</h2>
                <p className="text-gray-600 leading-relaxed">{maraude.description}</p>
              </div>
            )}

            {/* Mode terrain (si inscrit) */}
            {maraude.is_joined && (isUpcoming || isOngoing) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-4 mb-4">
                  <h2 className="font-black text-white">🗺️ Mode terrain actif</h2>
                  <p className="text-white/80 text-sm">Coordonnez-vous avec votre équipe.</p>
                </div>

                {/* Phase tabs */}
                <div className="flex bg-white rounded-2xl border border-gray-100 p-1 mb-4 shadow-sm overflow-x-auto gap-1">
                  {PHASES.map((p, i) => (
                    <button key={p.key} onClick={() => setPhase(i)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                        phase === i ? "bg-emerald-500 text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                      }`}>
                      {p.emoji} <span className="hidden sm:inline">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Phase 0 */}
                {phase === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckSquare size={18} className="text-emerald-500" />Checklist préparation</h3>
                    <div className="space-y-3">
                      {["Repas préparés et emballés", "Boissons chaudes (thermos)", "Kits d'hygiène", "Couvertures et vêtements", "Liste des centres d'hébergement", "Téléphones chargés", "Binômes définis", "Briefing sécurité fait"].map(item => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                          <span className="text-gray-700 text-sm group-hover:text-gray-900">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phase 1 */}
                {phase === 1 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" />Règles de sécurité</h3>
                    <ol className="space-y-3">
                      {["Ne jamais partir seul — restez en binôme minimum", "En urgence médicale : 15 (SAMU) ou 18 (Pompiers)", "Ne pas insister si quelqu'un refuse votre aide", "Signalez tout incident via le bouton Alerte", "Partagez régulièrement votre position avec l'équipe"].map((r, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-gray-600 text-sm leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Phase 2 — Chat + alerte */}
                {phase === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/signalement" className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-colors">
                        <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-800 text-sm">Signaler un besoin</p>
                          <p className="text-emerald-600 text-xs">Enregistrer une personne</p>
                        </div>
                      </Link>
                      <button onClick={sendAlert} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors text-left">
                        <Megaphone size={20} className="text-red-500 shrink-0" />
                        <div>
                          <p className="font-bold text-red-700 text-sm">Alerte équipe</p>
                          <p className="text-red-500 text-xs">Signal d'urgence</p>
                        </div>
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                        <MessageSquare size={15} className="text-blue-500" />
                        <h3 className="font-bold text-gray-800 text-sm">Messages équipe</h3>
                        <span className="ml-auto text-xs text-gray-400">Auto-refresh 15s</span>
                      </div>
                      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {messages.length === 0 && (
                          <p className="text-gray-400 text-sm text-center py-8">Aucun message. Soyez le premier !</p>
                        )}
                        {messages.map(m => (
                          <div key={m.id} className={`max-w-xs ${m.type === "alert" ? "ml-auto" : ""}`}>
                            <div className={`rounded-2xl px-4 py-2.5 ${m.type === "alert" ? "bg-red-500 text-white" : "bg-white border border-gray-100 shadow-sm"}`}>
                              <p className={`text-xs font-bold mb-0.5 ${m.type === "alert" ? "text-red-100" : "text-emerald-600"}`}>{m.sender_name}</p>
                              <p className={`text-sm ${m.type === "alert" ? "text-white" : "text-gray-700"}`}>{m.content}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 px-1">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        ))}
                        <div ref={msgEndRef} />
                      </div>
                      <div className="p-3 border-t border-gray-100 flex gap-2">
                        <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                          placeholder="Message à l'équipe..."
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
                        />
                        <button onClick={sendMsg} disabled={sendingMsg || !msgInput.trim()}
                          className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                          {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 3 — Rapport */}
                {phase === 3 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><FileText size={18} className="text-blue-500" />Rapport de fin de maraude</h3>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      {[["Personnes rencontrées", "personnes"], ["Repas distribués", "repas"], ["Kits distribués", "kits"], ["Orientations vers structures", "orientations"]].map(([label, key]) => (
                        <div key={key}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                          <input type="number" min="0" placeholder="0"
                            value={rapportForm[key as keyof typeof rapportForm]}
                            onChange={e => setRapportForm(r => ({ ...r, [key]: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bilan qualitatif</label>
                      <textarea rows={3} placeholder="Ce qui s'est bien passé, difficultés, besoins identifiés..."
                        value={rapportForm.bilan}
                        onChange={e => setRapportForm(r => ({ ...r, bilan: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                      />
                    </div>
                    <button onClick={submitRapport} disabled={submittingRapport}
                      className="btn-primary w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none transition-all flex items-center justify-center gap-2">
                      {submittingRapport ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                      Soumettre le rapport officiel
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Rapport affiché si maraude terminée */}
            {isCompleted && rapport && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <h2 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><BarChart2 size={18} />Rapport de maraude</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Personnes", value: rapport.personnes_rencontrees, emoji: "👥" },
                    { label: "Repas", value: rapport.repas_distribues, emoji: "🍽️" },
                    { label: "Kits", value: rapport.kits_distribues, emoji: "📦" },
                    { label: "Orientations", value: rapport.orientations, emoji: "🏥" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-3 text-center">
                      <div className="text-xl">{s.emoji}</div>
                      <div className="text-xl font-black text-emerald-700">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                {rapport.bilan_qualitatif && <p className="text-sm text-emerald-900 italic">"{rapport.bilan_qualitatif}"</p>}
                {rapport.redige_par_name && <p className="text-xs text-emerald-600 mt-2">Rédigé par {rapport.redige_par_name}</p>}
              </div>
            )}

            {/* Participants */}
            {maraude.participants && maraude.participants.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-4">👥 Bénévoles inscrits ({maraude.participants.length})</h2>
                <div className="flex flex-wrap gap-3">
                  {maraude.participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
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
            {/* CTA */}
            {isUpcoming && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
                {maraude.is_joined ? (
                  <div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-3">
                      <CheckCircle size={18} />Vous êtes inscrit
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Retrouvez l'équipe au point de rendez-vous.</p>
                    {maraude.lat && (
                      <a href={`https://www.openstreetmap.org/?mlat=${maraude.lat}&mlon=${maraude.lng}&zoom=16`} target="_blank" rel="noopener"
                        className="w-full block text-center px-4 py-2.5 border border-emerald-300 text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-50 transition">
                        📍 Voir le point de RDV
                      </a>
                    )}
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

            {/* Conseils */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">💡 Conseils terrain</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex gap-2"><span>👥</span>Ne partez jamais seul, restez en binôme</li>
                <li className="flex gap-2"><span>📱</span>Gardez votre téléphone chargé</li>
                <li className="flex gap-2"><span>🚨</span>En urgence médicale : appelez le 15</li>
                <li className="flex gap-2"><span>❤️</span>L'écoute prime sur la distribution</li>
                <li className="flex gap-2"><span>📝</span>Notez vos observations pour le rapport</li>
              </ul>
            </div>

            {/* Kit */}
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-3 text-sm">🎒 Kit maraude</h3>
              <ul className="space-y-1 text-xs text-orange-700">
                <li>🍞 Sandwichs, fruits, encas</li>
                <li>☕ Boissons chaudes (thermos)</li>
                <li>🧤 Gants, bonnets, couvertures</li>
                <li>🧼 Kits d'hygiène</li>
                <li>📄 Liste des centres d'hébergement</li>
              </ul>
            </div>

            <Link href="/carte" className="block bg-blue-50 rounded-2xl p-5 border border-blue-100 hover:bg-blue-100 transition-colors">
              <h3 className="font-bold text-blue-800 mb-1 text-sm flex items-center gap-1">
                <AlertTriangle size={14} />Alertes actives
              </h3>
              <p className="text-xs text-blue-600">Consultez la carte avant de partir →</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
