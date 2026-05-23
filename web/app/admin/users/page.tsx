"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight, Trash2, Shield } from "lucide-react";

interface User {
  id: string; name: string; email: string; role: string;
  points: number; maraudes_count: number; created_at: string;
}

const ROLES = ["user", "volunteer", "association", "commerce", "admin"];
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  association: "bg-blue-100 text-blue-700",
  commerce: "bg-emerald-100 text-emerald-700",
  volunteer: "bg-purple-100 text-purple-700",
  user: "bg-gray-100 text-gray-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), search, role: roleFilter });
      const d = await api.get(`/admin/users?${params}`);
      setUsers(d.users);
      setTotal(d.total);
      setPages(d.pages);
    } catch { toast.error("Erreur"); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  async function changeRole(id: string, role: string) {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      toast.success("Rôle mis à jour");
      load();
    } catch { toast.error("Erreur"); }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Utilisateur supprimé");
      load();
    } catch { toast.error("Erreur"); }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{total} compte{total > 1 ? "s" : ""} au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nom ou email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700">
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Utilisateur</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Rôle</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Points</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Maraudes</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Inscrit le</th>
              <th className="px-5 py-3 text-right font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 animate-pulse">Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Aucun utilisateur</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-5 py-4 text-gray-700 font-medium">{u.points}</td>
                <td className="px-5 py-4 text-gray-700">{u.maraudes_count}</td>
                <td className="px-5 py-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => deleteUser(u.id, u.name)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page}/{pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
