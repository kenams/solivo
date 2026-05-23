"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Search, Loader2, X, Check } from "lucide-react";

interface LocationResult { lat: number; lng: number; zoom: number; label: string }
interface Dept { code: string; nom: string }
interface Ville { code: string; nom: string; centre: { coordinates: [number, number] } }
interface BANFeature {
  geometry: { coordinates: [number, number] }; // [lon, lat] WGS84
  properties: { label: string }
}

// Searchable dropdown — remplace le <select> natif non stylable sur Windows
function SearchableList<T extends { code: string; nom: string }>({
  items, value, placeholder, loading, onSelect, disabled,
}: {
  items: T[];
  value: T | null;
  placeholder: string;
  loading?: boolean;
  onSelect: (item: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = q.trim()
    ? items.filter(i => i.nom.toLowerCase().includes(q.toLowerCase()) || i.code.includes(q))
    : items;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (item: T) => { onSelect(item); setOpen(false); setQ(""); };
  const toggle = () => {
    if (disabled) return;
    setOpen(o => !o);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
          disabled ? "opacity-40 cursor-not-allowed bg-white/[0.04] border-white/[0.06] text-white/40"
          : open ? "bg-white/[0.1] border-emerald-500/50 text-white"
          : "bg-white/[0.06] border-white/[0.1] text-white/80 hover:border-white/20"
        }`}
      >
        <span className="truncate">{value ? `${value.code} — ${value.nom}` : placeholder}</span>
        {loading
          ? <Loader2 size={13} className="animate-spin text-white/40 shrink-0" />
          : <ChevronDown size={13} className={`text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#0d1a2d] border border-white/[0.15] rounded-xl shadow-2xl z-[100] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.06] rounded-lg">
              <Search size={12} className="text-white/40 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 bg-transparent text-white text-xs placeholder-white/30 outline-none"
              />
              {q && <button onClick={() => setQ("")}><X size={11} className="text-white/40" /></button>}
            </div>
          </div>
          {/* List */}
          <div className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0
              ? <p className="text-white/30 text-xs px-3 py-3 text-center">Aucun résultat</p>
              : filtered.map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => pick(item)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-white/[0.07] transition-colors text-left"
                >
                  <span className={value?.code === item.code ? "text-emerald-400" : "text-white/80"}>
                    <span className="text-white/40 text-xs mr-1.5">{item.code}</span>{item.nom}
                  </span>
                  {value?.code === item.code && <Check size={12} className="text-emerald-400 shrink-0" />}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationPicker({ onLocation }: { onLocation: (r: LocationResult) => void }) {
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState<Dept | null>(null);
  const [ville, setVille] = useState<Ville | null>(null);
  const [label, setLabel] = useState("");

  const [depts, setDepts] = useState<Dept[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [adresses, setAdresses] = useState<BANFeature[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingAdresses, setLoadingAdresses] = useState(false);
  const [adresseQ, setAdresseQ] = useState("");
  const [adresseOpen, setAdresseOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Departments
  useEffect(() => {
    setLoadingDepts(true);
    fetch("https://geo.api.gouv.fr/departements?fields=nom,code&limit=110")
      .then(r => r.json())
      .then((d: Dept[]) => setDepts(d.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))))
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, []);

  // Cities when dept changes
  useEffect(() => {
    if (!dept) return;
    setVilles([]); setVille(null); setAdresseQ(""); setAdresses([]);
    setLoadingVilles(true);

    // Fly to dept center
    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=centre&boost=population&limit=1`)
      .then(r => r.json())
      .then((d: Ville[]) => {
        if (d[0]?.centre) {
          const [lng, lat] = d[0].centre.coordinates;
          onLocation({ lat, lng, zoom: 9, label: dept.nom });
        }
      }).catch(() => {});

    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=nom,code,centre&boost=population&limit=500`)
      .then(r => r.json())
      .then((d: Ville[]) => setVilles(d.sort((a, b) => a.nom.localeCompare(b.nom))))
      .catch(() => {})
      .finally(() => setLoadingVilles(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  // Fly to city
  useEffect(() => {
    if (!ville?.centre) return;
    setAdresseQ(""); setAdresses([]);
    const [lng, lat] = ville.centre.coordinates;
    onLocation({ lat, lng, zoom: 13, label: ville.nom });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // BAN address search — coordinates from geometry.coordinates (WGS84), not properties.x/y (Lambert93)
  const searchAdresse = useCallback((q: string) => {
    if (!ville || q.trim().length < 3) { setAdresses([]); return; }
    setLoadingAdresses(true);
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&citycode=${ville.code}&limit=6`)
      .then(r => r.json())
      .then((d: { features: BANFeature[] }) => { setAdresses(d.features ?? []); setAdresseOpen(true); })
      .catch(() => {})
      .finally(() => setLoadingAdresses(false));
  }, [ville]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAdresse(adresseQ), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [adresseQ, searchAdresse]);

  const pickAdresse = (a: BANFeature) => {
    const [lng, lat] = a.geometry.coordinates; // WGS84
    const lbl = a.properties.label;
    setAdresseQ(lbl); setAdresseOpen(false); setAdresses([]);
    setLabel(lbl);
    onLocation({ lat, lng, zoom: 17, label: lbl });
    setOpen(false);
  };

  const reset = () => {
    setDept(null); setVille(null); setAdresseQ(""); setAdresses([]);
    setLabel(""); setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false); setAdresseOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = label || ville?.nom || dept?.nom;

  return (
    <div ref={panelRef} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
          open || currentLabel
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : "bg-white/[0.06] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
        }`}
      >
        <MapPin size={14} />
        <span className="hidden sm:inline max-w-[160px] truncate">
          {currentLabel ?? "Zone de recherche"}
        </span>
        {currentLabel
          ? <button type="button" onClick={e => { e.stopPropagation(); reset(); }}>
              <X size={13} className="hover:text-white/80" />
            </button>
          : <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-[#0d1a2d] border border-white/[0.12] rounded-2xl shadow-2xl z-[2000] p-4 space-y-3">

          {/* Pays */}
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">Pays</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.06] rounded-xl text-white/60 text-sm">
              🇫🇷 France
            </div>
          </div>

          {/* Département */}
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">Département</p>
            <SearchableList
              items={depts}
              value={dept}
              placeholder="Choisir un département..."
              loading={loadingDepts}
              onSelect={setDept}
            />
          </div>

          {/* Ville */}
          {dept && (
            <div>
              <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">Ville / Commune</p>
              <SearchableList
                items={villes}
                value={ville}
                placeholder={loadingVilles ? "Chargement..." : "Choisir une ville..."}
                loading={loadingVilles}
                onSelect={setVille}
                disabled={loadingVilles}
              />
            </div>
          )}

          {/* Adresse / Rue */}
          {ville && (
            <div>
              <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">Adresse / Rue</p>
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl focus-within:border-emerald-500/50 transition-colors">
                  {loadingAdresses
                    ? <Loader2 size={13} className="text-white/40 animate-spin shrink-0" />
                    : <Search size={13} className="text-white/40 shrink-0" />
                  }
                  <input
                    value={adresseQ}
                    onChange={e => setAdresseQ(e.target.value)}
                    onFocus={() => adresses.length > 0 && setAdresseOpen(true)}
                    placeholder={`Rue, numéro à ${ville.nom}...`}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none min-w-0"
                  />
                  {adresseQ && (
                    <button type="button" onClick={() => { setAdresseQ(""); setAdresses([]); }}>
                      <X size={12} className="text-white/30 hover:text-white/60" />
                    </button>
                  )}
                </div>

                {adresseOpen && adresses.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-[#0d1a2d] border border-white/[0.12] rounded-xl shadow-xl overflow-hidden z-10">
                    {adresses.map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pickAdresse(a)}
                        className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-white/[0.07] transition-colors text-left"
                      >
                        <MapPin size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/80 text-xs leading-snug">{a.properties.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-xl transition-all"
          >
            Voir sur la carte ↗
          </button>
        </div>
      )}
    </div>
  );
}
