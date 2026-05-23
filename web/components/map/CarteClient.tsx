"use client";
import { useState } from "react";
import { MapView } from "./MapView";
import { Map, Activity } from "lucide-react";

type FilterKey = "maraudes" | "signalements" | "commerces" | "invendus";

interface FilterDef {
  key: FilterKey;
  label: string;
  emoji: string;
  active: string;
  inactive: string;
}

const FILTER_DEFS: FilterDef[] = [
  { key: "maraudes", label: "Maraudes", emoji: "🚶", active: "bg-blue-500/20 border-blue-400/60 text-blue-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
  { key: "signalements", label: "Besoins", emoji: "⚠️", active: "bg-orange-500/20 border-orange-400/60 text-orange-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
  { key: "commerces", label: "Commerces", emoji: "🛒", active: "bg-emerald-500/20 border-emerald-400/60 text-emerald-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
  { key: "invendus", label: "Invendus", emoji: "♻️", active: "bg-purple-500/20 border-purple-400/60 text-purple-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
];

export function CarteClient() {
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    maraudes: true, signalements: true, commerces: true, invendus: true,
  });

  const toggle = (key: FilterKey) => setFilters(f => ({ ...f, [key]: !f[key] }));

  return (
    <div className="pt-16 h-screen flex flex-col bg-[#0d1117]">
      {/* Header bar */}
      <div className="bg-[#0a1628]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Map size={14} className="text-emerald-400" />
          </div>
          <span className="text-white/80 font-bold text-sm hidden sm:block">Carte interactive</span>
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="hidden sm:inline">En direct</span>
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTER_DEFS.map(f => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${filters[f.key] ? f.active : f.inactive}`}
            >
              <span>{f.emoji}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-white/30 text-xs shrink-0">
          <Activity size={12} />
          <span>Zoom molette</span>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <MapView filters={filters} />
      </div>

      {/* Mobile hint */}
      <div className="md:hidden bg-[#0a1628]/90 backdrop-blur-xl border-t border-white/[0.06] px-4 py-2 flex items-center justify-center">
        <p className="text-white/30 text-xs">Appuyez sur un marqueur pour voir les détails</p>
      </div>
    </div>
  );
}
