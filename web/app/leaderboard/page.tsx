"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Zap, MapPin, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface LeaderUser {
  id: string; name: string; avatar_url: string; points: number;
  maraudes_count: number; total_donations: number; city: string; role: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHT = ["h-28", "h-36", "h-20"];
const PODIUM_ORDER = [1, 0, 2]; // Silver, Gold, Bronze order on podium

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leaderboard?limit=20").then(d => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero dark */}
      <div className="relative bg-[#060f1e] pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-64 bg-yellow-500/8 rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto px-6 pt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-yellow-500/20 text-yellow-400 text-sm font-semibold mb-6">
            <Sparkles size={13} />Héros de la solidarité
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Classement</h1>
          <p className="text-white/50 text-lg">Les bénévoles les plus actifs ce mois-ci</p>
        </div>

        {/* Podium top 3 */}
        {top3.length >= 3 && (
          <div className="relative max-w-lg mx-auto px-6 mt-12">
            <div className="flex items-end justify-center gap-3">
              {PODIUM_ORDER.map((idx) => {
                const u = top3[idx];
                const isFirst = idx === 0;
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex flex-col items-center flex-1"
                  >
                    {isFirst && <Crown size={20} className="text-yellow-400 mb-1 animate-float" />}
                    <div className={`relative mb-2 ${isFirst ? "w-20 h-20" : "w-14 h-14"}`}>
                      <div className={`w-full h-full rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${
                        isFirst ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-yellow-500/30" :
                        idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-gray-400/30" :
                        "bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-orange-500/30"
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      {isFirst && <div className="absolute inset-0 rounded-2xl glow-emerald opacity-30" />}
                    </div>
                    <div className="text-2xl mb-1">{MEDALS[idx]}</div>
                    <div className="font-black text-white text-sm truncate w-full text-center">{u.name.split(" ")[0]}</div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${isFirst ? "text-yellow-400" : "text-white/50"}`}>
                      <Zap size={11} />{u.points}
                    </div>
                    <div className={`${PODIUM_HEIGHT[idx]} w-full rounded-t-2xl mt-3 ${
                      isFirst ? "bg-gradient-to-t from-yellow-500/30 to-yellow-400/10 border border-yellow-500/20" :
                      idx === 1 ? "bg-gradient-to-t from-gray-500/20 to-gray-400/5 border border-white/10" :
                      "bg-gradient-to-t from-orange-500/20 to-orange-400/5 border border-orange-500/20"
                    }`} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-6 pb-16">
        {/* Liste complète */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          {loading ? (
            <div className="p-10 text-center text-gray-400 animate-pulse">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">🏆</div>
              <p>Soyez le premier sur le classement !</p>
              <Link href="/maraudes" className="mt-4 inline-block px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm">
                Rejoindre une maraude
              </Link>
            </div>
          ) : (
            users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${i < 3 ? "bg-gradient-to-r from-amber-50/50 to-white" : ""}`}
              >
                <div className="w-9 text-center font-black text-lg">
                  {i < 3 ? <span className="text-xl">{MEDALS[i]}</span> : <span className="text-sm text-gray-400">#{i + 1}</span>}
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center font-black text-white shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{u.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    {u.city && <span className="flex items-center gap-1"><MapPin size={10} />{u.city}</span>}
                    <span>🚶 {u.maraudes_count} maraudes</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-600 flex items-center justify-end gap-1">
                    <Zap size={13} className="text-yellow-400" />{u.points.toLocaleString("fr-FR")}
                  </div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Comment gagner des points */}
        <div className="bg-gradient-to-br from-[#060f1e] to-[#0a1f35] rounded-3xl p-7 border border-white/[0.06]">
          <h2 className="font-black text-white mb-5 text-lg flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />Comment gagner des points ?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { action: "Rejoindre une maraude", pts: "+10", emoji: "🚶" },
              { action: "Terminer une maraude", pts: "+50", emoji: "✅" },
              { action: "Signaler un besoin", pts: "+5", emoji: "⚠️" },
              { action: "Faire un don", pts: "+10", emoji: "💙" },
              { action: "Recruter un bénévole", pts: "+20", emoji: "🤝" },
              { action: "Badge débloqué", pts: "varies", emoji: "🏅" },
            ].map(item => (
              <div key={item.action} className="flex items-center justify-between p-3 bg-white/[0.05] rounded-2xl border border-white/[0.06]">
                <span className="text-white/70 text-sm">{item.emoji} {item.action}</span>
                <span className="font-black text-emerald-400 text-sm">{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
