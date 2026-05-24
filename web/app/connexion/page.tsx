"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";

export default function ConnexionPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Bienvenue ! 🎉");
      router.push("/");
    } catch {
      toast.error("Email ou mot de passe incorrect");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xl shadow-lg">🤝</div>
            <span className="text-2xl font-black text-white">Solivo</span>
          </Link>
          <h1 className="text-4xl font-black text-white mb-2">Bon retour !</h1>
          <p className="text-white/40">Connectez-vous pour continuer à agir.</p>
        </div>

        <form onSubmit={submit} className="glass border border-white/[0.08] rounded-3xl p-8 space-y-5 shadow-2xl">
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="votre@email.com"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2">
            {loading ? "Connexion..." : <><span>Se connecter</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
            Rejoindre Solivo →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
