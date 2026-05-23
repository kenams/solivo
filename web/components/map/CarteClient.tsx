"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MapView } from "./MapView";
import { Map, Activity, Search, X, Loader2, MapPin } from "lucide-react";

type FilterKey = "maraudes" | "signalements" | "commerces" | "invendus";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

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

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (key: FilterKey) => setFilters(f => ({ ...f, [key]: !f[key] }));

  const search = useCallback((q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=fr,be,ch,lu`, {
      headers: { "Accept-Language": "fr" },
    })
      .then(r => r.json())
      .then((data: NominatimResult[]) => { setResults(data); setOpen(true); })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const pick = (r: NominatimResult) => {
    setQuery(r.display_name.split(",").slice(0, 2).join(",").trim());
    setOpen(false);
    setResults([]);
    setFlyTo({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), zoom: 15 });
  };

  const clear = () => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); };

  return (
    <div className="pt-16 h-screen flex flex-col bg-[#0d1117]">
      {/* Header bar */}
      <div className="bg-[#0a1628]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3 shrink-0">

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

        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.07] border border-white/[0.1] rounded-xl focus-within:border-emerald-500/50 focus-within:bg-white/[0.09] transition-all">
            {searching
              ? <Loader2 size={14} className="text-white/40 animate-spin shrink-0" />
              : <Search size={14} className="text-white/40 shrink-0" />
            }
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              placeholder="Rechercher une adresse, ville..."
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none min-w-0"
            />
            {query && (
              <button onClick={clear} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {open && results.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#0f1e32]/98 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-[2000]">
              {results.map(r => (
                <button
                  key={r.place_id}
                  onClick={() => pick(r)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <MapPin size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/80 text-xs leading-relaxed group-hover:text-white transition-colors line-clamp-2">
                    {r.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

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
