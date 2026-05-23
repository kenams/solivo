"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Heart, Shield, Eye, RefreshCw, Zap, Info, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

const AMOUNTS = [5, 10, 20, 50, 100];
const CONTRIBUTION_OPTIONS = [
  { pct: 0, label: "0%", sub: "Pas de contribution" },
  { pct: 3, label: "3%", sub: "Suggérée" },
  { pct: 5, label: "5%", sub: "Je soutiens" },
  { pct: 10, label: "10%", sub: "Je suis généreux 💚" },
];

export default function DonPage() {
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [contributionPct, setContributionPct] = useState(3);
  const [loading, setLoading] = useState(false);

  const finalAmount = custom ? parseFloat(custom) : amount;
  const platformFee = Math.round(finalAmount * contributionPct / 100 * 100) / 100;
  const totalAmount = finalAmount + platformFee;

  async function handleDon() {
    if (!finalAmount || finalAmount < 1) return toast.error("Montant minimum : 1€");
    setLoading(true);
    try {
      const data = await api.post("/donations/checkout", {
        amount: Math.round(finalAmount * 100),
        recurring, anonymous, message,
        contribution_percent: contributionPct,
      });
      window.location.href = data.url;
    } catch {
      toast.error("Erreur lors de la création du paiement");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero band */}
      <div className="relative bg-[#060f1e] py-16 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center px-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            <Sparkles size={13} />Paiement 100% sécurisé par Stripe
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Faire un don</h1>
          <p className="text-white/50 text-lg">Chaque euro est tracé. Vous verrez exactement comment votre don a aidé.</p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <Shield size={15} />, text: "Paiement sécurisé" },
            { icon: <Eye size={15} />, text: "100% transparent" },
            { icon: <Zap size={15} />, text: "Impact immédiat" },
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-600 font-medium">
              <span className="text-emerald-500">{g.icon}</span>{g.text}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-8">
            {/* Montants */}
            <div className="mb-7">
              <label className="block text-sm font-bold text-gray-700 mb-3">Choisissez un montant</label>
              <div className="grid grid-cols-5 gap-2">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => { setAmount(a); setCustom(""); }}
                    className={`py-3.5 rounded-2xl font-black text-sm transition-all duration-200 ${
                      amount === a && !custom
                        ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-100"
                    }`}>
                    {a}€
                  </button>
                ))}
              </div>
            </div>

            {/* Montant custom */}
            <div className="mb-7">
              <label className="block text-sm font-bold text-gray-700 mb-2">Ou saisissez un montant</label>
              <div className="relative">
                <input type="number" min="1" placeholder="Montant libre..."
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setAmount(0); }}
                  className="w-full px-5 py-3.5 pr-10 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-gray-800 text-lg font-semibold bg-gray-50 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
              </div>
            </div>

            {/* Contribution Solivo */}
            <div className="mb-7 rounded-2xl overflow-hidden border border-emerald-100">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={15} className="text-emerald-500" />
                  <span className="text-sm font-black text-gray-800">Soutenir Solivo</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Optionnel</span>
                </div>
                <p className="text-xs text-gray-500 flex items-start gap-1.5">
                  <Info size={11} className="mt-0.5 shrink-0 text-emerald-500" />
                  Solivo est gratuit pour les associations. L&apos;association reçoit 100% de votre don.
                </p>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-4 gap-2">
                  {CONTRIBUTION_OPTIONS.map(opt => (
                    <button key={opt.pct} onClick={() => setContributionPct(opt.pct)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl text-xs transition-all duration-200 ${
                        contributionPct === opt.pct
                          ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-500/30"
                          : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-100"
                      }`}>
                      <span className="font-black text-sm">{opt.label}</span>
                      <span className={`text-xs mt-0.5 ${contributionPct === opt.pct ? "text-white/80" : "text-gray-400"}`}>{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-7">
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="relative">
                  <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${recurring ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                    {recurring && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                    <RefreshCw size={14} className="text-emerald-500" />Don mensuel
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Annulable à tout moment</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="relative">
                  <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${anonymous ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                    {anonymous && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">Don anonyme</div>
                  <p className="text-xs text-gray-400 mt-0.5">Votre nom ne sera pas affiché</p>
                </div>
              </label>
            </div>

            {/* Message */}
            <div className="mb-7">
              <label className="block text-sm font-bold text-gray-700 mb-2">Message (optionnel)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Un mot d'encouragement pour les bénévoles..."
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent text-gray-800 text-sm bg-gray-50 transition-all"
                rows={2}
              />
            </div>

            {/* Récap */}
            <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-2xl p-5 mb-6 border border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Don à l&apos;association</span>
                  <span className="font-bold">{finalAmount || 0}€</span>
                </div>
                {contributionPct > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Contribution Solivo ({contributionPct}%)</span>
                    <span className="font-bold">+{platformFee.toFixed(2)}€</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-700">{recurring ? "Total mensuel" : "Total"}</span>
                  <span className="text-3xl font-black text-gray-900">{totalAmount.toFixed(2)}€{recurring ? <span className="text-base text-gray-400">/mois</span> : ""}</span>
                </div>
              </div>
            </div>

            <button onClick={handleDon} disabled={loading || !finalAmount}
              className="btn-primary w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span>Redirection...</span>
              ) : (
                <><Heart size={20} />Donner {contributionPct > 0 ? totalAmount.toFixed(2) : finalAmount}€{recurring ? "/mois" : ""}<ArrowRight size={18} /></>
              )}
            </button>
          </div>

          <div className="px-8 pb-6 text-center text-xs text-gray-400">
            Paiement sécurisé par Stripe ·{" "}
            <Link href="/transparence" className="text-emerald-500 hover:underline">Voir comment les dons sont utilisés</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
