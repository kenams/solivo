"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Eye, TrendingUp, Users, DollarSign } from "lucide-react";

interface Stats {
  donations_total_cents: number;
  expenses_total_cents: number;
  balance_cents: number;
  by_category: { category: string; total: string }[];
  total_beneficiaries: number;
  total_maraudes: number;
}

interface Donation {
  id: string;
  amount_cents: number;
  created_at: string;
  anonymous: boolean;
  donor_name: string;
  message: string;
}

const CAT_LABELS: Record<string, string> = {
  food: "🍞 Alimentation", transport: "🚗 Transport", equipment: "🧥 Équipement",
  medical: "💊 Médical", admin: "📋 Administration", other: "📦 Autre",
};

export default function TransparencePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => {
    api.get("/donations/stats").then(setStats).catch(() => {});
    api.get("/donations/public").then(d => setDonations(d.donations)).catch(() => {});
  }, []);

  const fmt = (cents: number) => `${(cents / 100).toFixed(0)}€`;

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Transparence financière</h1>
          <p className="text-gray-500 text-lg">Chaque euro traçable. Chaque achat justifié. Rien à cacher.</p>
        </div>

        {/* KPI cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-1">{fmt(stats.donations_total_cents)}</div>
              <div className="text-sm text-gray-500">Dons collectés</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-1">{fmt(stats.expenses_total_cents)}</div>
              <div className="text-sm text-gray-500">Dépenses totales</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-1">{stats.total_beneficiaries || 0}</div>
              <div className="text-sm text-gray-500">Personnes aidées</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl mb-1">{stats.total_maraudes || 0}</div>
              <div className="text-sm text-gray-500">Maraudes terminées</div>
            </div>
          </div>
        )}

        {/* Barre d'utilisation */}
        {stats && stats.donations_total_cents > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="font-bold text-gray-800 mb-4">Utilisation des fonds</h2>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (stats.expenses_total_cents / stats.donations_total_cents) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Dépensé : {fmt(stats.expenses_total_cents)}</span>
              <span>Disponible : {fmt(stats.balance_cents)}</span>
            </div>

            {/* Par catégorie */}
            {stats.by_category?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                {stats.by_category.map(c => (
                  <div key={c.category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span>{CAT_LABELS[c.category] || c.category}</span>
                    <span className="font-bold text-gray-700">{fmt(parseInt(c.total))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flux de dons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Derniers dons</h2>
          </div>
          {donations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">💙</div>
              <p>Soyez le premier à faire un don !</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {donations.map(d => (
                <div key={d.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{d.donor_name || "Donateur anonyme"}</div>
                    {d.message && <p className="text-sm text-gray-500 italic">"{d.message}"</p>}
                    <div className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <div className="text-xl font-black text-emerald-600">{fmt(d.amount_cents)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
