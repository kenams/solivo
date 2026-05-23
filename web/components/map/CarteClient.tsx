"use client";
import { useState } from "react";
import { MapView } from "./MapView";
import { LocationPicker } from "./LocationPicker";
import { Map, Activity } from "lucide-react";

type FilterKey = "maraudes" | "signalements" | "commerces" | "invendus";

const FILTER_DEFS = [
  { key: "maraudes" as FilterKey, label: "Maraudes", emoji: "🚶", active: "bg-blue-500/20 border-blue-400/60 text-blue-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
  { key: "signalements" as FilterKey, label: "Besoins", emoji: "⚠️", active: "bg-orange-500/20 border-orange-400/60 text-orange-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
  { key: "commerces" as FilterKey, label: "Commerces", emoji: "🛒", active: "bg-emerald-500/20 border-emerald-400/60 text-emerald-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
  { key: "invendus" as FilterKey, label: "Invendus", emoji: "♻️", active: "bg-purple-500/20 border-purple-400/60 text-purple-300", inactive: "bg-white/[0.04] border-white/[0.08] text-white/40" },
];

export function CarteClient() {
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    maraudes: true, signalements: true, commerces: true, invendus: true,
  });
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const toggle = (key: FilterKey) => setFilters(f => ({ ...f, [key]: !f[key] }));

  return (
    <div className="pt-16 h-screen flex flex-col bg-[#0d1117]">
      {/* Header bar */}
      <div className="bg-[#0a1628] border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3 shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Map size={14} className="text-emerald-400" />
          </div>
          <span className="text-white/80 font-bold text-sm hidden lg:block">Carte</span>
          <span className="hidden lg:flex items-center gap-1 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            En direct
          </span>
        </div>

        {/* Location picker */}
        <LocationPicker onLocation={({ lat, lng, zoom }) => setFlyTo({ lat, lng, zoom })} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {FILTER_DEFS.map(f => (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${filters[f.key] ? f.active : f.inactive}`}
            >
              <span>{f.emoji}</span>
              <span className="hidden md:inline">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-white/25 text-xs shrink-0">
          <Activity size={12} />
          <span>Zoom molette</span>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <MapView filters={filters} flyTo={flyTo} />
      </div>

      {/* Mobile hint */}
      <div className="md:hidden bg-[#0a1628]/90 backdrop-blur-xl border-t border-white/[0.06] px-4 py-2 flex items-center justify-center">
        <p className="text-white/30 text-xs">Appuyez sur un marqueur pour voir les détails</p>
      </div>
    </div>
  );
}
