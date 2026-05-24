"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, Zap, Shield } from "lucide-react";

const DEMO_EMAIL = "demo@solivo.app";
const DEMO_PASS = "Demo1234!";

export default function ConnexionPage() {
  const { login, register, refresh } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Bienvenue !");
      router.push("/");
    } catch {
      toast.error("Email ou mot de passe incorrect");
    } finally { setLoading(false); }
  }

  async function connectDemo() {
    setDemoLoading(true);
    try {
      try {
        await login(DEMO_EMAIL, DEMO_PASS);
      } catch {
        await register("Compte Démo", DEMO_EMAIL, DEMO_PASS, "volunteer");
      }
      toast.success("Connecté en mode démo !");
      router.push("/");
    } catch {
      toast.error("Erreur lors de la connexion démo");
    } finally { setDemoLoading(false); }
  }

  async function forgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://solivo-api.onrender.com"}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch { toast.error("Erreur"); }
    finally { setForgotLoading(false); }
  }

  async function bootstrapAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin-bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${adminEmail} promu Admin !`);
      setShowAdminModal(false);
      await refresh();
      router.push("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg === "user_not_found" ? "Compte introuvable — connectez-vous d'abord" : "Erreur bootstrap");
    } finally { setAdminLoading(false); }
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

        {/* Bouton démo */}
        <button onClick={connectDemo} disabled={demoLoading}
          className="w-full mb-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 font-bold hover:border-amber-400/50 transition-all disabled:opacity-60">
          <Zap size={16} />
          {demoLoading ? "Connexion..." : "Tester avec un compte démo — sans inscription"}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">ou se connecter</span>
          <div className="flex-1 h-px bg-white/10" />
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
          <div className="text-center pt-1">
            <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Mot de passe oublié ?
            </button>
          </div>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
            Rejoindre Solivo →
          </Link>
        </p>

        {/* Admin bootstrap */}
        <div className="text-center mt-4">
          <button onClick={() => setShowAdminModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-white/20 hover:text-white/40 transition-colors">
            <Shield size={11} />Accès Admin
          </button>
        </div>
      </motion.div>

      {/* Modal mot de passe oublié */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => { setShowForgot(false); setForgotSent(false); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-black text-lg mb-4">Mot de passe oublié</h2>
            {forgotSent ? (
              <div className="text-center">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-white/70 text-sm">Si ce compte existe, un email vous a été envoyé.</p>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="mt-4 px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl text-sm">OK</button>
              </div>
            ) : (
              <form onSubmit={forgotPassword} className="space-y-4">
                <p className="text-white/50 text-sm">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="votre@email.com"
                  className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <div className="flex gap-3">
                  <button type="submit" disabled={forgotLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl disabled:opacity-60">
                    {forgotLoading ? "..." : "Envoyer"}
                  </button>
                  <button type="button" onClick={() => setShowForgot(false)}
                    className="px-4 py-3 border border-white/10 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Modal bootstrap admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAdminModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <Shield size={18} className="text-emerald-400" />
              <h2 className="text-white font-black text-lg">Promouvoir en Admin</h2>
            </div>
            <p className="text-white/50 text-sm mb-5">
              Entrez l&apos;email du compte à promouvoir. Le compte doit déjà exister.
            </p>
            <form onSubmit={bootstrapAdmin} className="space-y-4">
              <input
                type="email" required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="kenams42@gmail.com"
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
              />
              <div className="flex gap-3">
                <button type="submit" disabled={adminLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl disabled:opacity-60 transition-all">
                  {adminLoading ? "..." : "Promouvoir"}
                </button>
                <button type="button" onClick={() => setShowAdminModal(false)}
                  className="px-4 py-3 border border-white/10 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
