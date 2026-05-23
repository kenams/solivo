"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, MapPin, AlertTriangle, Heart, Building2, ShoppingBag, TrendingUp } from "lucide-react";

interface Stats {
  users: number; maraudes: number; signalements: number;
  donations_count: number; donations_total: number;
  associations: number; commerces: number;
  byRole: { role: string; count: string }[];
  recentUsers: { id: string; name: string; email: string; role: string; created_at: string }[];
  recentMaraudes: { id: string; title: string; status: string; created_at: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  association: "bg-blue-100 text-blue-700",
  commerce: "bg-emerald-100 text-emerald-700",
  volunteer: "bg-purple-100 text-purple-700",
  user: "bg-gray-100 text-gray-600",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Chargement...</div>;
  if (!stats) return <div className="p-8 text-gray-400">Erreur de chargement</div>;

  const KPIs = [
    { label: "Utilisateurs", value: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Maraudes", value: stats.maraudes, icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Signalements", value: stats.signalements, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Dons (total)", value: `${(stats.donations_total / 100).toFixed(0)}€`, icon: Heart, color: "text-red-600", bg: "bg-red-50" },
    { label: "Associations", value: stats.associations, icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Commerces", value: stats.commerces, icon: ShoppingBag, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Vue d'ensemble</h1>
        <p className="text-gray-500 text-sm mt-1">Tableau de bord administrateur Solivo</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {KPIs.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">{k.label}</span>
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon size={16} className={k.color} />
              </div>
            </div>
            <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Répartition rôles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />Répartition des rôles
          </h2>
          <div className="space-y-2">
            {stats.byRole.map(r => (
              <div key={r.role} className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[r.role] || "bg-gray-100 text-gray-600"}`}>{r.role}</span>
                <span className="text-sm font-bold text-gray-700">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers inscrits */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Derniers inscrits</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentUsers.map(u => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières maraudes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Dernières maraudes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentMaraudes.map(m => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{m.title}</p>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    m.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    m.status === "ongoing" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>{m.status}</span>
                  <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
