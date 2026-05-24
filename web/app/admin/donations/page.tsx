"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { RefreshCw, ExternalLink, TrendingUp, DollarSign, Repeat, CreditCard } from "lucide-react";

interface Donation {
  id: string;
  amount_cents: number;
  platform_fee_cents: number;
  contribution_percent: number;
  created_at: string;
  anonymous: boolean;
  donor_name: string;
  message: string;
  asso_name: string;
  status: string;
  stripe_session_id: string;
  stripe_payment_intent: string;
  recurring: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "✓ Payé",
  pending: "⏳ En attente",
  failed: "✗ Échoué",
};

export default function AdminDonationsPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/donations")
      .then(d => { setItems(d.items); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = filter ? items.filter(d => d.status === filter) : items;
  const completed = items.filter(d => d.status === "completed");
  const totalVol = completed.reduce((s, d) => s + d.amount_cents, 0);
  const totalFees = completed.reduce((s, d) => s + (d.platform_fee_cents || 0), 0);
  const recurring = completed.filter(d => d.recurring).length;

  const today = new Date().toDateString();
  const todayCount = completed.filter(d => new Date(d.created_at).toDateString() === today).length;
  const todayVol = completed.filter(d => new Date(d.created_at).toDateString() === today).reduce((s, d) => s + d.amount_cents, 0);

  function stripeLink(sessionId: string) {
    return `https://dashboard.stripe.com/payments/${sessionId}`;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transactions Stripe</h1>
          <p className="text-gray-400 text-xs mt-1">
            Actualisé à {lastRefresh.toLocaleTimeString("fr-FR")} · auto-refresh 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">Tous les statuts</option>
            <option value="completed">Payés</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoués</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#635bff] text-white rounded-xl text-sm font-medium hover:bg-[#5249e0] transition">
            <ExternalLink size={13} />Stripe Dashboard
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Volume total", value: `${(totalVol / 100).toFixed(2)}€`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Commissions plateforme", value: `${(totalFees / 100).toFixed(2)}€`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Abonnements actifs", value: recurring, icon: Repeat, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Aujourd'hui", value: `${todayCount} don${todayCount > 1 ? "s" : ""} · ${(todayVol / 100).toFixed(0)}€`, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{k.label}</span>
              <div className={`w-7 h-7 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon size={14} className={k.color} />
              </div>
            </div>
            <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Donateur</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Montant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Commission</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Association</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Statut</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Stripe</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 animate-pulse">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucune transaction</td></tr>
              ) : filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {d.anonymous ? "🔒 Anonyme" : d.donor_name || "Invité"}
                    </span>
                    {d.message && <p className="text-xs text-gray-400 italic mt-0.5 max-w-[120px] truncate">"{d.message}"</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-black text-emerald-600">{(d.amount_cents / 100).toFixed(2)}€</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {d.platform_fee_cents > 0 ? (
                      <span className="text-blue-600 font-semibold">+{(d.platform_fee_cents / 100).toFixed(2)}€ ({d.contribution_percent}%)</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{d.asso_name || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {d.recurring ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        <Repeat size={10} />Mensuel
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Unique</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[d.status] || "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[d.status] || d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {d.stripe_session_id ? (
                      <a href={stripeLink(d.stripe_session_id)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#635bff] font-mono hover:underline">
                        {d.stripe_session_id.slice(0, 16)}...
                        <ExternalLink size={10} />
                      </a>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""} · Volume: <strong className="text-emerald-600">{(filtered.filter(d => d.status === "completed").reduce((s, d) => s + d.amount_cents, 0) / 100).toFixed(2)}€</strong>
          </div>
        )}
      </div>
    </div>
  );
}
