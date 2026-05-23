"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Heart, Shield, Eye, RefreshCw, Zap, Info } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const AMOUNTS = [5, 10, 20, 50, 100];
const CONTRIBUTION_OPTIONS = [
  { pct: 0, label: "0% — Je ne contribue pas" },
  { pct: 3, label: "3% — Contribution suggérée" },
  { pct: 5, label: "5% — Je soutiens la plateforme" },
  { pct: 10, label: "10% — Je suis généreux·se 💚" },
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
        recurring,
        anonymous,
        message,
        contribution_percent: contributionPct,
      });
      window.location.href = data.url;
    } catch {
      toast.error("Erreur lors de la création du paiement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💚</div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Faire un don</h1>
          <p className="text-gray-500 text-lg">Chaque euro est tracé. Vous verrez exactement comment votre don a aidé.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <Shield size={16} />, text: "Paiement sécurisé" },
            { icon: <Eye size={16} />, text: "100% transparent" },
            { icon: <Zap size={16} />, text: "Impact immédiat" },
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm text-sm text-gray-600">
              <span className="text-emerald-500">{g.icon}</span>{g.text}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choisissez un montant</label>
            <div className="grid grid-cols-5 gap-2">
              {AMOUNTS.map(a => (
                <button key={a}
                  onClick={() => { setAmount(a); setCustom(""); }}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${amount === a && !custom ? "bg-emerald-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-emerald-100"}`}>
                  {a}€
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ou saisissez un montant</label>
            <div className="relative">
              <input type="number" min="1" placeholder="Autre montant..."
                value={custom}
                onChange={e => { setCustom(e.target.value); setAmount(0); }}
                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>

          {/* Contribution volontaire Helloasso-style */}
          <div className="mb-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-emerald-500" />
              <span className="text-sm font-semibold text-gray-700">Soutenir Solivo</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Optionnel</span>
            </div>
            <p className="text-xs text-gray-500 mb-3 flex items-start gap-1">
              <Info size={12} className="mt-0.5 shrink-0" />
              Solivo est gratuit pour les associations. Ajoutez une contribution pour couvrir nos frais. L&apos;association reçoit 100% de votre don.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONTRIBUTION_OPTIONS.map(opt => (
                <button key={opt.pct}
                  onClick={() => setContributionPct(opt.pct)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all text-left ${contributionPct === opt.pct ? "bg-emerald-500 text-white" : "bg-white text-gray-600 hover:bg-emerald-100 border border-gray-200"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
              <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-700">
                  <RefreshCw size={14} className="text-emerald-500" />Don mensuel
                </div>
                <p className="text-xs text-gray-500">Annulable à tout moment</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              <div>
                <div className="font-medium text-gray-700">Don anonyme</div>
                <p className="text-xs text-gray-500">Votre nom ne sera pas affiché</p>
              </div>
            </label>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Message (optionnel)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Un mot d'encouragement pour les bénévoles..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 text-sm"
              rows={2}
            />
          </div>

          {/* Récap total */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Don à l&apos;association</span>
              <span className="font-semibold">{finalAmount || 0}€</span>
            </div>
            {contributionPct > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Contribution Solivo ({contributionPct}%)</span>
                <span className="font-semibold">+{platformFee.toFixed(2)}€</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="font-semibold text-gray-700">{recurring ? "Total mensuel" : "Total"}</span>
              <span className="text-2xl font-black text-emerald-600">{totalAmount.toFixed(2)}€{recurring ? "/mois" : ""}</span>
            </div>
          </div>

          <button onClick={handleDon} disabled={loading || !finalAmount}
            className="w-full py-4 bg-emerald-500 text-white font-bold text-lg rounded-2xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Heart size={20} />
            {loading ? "Redirection..." : `Donner ${contributionPct > 0 ? totalAmount.toFixed(2) : finalAmount}€`}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Paiement sécurisé par Stripe · <Link href="/transparence" className="text-emerald-500">Voir comment les dons sont utilisés</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
