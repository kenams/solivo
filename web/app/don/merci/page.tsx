"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MerciContent() {
  const params = useSearchParams();
  const session = params.get("session_id");
  return (
    <div className="pt-24 pb-16 min-h-screen bg-emerald-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Merci pour votre don !</h1>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Votre générosité va directement aider des personnes dans le besoin. Vous recevrez un suivi complet de l'utilisation de votre don.
        </p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 mb-8">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">1</div>
            <div>
              <div className="font-medium text-gray-800">Confirmation email envoyée</div>
              <div className="text-sm text-gray-500">Vérifiez votre boîte mail</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-left mt-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">2</div>
            <div>
              <div className="font-medium text-gray-800">Suivi en temps réel</div>
              <div className="text-sm text-gray-500">Voyez l'impact de votre don sur la page Transparence</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/transparence" className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">
            Voir l'impact
          </Link>
          <Link href="/maraudes" className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
            Rejoindre une maraude
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DonMerciPage() {
  return <Suspense><MerciContent /></Suspense>;
}
