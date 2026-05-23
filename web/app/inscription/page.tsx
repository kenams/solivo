"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User } from "lucide-react";

const ROLES = [
  { value: "user", label: "Citoyen solidaire", emoji: "🌍", desc: "Dons & soutien" },
  { value: "volunteer", label: "Bénévole", emoji: "🤝", desc: "Maraudes terrain" },
  { value: "association", label: "Association", emoji: "🏥", desc: "Organiser & gérer" },
  { value: "commerce", label: "Commerce", emoji: "🛒", desc: "Donner des invendus" },
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
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-emerald-500/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/8 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xl shadow-lg">🤝</div>
            <span className="text-2xl font-black text-white">Solivo</span>
          </Link>
          <h1 className="text-4xl font-black text-white mb-2">Rejoindre</h1>
          <p className="text-white/40">Gratuit. Toujours. Impact immédiat.</p>
        </div>

        <form onSubmit={submit} className="glass border border-white/[0.08] rounded-3xl p-8 space-y-5 shadow-2xl">
          {/* Rôle */}
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-3">Je suis...</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button type="button" key={r.value}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                    form.role === r.value
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                      : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}>
                  <div className="text-lg mb-1">{r.emoji}</div>
                  <div className="font-bold text-sm text-white">{r.label}</div>
                  <div className="text-xs text-white/40">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">Prénom / Pseudo</label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Marie Dupont"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="votre@email.com"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">Mot de passe (min. 8 caractères)</label>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2">
            {loading ? "Création..." : <><span>Créer mon compte — Gratuit</span><ArrowRight size={18} /></>}
          </button>

          <p className="text-center text-xs text-white/25">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/cgu" className="text-emerald-400 hover:text-emerald-300">CGU</Link> et notre{" "}
            <Link href="/confidentialite" className="text-emerald-400 hover:text-emerald-300">politique de confidentialité</Link>.
          </p>
        </form>

        <p className="text-center text-white/40 text-sm mt-5">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Se connecter →</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function InscriptionPage() {
  return <Suspense><InscriptionForm /></Suspense>;
}
