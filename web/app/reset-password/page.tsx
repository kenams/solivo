"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Minimum 8 caractères");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Mot de passe mis à jour !");
      setTimeout(() => router.push("/connexion"), 2000);
    } catch {
      toast.error("Lien invalide ou expiré");
    } finally { setLoading(false); }
  }

  if (!token) return (
    <div className="text-center">
      <p className="text-white/50 mb-4">Lien invalide. Demandez un nouveau lien depuis la page de connexion.</p>
      <Link href="/connexion" className="text-emerald-400 hover:underline">← Retour à la connexion</Link>
    </div>
  );

  if (done) return (
    <div className="text-center">
      <div className="text-5xl mb-4">✅</div>
      <p className="text-white font-bold text-lg mb-2">Mot de passe mis à jour !</p>
      <p className="text-white/50 text-sm">Redirection vers la connexion...</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="glass border border-white/[0.08] rounded-3xl p-8 space-y-5 shadow-2xl">
      <div>
        <label className="block text-sm font-semibold text-white/60 mb-2">Nouveau mot de passe</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white/60 mb-2">Confirmer le mot de passe</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Répétez votre mot de passe"
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all"
          />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2">
        {loading ? "Mise à jour..." : <><span>Mettre à jour</span><ArrowRight size={18} /></>}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xl shadow-lg">🤝</div>
            <span className="text-2xl font-black text-white">Solivo</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Nouveau mot de passe</h1>
          <p className="text-white/40">Choisissez un mot de passe sécurisé.</p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-white/30 text-sm mt-6">
          <Link href="/connexion" className="hover:text-white/60 transition-colors">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
