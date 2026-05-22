"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getUser, logout } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Users, Heart, Shield, LogOut, ChevronRight, Award } from "lucide-react";

interface User {
  id: string; name: string; email: string; role: string; points: number;
  maraudes_count: number; total_donations: number; city: string;
  badges: { badge_key: string; name: string; icon: string; description: string }[];
}

const LEVEL_THRESHOLDS = [
  { min: 0, label: "Débutant solidaire", color: "text-gray-500" },
  { min: 50, label: "Bénévole actif", color: "text-green-600" },
  { min: 200, label: "Héros de quartier", color: "text-blue-600" },
  { min: 500, label: "Ambassadeur solidaire", color: "text-purple-600" },
  { min: 1000, label: "Légende de la rue", color: "text-yellow-600" },
];

function getLevel(points: number) {
  return [...LEVEL_THRESHOLDS].reverse().find(l => points >= l.min) || LEVEL_THRESHOLDS[0];
}

function getNextLevel(points: number) {
  return LEVEL_THRESHOLDS.find(l => l.min > points);
}

export default function ProfilPage() {
  const router = useRouter();
  const localUser = getUser();
  const [user, setUser] = useState<User | null>(null);
  const [myMaraudes, setMyMaraudes] = useState<{ id: string; title: string; date_start: string; status: string }[]>([]);

  useEffect(() => {
    if (!localUser) { router.push("/connexion"); return; }
    api.get("/auth/me").then(data => {
      setUser(data);
    });
    api.get("/maraudes?limit=10").then(d => setMyMaraudes(d.maraudes || []));
  }, []);

  if (!user) return <div className="pt-24 text-center text-gray-400 animate-pulse">Chargement...</div>;

  const level = getLevel(user.points);
  const nextLevel = getNextLevel(user.points);
  const pctToNext = nextLevel ? Math.min(100, ((user.points - (getLevel(user.points)?.min || 0)) / (nextLevel.min - (getLevel(user.points)?.min || 0))) * 100) : 100;

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar profil */}
          <div className="space-y-4">
            {/* Avatar + identité */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-3xl font-black text-white mx-auto mb-3">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-xl font-black text-gray-900">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className={`inline-block mt-2 text-sm font-bold ${level.color}`}>{level.label}</span>
              <div className="mt-1 text-xs text-gray-400 bg-gray-100 inline-block px-2 py-0.5 rounded-full uppercase tracking-wide">{user.role}</div>

              {/* Barre de progression niveau */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>⚡ {user.points} pts</span>
                  {nextLevel && <span>→ {nextLevel.min} pts</span>}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pctToNext}%` }} />
                </div>
                {nextLevel && <p className="text-xs text-gray-400 mt-1">{nextLevel.min - user.points} pts pour "{nextLevel.label}"</p>}
              </div>

              {user.city && <p className="text-sm text-gray-500 mt-3">📍 {user.city}</p>}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-700 mb-3 text-sm">Mon impact</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 text-sm"><Users size={14} className="text-emerald-500" />Maraudes</div>
                  <span className="font-black text-gray-900">{user.maraudes_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 text-sm"><Heart size={14} className="text-red-400" />Dons totaux</div>
                  <span className="font-black text-gray-900">{((user.total_donations || 0) / 100).toFixed(0)}€</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 text-sm"><Zap size={14} className="text-yellow-500" />Points</div>
                  <span className="font-black text-gray-900">{user.points}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 text-sm"><Award size={14} className="text-purple-500" />Badges</div>
                  <span className="font-black text-gray-900">{user.badges?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {[
                { href: "/maraudes", label: "Voir les maraudes", emoji: "🚶" },
                { href: "/don", label: "Faire un don", emoji: "💙" },
                { href: "/signalement", label: "Signaler un besoin", emoji: "⚠️" },
                { href: "/leaderboard", label: "Classement", emoji: "🏆" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition">
                  <span className="text-sm text-gray-700">{item.emoji} {item.label}</span>
                  <ChevronRight size={14} className="text-gray-300" />
                </Link>
              ))}
            </div>

            <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition text-sm font-medium">
              <LogOut size={14} />Se déconnecter
            </button>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={18} className="text-purple-500" />Mes badges ({user.badges?.length || 0})
              </h2>
              {user.badges?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🏅</div>
                  <p>Participez à une maraude pour débloquer votre premier badge !</p>
                  <Link href="/maraudes" className="mt-3 inline-block px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm">Voir les maraudes</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {user.badges.map(b => (
                    <div key={b.badge_key} className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 text-center">
                      <div className="text-3xl mb-1">{b.icon}</div>
                      <div className="font-bold text-sm text-gray-800">{b.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{b.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Badges à débloquer */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h2 className="font-bold text-gray-600 mb-4 text-sm">🔒 Badges à débloquer</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: "🌟", name: "Première Maraude", desc: "Participer à 1 maraude", pts: "50 pts" },
                  { icon: "🏅", name: "Bénévole Confirmé", desc: "5 maraudes effectuées", pts: "250 pts" },
                  { icon: "🏆", name: "Héros de la Rue", desc: "20 maraudes effectuées", pts: "1000 pts" },
                  { icon: "💙", name: "Donateur Solidaire", desc: "Plus de 10€ donnés", pts: "+10 pts" },
                  { icon: "💎", name: "Grand Bienfaiteur", desc: "Plus de 100€ donnés", pts: "+50 pts" },
                  { icon: "⚡", name: "Impact Réel", desc: "100 points d'impact", pts: "100 pts" },
                ].filter(b => !user.badges?.find(ub => ub.icon === b.icon)).map(b => (
                  <div key={b.name} className="p-3 bg-white rounded-xl border border-gray-200 text-center opacity-60">
                    <div className="text-2xl mb-1 grayscale">{b.icon}</div>
                    <div className="font-medium text-xs text-gray-600">{b.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />Sécurité du compte
              </h2>
              <p className="text-sm text-gray-500 mb-3">Vos données personnelles sont protégées conformément au RGPD.</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Aucune donnée vendue à des tiers</p>
                <p>• Signalements anonymisables</p>
                <p>• Suppression de compte disponible sur demande</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
