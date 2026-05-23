"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { use } from "react";
import Link from "next/link";
import { MapPin, Users, Heart, CheckCircle, ChevronRight, Calendar } from "lucide-react";

interface Association {
  id: string; name: string; description: string; city: string; verified: boolean;
  phone: string; email: string; website: string;
  stripe_connect_status: string; beneficiaries_count: number;
  maraudes: { id: string; title: string; date_start: string; status: string; volunteers_count: number; max_volunteers: number }[];
  expenses: { id: string; description: string; amount_cents: number; category: string; expense_date: string }[];
}

const CAT_LABELS: Record<string, string> = {
  food: "🍞 Alimentation", transport: "🚗 Transport", equipment: "🧥 Équipement",
  medical: "💊 Médical", admin: "📋 Administration", other: "📦 Autre",
};

export default function AssociationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asso, setAsso] = useState<Association | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/associations/${id}`).then(setAsso).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pt-24 text-center text-gray-400 animate-pulse">Chargement...</div>;
  if (!asso) return <div className="pt-24 text-center text-gray-500">Association introuvable</div>;

  const totalExpenses = asso.expenses?.reduce((s, e) => s + e.amount_cents, 0) || 0;
  const maraudes = asso.maraudes || [];
  const upcomingMaraudes = maraudes.filter(m => m.status !== "completed").slice(0, 4);

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-3xl p-8 text-white mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">{asso.name}</h1>
                {asso.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                    <CheckCircle size={12} />Vérifiée
                  </span>
                )}
              </div>
              {asso.city && <p className="text-emerald-100 flex items-center gap-1"><MapPin size={14} />{asso.city}</p>}
              {asso.description && <p className="text-white/80 mt-3 text-sm leading-relaxed max-w-xl">{asso.description}</p>}
            </div>
            {asso.stripe_connect_status === "active" && (
              <Link href={`/don?association_id=${asso.id}`}
                className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-700 font-black rounded-xl hover:bg-emerald-50 transition whitespace-nowrap ml-4">
                <Heart size={18} />Faire un don
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "Maraudes", value: maraudes.length },
              { label: "Bénéficiaires", value: asso.beneficiaries_count || 0 },
              { label: "Dépenses traçables", value: `${(totalExpenses / 100).toFixed(0)}€` },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-xs text-emerald-100 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Maraudes à venir */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Users size={16} className="text-emerald-500" />Maraudes
              </h2>
              <Link href="/maraudes" className="text-xs text-emerald-600 hover:underline">Voir toutes</Link>
            </div>
            {maraudes.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">🚶</div>
                <p className="text-sm">Aucune maraude programmée</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {maraudes.slice(0, 5).map(m => (
                  <Link key={m.id} href={`/maraudes/${m.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-800">{m.title}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />{new Date(m.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{m.volunteers_count}/{m.max_volunteers}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        m.status === "completed" ? "bg-blue-100 text-blue-700" :
                        m.status === "ongoing" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}>{m.status}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Infos + Dépenses */}
          <div className="space-y-4">
            {/* Contact */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3">Contact</h2>
              <div className="space-y-2 text-sm text-gray-600">
                {asso.email && <p>📧 {asso.email}</p>}
                {asso.phone && <p>📞 {asso.phone}</p>}
                {asso.website && <a href={asso.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">🌐 Site web</a>}
              </div>
            </div>

            {/* Dépenses récentes */}
            {asso.expenses?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800">Dépenses récentes</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {asso.expenses.slice(0, 5).map(e => (
                    <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{e.description}</p>
                        <p className="text-xs text-gray-400">{CAT_LABELS[e.category] || e.category}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{(e.amount_cents / 100).toFixed(0)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Faire un don CTA */}
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 text-center">
              <Heart size={24} className="text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800 mb-1">Soutenir cette association</p>
              <p className="text-xs text-gray-500 mb-3">100% de votre don leur parvient directement.</p>
              <Link href={asso.stripe_connect_status === "active" ? `/don?association_id=${asso.id}` : "/don"}
                className="block py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition text-sm">
                Faire un don
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
