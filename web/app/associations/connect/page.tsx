"use client";
import { useState, useEffect, Suspense } from "react";
import { api } from "@/lib/api";
import { CheckCircle, AlertCircle, ArrowRight, Banknote, Shield, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

function ConnectContent() {
  const [associationId, setAssociationId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "checking">("idle");
  const [connectStatus, setConnectStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("association_id");
    if (id) {
      setAssociationId(id);
      checkStatus(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function checkStatus(id: string) {
    try {
      setStatus("checking");
      const data = await api.get(`/associations/${id}/connect/status`);
      setConnectStatus(data.status);
    } catch {
      // ignore
    } finally {
      setStatus("idle");
    }
  }

  async function handleOnboarding() {
    if (!associationId) return toast.error("ID association requis");
    setStatus("loading");
    try {
      const data = await api.post(`/associations/${associationId}/connect/onboarding`, {});
      window.location.href = data.url;
    } catch {
      toast.error("Erreur lors de la connexion Stripe");
      setStatus("idle");
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      {connectStatus === "active" ? (
        <div className="text-center py-8">
          <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte connecté !</h2>
          <p className="text-gray-500">Votre association est prête à recevoir des dons. Les virements sont automatiques.</p>
        </div>
      ) : (
        <>
          {connectStatus === "onboarding" && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <AlertCircle size={20} className="text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">Votre compte est en cours de vérification. Complétez l&apos;onboarding Stripe pour activer les paiements.</p>
            </div>
          )}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">ID de votre association</label>
            <input
              type="text"
              placeholder="ex: abc123-..."
              value={associationId}
              onChange={e => setAssociationId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800"
            />
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm">Ce qui vous sera demandé :</h3>
            {["SIRET / numéro d'association", "IBAN du compte bancaire", "Pièce d'identité du représentant légal"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-emerald-500" />{item}
              </div>
            ))}
          </div>
          <button onClick={handleOnboarding} disabled={status === "loading" || !associationId}
            className="w-full py-4 bg-emerald-500 text-white font-bold text-lg rounded-2xl hover:bg-emerald-600 transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {status === "loading" ? "Redirection..." : (
              <>Connecter mon compte bancaire <ArrowRight size={20} /></>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">Powered by Stripe Connect · Vos données sont sécurisées</p>
        </>
      )}
    </div>
  );
}

export default function ConnectPage() {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏦</div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Recevoir des dons</h1>
          <p className="text-gray-500 text-lg">Connectez votre compte bancaire pour recevoir les dons directement.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <Shield size={16} />, text: "Sécurisé par Stripe" },
            { icon: <Banknote size={16} />, text: "100% du don pour vous" },
            { icon: <Zap size={16} />, text: "Virement sous 2 jours" },
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm text-sm text-gray-600">
              <span className="text-emerald-500">{g.icon}</span>{g.text}
            </div>
          ))}
        </div>
        <Suspense fallback={<div className="bg-white rounded-3xl p-8 text-center text-gray-400">Chargement...</div>}>
          <ConnectContent />
        </Suspense>
      </div>
    </div>
  );
}
