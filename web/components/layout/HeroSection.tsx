"use client";
import Link from "next/link";
import { MapPin, Heart, AlertTriangle, Users, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-16 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-green-100 rounded-full blur-3xl opacity-40" />

      <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Plateforme solidaire internationale
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
          Ensemble,<br />
          <span className="text-emerald-500">on change</span><br />
          le quartier.
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          Rejoignez des milliers de bénévoles pour des maraudes, signalez des personnes dans le besoin,
          faites des dons 100% transparents. <strong>Chaque euro traçable.</strong>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/maraudes"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5">
            <Users size={20} />Rejoindre une maraude
            <ArrowRight size={16} />
          </Link>
          <Link href="/don"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 transition-all hover:-translate-y-0.5">
            <Heart size={20} />Faire un don
          </Link>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Link href="/carte" className="group p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="text-blue-500" size={20} />
            </div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm">Carte interactive</h3>
            <p className="text-xs text-gray-500">Maraudes et besoins près de vous</p>
          </Link>

          <Link href="/signalement" className="group p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle className="text-orange-500" size={20} />
            </div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm">Signalement</h3>
            <p className="text-xs text-gray-500">Alertez discrètement</p>
          </Link>

          <Link href="/invendus" className="group p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all text-left">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="text-lg">♻️</span>
            </div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm">Invendus</h3>
            <p className="text-xs text-gray-500">Zéro gaspillage alimentaire</p>
          </Link>

          <Link href="/transparence" className="group p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Heart className="text-purple-500" size={20} />
            </div>
            <h3 className="font-bold text-gray-800 mb-1 text-sm">Transparence</h3>
            <p className="text-xs text-gray-500">Chaque euro tracé</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
