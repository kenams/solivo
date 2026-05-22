"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ROLES = [
  { value: "user", label: "Citoyen solidaire", emoji: "🌍", desc: "Je veux aider et faire des dons" },
  { value: "volunteer", label: "Bénévole", emoji: "🤝", desc: "Je veux participer aux maraudes" },
  { value: "association", label: "Association", emoji: "🏥", desc: "Je gère une association" },
  { value: "commerce", label: "Commerce", emoji: "🛒", desc: "Je veux donner mes invendus" },
];

function InscriptionForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    email: "", password: "", name: "",
    role: params.get("role") || "volunteer",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("Mot de passe minimum 8 caractères");
    setLoading(true);
    try {
      const data = await api.post("/auth/register", form);
      saveAuth(data.token, data.user);
      toast.success("Bienvenue sur Solivo ! 🎉");
      router.push("/maraudes");
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message === "email_already_used" ? "Email déjà utilisé" : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🤝</div>
          <h1 className="text-3xl font-black text-gray-900">Rejoindre Solivo</h1>
          <p className="text-gray-500 mt-1">Gratuit. Toujours.</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Je suis...</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button type="button" key={r.value}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`p-3 rounded-xl border text-left transition-all ${form.role === r.value ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-200"}`}>
                  <div className="text-xl mb-1">{r.emoji}</div>
                  <div className="font-medium text-sm text-gray-800">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom / Nom ou Pseudo</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Marie Dupont"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe (min. 8 caractères)</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition disabled:opacity-60">
            {loading ? "Création..." : "Créer mon compte gratuitement"}
          </button>

          <p className="text-center text-xs text-gray-400">
            En créant un compte, vous acceptez nos <Link href="/cgu" className="text-emerald-500">CGU</Link> et notre <Link href="/confidentialite" className="text-emerald-500">politique de confidentialité</Link>.
          </p>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-emerald-600 font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return <Suspense><InscriptionForm /></Suspense>;
}
