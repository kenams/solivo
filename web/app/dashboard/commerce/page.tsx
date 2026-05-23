"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Package, Clock, CheckCircle, XCircle, Leaf } from "lucide-react";

interface Commerce {
  id: string; name: string; type: string; address: string; city: string; active: boolean;
}
interface Invenu {
  id: string; title: string; description: string; quantity: number; unit: string;
  available_until: string; status: string; created_at: string;
}
interface CollecteRequest {
  id: string; status: string; invenu_title: string; quantity: number; unit: string;
  association_name: string; association_phone: string; pickup_scheduled_at: string;
  collector_name: string; collector_phone: string; note_association: string;
}
interface Impact {
  total_pickups: number; kg_saved: number; meals_equivalent: number; co2_saved_kg: number;
  monthly: number; commission_total_cents: number;
}

const TYPE_LABELS: Record<string, string> = {
  restaurant: "🍽️ Restaurant", bakery: "🥖 Boulangerie", supermarket: "🛒 Supermarché", other: "🏪 Autre",
};
const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-amber-100 text-amber-700",
  collected: "bg-blue-100 text-blue-700",
};

export default function DashboardCommercePage() {
  const router = useRouter();
  const user = getUser();
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [invendus, setInvendus] = useState<Invenu[]>([]);
  const [requests, setRequests] = useState<CollecteRequest[]>([]);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", quantity: "", unit: "kg", available_until: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) { router.push("/connexion"); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      const commerces = await api.get("/commerces");
      const myCommerce = commerces.find((c: Commerce) => true); // premier commerce de l'user
      if (!myCommerce) { router.push("/partenaires/commerce"); return; }
      setCommerce(myCommerce);

      const [inv, reqs, imp] = await Promise.all([
        api.get("/invendus"),
        api.get(`/marketplace/collecte-requests/commerce/${myCommerce.id}`),
        api.get(`/marketplace/impact/${myCommerce.id}`).catch(() => null),
      ]);
      setInvendus(inv.filter((i: Invenu & { commerce_id: string }) => i.commerce_id === myCommerce.id || true).slice(0, 20));
      setRequests(reqs);
      if (imp) setImpact(imp);
    } catch { toast.error("Erreur de chargement"); }
  }

  async function submitInvenu(e: React.FormEvent) {
    e.preventDefault();
    if (!commerce) return;
    setLoading(true);
    try {
      await api.post("/marketplace/invendus", {
        commerce_id: commerce.id,
        title: form.title,
        description: form.description,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        available_until: form.available_until || null,
      });
      toast.success("Invenu publié !");
      setShowForm(false);
      setForm({ title: "", description: "", quantity: "", unit: "kg", available_until: "" });
      loadData();
    } catch { toast.error("Erreur lors de la publication"); }
    finally { setLoading(false); }
  }

  async function handleRequest(id: string, status: "accepted" | "rejected") {
    try {
      await api.patch(`/marketplace/collecte-requests/${id}/status`, { status });
      toast.success(status === "accepted" ? "Demande acceptée !" : "Demande refusée");
      loadData();
    } catch { toast.error("Erreur"); }
  }

  if (!commerce) return <div className="pt-24 text-center text-gray-400 animate-pulse">Chargement...</div>;

  const pendingRequests = requests.filter(r => r.status === "pending");
  const myInvendus = invendus.filter(i => i.status === "available");

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">{commerce.name}</h1>
            <p className="text-gray-500">{TYPE_LABELS[commerce.type]} · {commerce.city}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-sm">
            <Plus size={18} />Publier un invenu
          </button>
        </div>

        {/* Impact Stats */}
        {impact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Collectes confirmées", value: impact.total_pickups, icon: "✅" },
              { label: "Kg sauvés", value: `${impact.kg_saved.toFixed(1)} kg`, icon: "♻️" },
              { label: "Repas équivalents", value: impact.meals_equivalent, icon: "🍽️" },
              { label: "CO₂ évité", value: `${impact.co2_saved_kg} kg`, icon: "🌿" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire ajout invenu */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200 mb-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Package size={18} className="text-emerald-500" />Nouvel invenu</h2>
            <form onSubmit={submitInvenu} className="space-y-3">
              <input required placeholder="Titre (ex: Baguettes du jour, Quiches...)" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800" />
              <textarea placeholder="Description optionnelle" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 text-sm" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" min="0" step="0.1" placeholder="Quantité" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700">
                  {["kg", "litres", "portions", "unités", "barquettes", "plateaux"].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="datetime-local" value={form.available_until}
                  onChange={e => setForm(f => ({ ...f, available_until: e.target.value }))}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700 text-sm" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition disabled:opacity-60">
                  {loading ? "Publication..." : "Publier"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Demandes en attente */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />Demandes de collecte
              </h2>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{pendingRequests.length}</span>
              )}
            </div>
            {requests.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm">Aucune demande pour l&apos;instant</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {requests.slice(0, 10).map(r => (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{r.invenu_title}</p>
                        <p className="text-sm text-gray-500">{r.association_name}</p>
                        {r.pickup_scheduled_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            📅 {new Date(r.pickup_scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === "pending" ? "bg-amber-100 text-amber-700" :
                        r.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                        r.status === "collected" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>{r.status}</span>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleRequest(r.id, "accepted")}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition">
                          <CheckCircle size={14} />Accepter
                        </button>
                        <button onClick={() => handleRequest(r.id, "rejected")}
                          className="flex-1 flex items-center justify-center gap-1 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition">
                          <XCircle size={14} />Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mes invendus actifs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Leaf size={16} className="text-emerald-500" />Mes invendus
              </h2>
            </div>
            {invendus.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">🍞</div>
                <p className="text-sm">Publiez votre premier invenu !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {invendus.map(inv => (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{inv.title}</p>
                      <p className="text-sm text-gray-500">{inv.quantity} {inv.unit}</p>
                      {inv.available_until && (
                        <p className="text-xs text-gray-400">⏱ jusqu&apos;au {new Date(inv.available_until).toLocaleDateString("fr-FR")}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
