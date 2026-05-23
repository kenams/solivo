"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Donation {
  id: string; amount_cents: number; created_at: string;
  anonymous: boolean; donor_name: string; message: string;
  asso_name: string; status: string;
}

export default function AdminDonationsPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/donations")
      .then(d => setItems(d.items))
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const total = items.reduce((s, d) => s + d.amount_cents, 0);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dons</h1>
          <p className="text-gray-500 text-sm">{items.length} don{items.length > 1 ? "s" : ""} — total : <strong className="text-emerald-600">{(total / 100).toFixed(2)}€</strong></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Donateur</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Montant</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Association</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Message</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Statut</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 animate-pulse">Chargement...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Aucun don</td></tr>
            ) : items.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <span className="font-medium text-gray-900">{d.anonymous ? "🔒 Anonyme" : d.donor_name || "Invité"}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-black text-emerald-600">{(d.amount_cents / 100).toFixed(2)}€</span>
                </td>
                <td className="px-5 py-4 text-gray-600">{d.asso_name || "—"}</td>
                <td className="px-5 py-4 text-gray-500 max-w-xs">
                  {d.message ? <span className="italic text-xs">"{d.message}"</span> : "—"}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    d.status === "succeeded" ? "bg-emerald-100 text-emerald-700" :
                    d.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>{d.status}</span>
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs">{new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
