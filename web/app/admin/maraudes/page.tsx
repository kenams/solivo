"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Trash2, ChevronLeft, ChevronRight, Users, Calendar } from "lucide-react";

interface Maraude {
  id: string; title: string; status: string; city: string;
  date_start: string; volunteers_count: number; max_volunteers: number;
  organizer_name: string; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-emerald-100 text-emerald-700",
  ongoing: "bg-blue-100 text-blue-700 animate-pulse",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminMaraudesPage() {
  const [items, setItems] = useState<Maraude[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), status: statusFilter });
      const d = await api.get(`/admin/maraudes?${params}`);
      setItems(d.items);
      setTotal(d.total);
    } catch { toast.error("Erreur"); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function deleteMaraude(id: string, title: string) {
    if (!confirm(`Supprimer "${title}" ? Irréversible.`)) return;
    try {
      await api.delete(`/admin/maraudes/${id}`);
      toast.success("Maraude supprimée");
      load();
    } catch { toast.error("Erreur"); }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Maraudes</h1>
          <p className="text-gray-500 text-sm">{total} maraude{total > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {["", "upcoming", "ongoing", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s || "Toutes"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Maraude</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Statut</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Date</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Bénévoles</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Organisateur</th>
              <th className="px-5 py-3 text-right font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 animate-pulse">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Aucune maraude</td></tr>
            ) : items.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <a href={`/maraudes/${m.id}`} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-emerald-600 transition-colors">
                    {m.title}
                  </a>
                  {m.city && <div className="text-xs text-gray-400">📍 {m.city}</div>}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(m.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users size={13} className="text-gray-400" />
                    {m.volunteers_count}/{m.max_volunteers}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">{m.organizer_name || "—"}</td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => deleteMaraude(m.id, m.title)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {Math.ceil(total / 20) > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} / {Math.ceil(total / 20)}</p>
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
    </div>
  );
}
