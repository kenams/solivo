"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { MapPin, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

interface Signalement {
  id: string; type: string; description: string; city: string;
  status: string; created_at: string; reporter_name: string;
  lat: number; lng: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};
const TYPE_EMOJIS: Record<string, string> = {
  food: "🍞", shelter: "🏠", medical: "💊", clothing: "👕", other: "📋",
};

export default function AdminSignalementsPage() {
  const [items, setItems] = useState<Signalement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), status: statusFilter });
      const d = await api.get(`/admin/signalements?${params}`);
      setItems(d.items);
      setTotal(d.total);
    } catch { toast.error("Erreur"); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function update(id: string, status: string) {
    try {
      await api.patch(`/admin/signalements/${id}`, { status });
      toast.success("Mis à jour");
      load();
    } catch { toast.error("Erreur"); }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Signalements</h1>
          <p className="text-gray-500 text-sm">{total} signalement{total > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {["pending", "in_progress", "resolved", "rejected", ""].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s || "Tous"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-gray-400 animate-pulse text-center py-8">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>Aucun signalement {statusFilter}</p>
          </div>
        ) : items.map(s => (
          <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{TYPE_EMOJIS[s.type] || "📋"}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"}`}>{s.status}</span>
                <span className="text-xs text-gray-400">par {s.reporter_name || "Anonyme"}</span>
                <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed mb-2">{s.description || "Pas de description"}</p>
              {s.city && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} />{s.city}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {s.status !== "in_progress" && (
                <button onClick={() => update(s.id, "in_progress")}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                  En cours
                </button>
              )}
              {s.status !== "resolved" && (
                <button onClick={() => update(s.id, "resolved")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
                  <Check size={12} />Résolu
                </button>
              )}
              {s.status !== "rejected" && (
                <button onClick={() => update(s.id, "rejected")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
                  <X size={12} />Rejeter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {Math.ceil(total / 20) > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft size={16} />
            </button>
            <button disabled={items.length < 20} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
