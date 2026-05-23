import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ConnectSuccessPage() {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <CheckCircle size={80} className="text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-gray-900 mb-3">Compte connecté !</h1>
        <p className="text-gray-500 mb-8">
          Votre association peut maintenant recevoir des dons directement sur son compte bancaire.
          Stripe vérifie votre dossier sous 24-48h.
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 py-3 px-6 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
