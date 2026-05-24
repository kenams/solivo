"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Users, MapPin, AlertTriangle, Heart, Building2, ShoppingBag, TrendingUp, RefreshCw, CreditCard, Activity } from "lucide-react";
import Link from "next/link";

interface Stats {
  users: number; maraudes: number; signalements: number;
  donations_count: number; donations_total: number;
  associations: number; commerces: number;
  byRole: { role: string; count: string }[];
  recentUsers: { id: string; name: string; email: string; role: string; created_at: string }[];
  recentMaraudes: { id: string; title: string; status: string; created_at: string }[];
}

interface Donation {
  id: string; amount_cents: number; platform_fee_cents: number;
  donor_name: string; anonymous: boolean; status: string;
  stripe_session_id: string; recurring: boolean; created_at: string; asso_name: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  association: "bg-blue-100 text-blue-700",
  commerce: "bg-emerald-100 text-emerald-700",
  volunteer: "bg-purple-100 text-purple-700",
  user: "bg-gray-100 text-gray-600",
};

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/donations").then(r => r.items?.slice(0, 5) || []),
      ]);
      setStats(s);
      setDonations(d);
      setLastRefresh(new Date());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !stats) return <div className="p-8 text-gray-400 animate-pulse">Chargement...</div>;
  if (!stats) return <div className="p-8 text-gray-400">Erreur de chargement</div>;

  const KPIs = [
    { label: "Utilisateurs", value: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/users" },
    { label: "Maraudes", value: stats.maraudes, icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50", href: "/admin/maraudes" },
    { label: "Signalements", value: stats.signalements, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", href: "/admin/signalements" },
    { label: "Dons (volume)", value: `${(stats.donations_total / 100).toFixed(0)}€`, icon: Heart, color: "text-red-600", bg: "bg-red-50", href: "/admin/donations" },
    { label: "Associations", value: stats.associations, icon: Building2, color: "text-purple-600", bg: "bg-purple-50", href: "/admin/associations" },
    { label: "Commerces", value: stats.commerces, icon: ShoppingBag, color: "text-teal-600", bg: "bg-teal-50", href: "/admin" },
  ];

  const recentDonTotal = donations.filter(d => d.status === "completed").reduce((s, d) => s + d.amount_cents, 0);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Vue d&apos;ensemble</h1>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
            <Activity size={11} className="text-emerald-500" />
            Live · actualisé à {lastRefresh.toLocaleTimeString("fr-FR")}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {KPIs.map(k => (
          <Link key={k.label} href={k.href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">{k.label}</span>
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon size={16} className={k.color} />
              </div>
            </div>
            <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Répartition rôles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />Répartition des rôles
          </h2>
          <div className="space-y-2.5">
            {stats.byRole.map(r => {
              const total = stats.users || 1;
              const pct = Math.round((parseInt(r.count) / total) * 100);
              return (
                <div key={r.role}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[r.role] || "bg-gray-100 text-gray-600"}`}>{r.role}</span>
                    <span className="text-sm font-bold text-gray-700">{r.count}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Derniers dons */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <CreditCard size={16} className="text-[#635bff]" />Dernières transactions Stripe
            </h2>
            <Link href="/admin/donations" className="text-xs text-[#635bff] hover:underline">Voir tout →</Link>
          </div>
          {donations.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Aucune transaction</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {donations.map(d => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{d.anonymous ? "🔒 Anonyme" : (d.donor_name || "Invité")}</p>
                    <p className="text-xs text-gray-400">{d.asso_name || "Sans association"}{d.recurring ? " · 🔁 mensuel" : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-emerald-600">{(d.amount_cents / 100).toFixed(2)}€</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[d.status] || "bg-gray-100 text-gray-600"}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between">
                <span>Total affiché :</span>
                <strong className="text-emerald-600">{(recentDonTotal / 100).toFixed(2)}€</strong>
              </div>
            </div>
          )}
        </div>

        {/* Derniers inscrits */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Derniers inscrits</h2>
            <Link href="/admin/users" className="text-xs text-emerald-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(stats.recentUsers || []).map(u => (
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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Dernières maraudes</h2>
            <Link href="/admin/maraudes" className="text-xs text-emerald-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(stats.recentMaraudes || []).map(m => (
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
