"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Globe, Phone, Mail } from "lucide-react";

interface Association {
  id: string; name: string; city: string; verified: boolean;
  stripe_connect_status: string; owner_name: string; owner_email: string;
  website: string; phone: string; email: string; created_at: string;
}

export default function AdminAssociationsPage() {
  const [items, setItems] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");

  useEffect(() => {
    api.get("/admin/associations")
      .then(d => setItems(d.items))
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, []);

  async function toggleVerify(id: string, current: boolean) {
    try {
      await api.patch(`/admin/associations/${id}/verify`, { verified: !current });
      setItems(prev => prev.map(a => a.id === id ? { ...a, verified: !current } : a));
      toast.success(current ? "Vérification retirée" : "Association vérifiée ✓");
    } catch { toast.error("Erreur"); }
  }

  const filtered = items.filter(a =>
    filter === "all" ? true : filter === "verified" ? a.verified : !a.verified
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Associations</h1>
          <p className="text-gray-500 text-sm">{items.length} association{items.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {(["all", "unverified", "verified"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f === "all" ? "Toutes" : f === "verified" ? "✓ Vérifiées" : "⏳ En attente"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-8">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
          <div className="text-4xl mb-2">🤝</div>
          <p>Aucune association</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{a.name}</h3>
                    {a.verified && <CheckCircle size={15} className="text-emerald-500" />}
                  </div>
                  {a.city && <p className="text-sm text-gray-500">📍 {a.city}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    a.stripe_connect_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    Stripe: {a.stripe_connect_status || "non connecté"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-500 mb-4">
                <p>👤 {a.owner_name} — {a.owner_email}</p>
                {a.email && <p className="flex items-center gap-1"><Mail size={10} />{a.email}</p>}
                {a.phone && <p className="flex items-center gap-1"><Phone size={10} />{a.phone}</p>}
                {a.website && <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline"><Globe size={10} />{a.website}</a>}
                <p className="text-gray-400">Créée le {new Date(a.created_at).toLocaleDateString("fr-FR")}</p>
              </div>

              <button
                onClick={() => toggleVerify(a.id, a.verified)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                  a.verified
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {a.verified ? "✕ Retirer la vérification" : "✓ Vérifier l'association"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
