"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Zap, Users, MapPin } from "lucide-react";

interface LeaderUser {
  id: string;
  name: string;
  avatar_url: string;
  points: number;
  maraudes_count: number;
  total_donations: number;
  city: string;
  role: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leaderboard?limit=20").then(d => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-gray-900">Classement solidaire</h1>
          <p className="text-gray-500 mt-1">Les héros de la solidarité ce mois-ci</p>
        </div>

        {/* Podium top 3 */}
        {users.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {/* 2e */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl font-black mx-auto mb-2">
                {users[1].avatar_url ? <img src={users[1].avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : "👤"}
              </div>
              <div className="text-2xl">🥈</div>
              <div className="font-bold text-sm text-gray-800 truncate w-24 mx-auto">{users[1].name}</div>
              <div className="text-xs text-gray-500">⚡ {users[1].points} pts</div>
              <div className="h-16 bg-gray-200 w-20 rounded-t-xl mt-2 mx-auto" />
            </div>
            {/* 1er */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl font-black mx-auto mb-2">
                {users[0].avatar_url ? <img src={users[0].avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : "👤"}
              </div>
              <div className="text-3xl">🥇</div>
              <div className="font-bold text-sm text-gray-800 truncate w-24 mx-auto">{users[0].name}</div>
              <div className="text-xs text-yellow-600 font-bold">⚡ {users[0].points} pts</div>
              <div className="h-24 bg-yellow-200 w-20 rounded-t-xl mt-2 mx-auto" />
            </div>
            {/* 3e */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl font-black mx-auto mb-2">
                {users[2].avatar_url ? <img src={users[2].avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" /> : "👤"}
              </div>
              <div className="text-2xl">🥉</div>
              <div className="font-bold text-sm text-gray-800 truncate w-24 mx-auto">{users[2].name}</div>
              <div className="text-xs text-gray-500">⚡ {users[2].points} pts</div>
              <div className="h-10 bg-orange-200 w-20 rounded-t-xl mt-2 mx-auto" />
            </div>
          </div>
        )}

        {/* Liste complète */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">Chargement...</div>
          ) : (
            users.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 ${i < 3 ? "bg-gradient-to-r from-yellow-50 to-white" : ""}`}>
                <div className="w-8 text-center font-black text-gray-400">
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 truncate">{u.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {u.city && <span className="flex items-center gap-1"><MapPin size={10} />{u.city}</span>}
                    <span>🚶 {u.maraudes_count} maraudes</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-600 flex items-center gap-1">
                    <Zap size={14} />{u.points}
                  </div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment gagner des points */}
        <div className="mt-8 bg-emerald-50 rounded-2xl p-6">
          <h2 className="font-bold text-emerald-800 mb-4">Comment gagner des points ?</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { action: "Rejoindre une maraude", pts: "+10" },
              { action: "Terminer une maraude", pts: "+50" },
              { action: "Signaler un besoin", pts: "+5" },
              { action: "Faire un don", pts: "+10" },
              { action: "Recruter un bénévole", pts: "+20" },
              { action: "Badge débloqué", pts: "varies" },
            ].map(item => (
              <div key={item.action} className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-gray-700">{item.action}</span>
                <span className="font-bold text-emerald-600">{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
