"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Users, Heart, MapPin, ChevronRight, Plus, Banknote, Package } from "lucide-react";

interface Association {
  id: string; name: string; description: string; city: string; verified: boolean;
  stripe_connect_status: string; beneficiaries_count: number;
}
interface Maraude {
  id: string; title: string; date_start: string; status: string; beneficiaries_helped: number;
}
interface Donation {
  id: string; amount_cents: number; created_at: string; anonymous: boolean; message: string;
}

export default function DashboardAssociationPage() {
  const router = useRouter();
  const user = getUser();
  const [asso, setAsso] = useState<Association | null>(null);
  const [maraudes, setMaraudes] = useState<Maraude[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/connexion"); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      const assos = await api.get("/associations");
      const myAsso = assos.find((a: Association) => true);
      if (!myAsso) { router.push("/associations/creer"); return; }
      const detail = await api.get(`/associations/${myAsso.id}`);
      setAsso(detail);
      setMaraudes(detail.maraudes || []);
      const dons = await api.get("/donations/me").catch(() => []);
      setDonations(dons.slice(0, 5));
    } catch { toast.error("Erreur de chargement"); }
    finally { setLoading(false); }
  }

  if (loading || !asso) return <div className="pt-24 text-center text-gray-400 animate-pulse">Chargement...</div>;

  const totalDons = donations.reduce((s, d) => s + d.amount_cents, 0);
  const maraudesTerminees = maraudes.filter(m => m.status === "completed");

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-gray-900">{asso.name}</h1>
              {asso.verified && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">✓ Vérifiée</span>}
            </div>
            <p className="text-gray-500 flex items-center gap-1"><MapPin size={14} />{asso.city}</p>
          </div>
          <Link href="/maraudes/creer"
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-sm">
            <Plus size={18} />Nouvelle maraude
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Maraudes terminées", value: maraudesTerminees.length, icon: "🚶", color: "text-emerald-600" },
            { label: "Personnes aidées", value: asso.beneficiaries_count || 0, icon: "👤", color: "text-blue-600" },
            { label: "Dons reçus", value: `${(totalDons / 100).toFixed(0)}€`, icon: "💙", color: "text-purple-600" },
            { label: "Statut Stripe", value: asso.stripe_connect_status === "active" ? "Actif" : "Inactif", icon: "💳", color: asso.stripe_connect_status === "active" ? "text-emerald-600" : "text-amber-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Stripe Connect banner si pas actif */}
        {asso.stripe_connect_status !== "active" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-amber-800">Activez la réception de dons</p>
              <p className="text-sm text-amber-700 mt-0.5">Connectez votre compte bancaire pour recevoir les dons directement.</p>
            </div>
            <Link href={`/associations/connect?association_id=${asso.id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition whitespace-nowrap ml-4">
              <Banknote size={16} />Connecter
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Maraudes récentes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Users size={16} className="text-emerald-500" />Maraudes
              </h2>
              <Link href="/maraudes" className="text-xs text-emerald-600 hover:underline">Voir tout</Link>
            </div>
            {maraudes.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">🚶</div>
                <p className="text-sm">Aucune maraude pour l&apos;instant</p>
                <Link href="/maraudes/creer" className="mt-3 inline-block px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl">Créer une maraude</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {maraudes.slice(0, 6).map(m => (
                  <Link key={m.id} href={`/maraudes/${m.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{m.title}</p>
                      <p className="text-xs text-gray-400">{new Date(m.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        m.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        m.status === "ongoing" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{m.status}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="space-y-4">
            {/* Invendus à collecter */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Package size={16} className="text-emerald-500" />Invendus disponibles
                </h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-4">Des commerces partenaires ont des surplus alimentaires près de chez vous.</p>
                <Link href="/invendus"
                  className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition">
                  <span className="text-sm font-medium text-emerald-700">♻️ Voir les invendus</span>
                  <ChevronRight size={14} className="text-emerald-500" />
                </Link>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Actions</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { href: "/maraudes/creer", label: "Organiser une maraude", emoji: "🚶" },
                  { href: `/associations/connect?association_id=${asso.id}`, label: "Gérer les paiements", emoji: "💳" },
                  { href: "/signalement", label: "Signalements reçus", emoji: "⚠️" },
                  { href: "/transparence", label: "Transparence financière", emoji: "🔍" },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                    <span className="text-sm text-gray-700">{item.emoji} {item.label}</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {asso.description && (
          <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-2">À propos</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{asso.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
