"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, X, Search, Loader2, Check } from "lucide-react";

interface GeoResult { lat: number; lng: number; zoom: number; label: string }
interface Dept { code: string; nom: string }
interface Ville { code: string; nom: string; centre: { coordinates: [number, number] } }
interface BANFeature { geometry: { coordinates: [number, number] }; properties: { label: string } }

export function LocationPicker({ onLocation }: { onLocation: (r: GeoResult) => void }) {
  const [open,   setOpen]   = useState(false);
  const [dept,   setDept]   = useState<Dept | null>(null);
  const [ville,  setVille]  = useState<Ville | null>(null);
  const [adresse,setAdresse]= useState("");

  const [depts,       setDepts]       = useState<Dept[]>([]);
  const [villes,      setVilles]      = useState<Ville[]>([]);
  const [suggestions, setSuggestions] = useState<BANFeature[]>([]);

  const [loadingD, setLoadingD] = useState(false);
  const [loadingV, setLoadingV] = useState(false);
  const [loadingA, setLoadingA] = useState(false);

  const [qDept,  setQDept]  = useState("");
  const [qVille, setQVille] = useState("");
  const [qAdr,   setQAdr]   = useState("");

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Load departments once
  useEffect(() => {
    setLoadingD(true);
    fetch("https://geo.api.gouv.fr/departements?fields=nom,code&limit=110")
      .then(r => r.json())
      .then((d: Dept[]) => setDepts(d.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))))
      .catch(() => {})
      .finally(() => setLoadingD(false));
  }, []);

  // Load cities when dept changes
  useEffect(() => {
    if (!dept) return;
    setVilles([]); setVille(null); setQVille(""); setQAdr(""); setSuggestions([]);
    setLoadingV(true);
    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=nom,code,centre&boost=population&limit=500`)
      .then(r => r.json())
      .then((d: Ville[]) => setVilles(d.sort((a, b) => a.nom.localeCompare(b.nom))))
      .catch(() => {})
      .finally(() => setLoadingV(false));
    // Fly to dept center
    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=centre&boost=population&limit=1`)
      .then(r => r.json())
      .then((d: Ville[]) => {
        if (d[0]?.centre) {
          const [lng, lat] = d[0].centre.coordinates;
          onLocation({ lat, lng, zoom: 9, label: dept.nom });
        }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  // Fly to city when selected
  useEffect(() => {
    if (!ville?.centre) return;
    const [lng, lat] = ville.centre.coordinates;
    onLocation({ lat, lng, zoom: 13, label: ville.nom });
    setQAdr(""); setSuggestions([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // BAN address search
  const searchBAN = useCallback((q: string) => {
    if (!ville || q.trim().length < 3) { setSuggestions([]); return; }
    setLoadingA(true);
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&citycode=${ville.code}&limit=5`)
      .then(r => r.json())
      .then((d: { features: BANFeature[] }) => setSuggestions(d.features ?? []))
      .catch(() => {})
      .finally(() => setLoadingA(false));
  }, [ville]);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => searchBAN(qAdr), 350);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [qAdr, searchBAN]);

  // Close on outside click — but NOT when clicking inside the panel
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", h, true); // capture phase
    return () => document.removeEventListener("click", h, true);
  }, []);

  const pickAdresse = (f: BANFeature) => {
    const [lng, lat] = f.geometry.coordinates;
    const lbl = f.properties.label;
    setAdresse(lbl); setQAdr(lbl); setSuggestions([]);
    onLocation({ lat, lng, zoom: 17, label: lbl });
    setOpen(false);
  };

  const reset = () => {
    setDept(null); setVille(null); setAdresse(""); setQDept(""); setQVille(""); setQAdr(""); setSuggestions([]);
  };

  const dFiltered = qDept ? depts.filter(d => d.nom.toLowerCase().includes(qDept.toLowerCase()) || d.code.startsWith(qDept)) : depts;
  const vFiltered = qVille ? villes.filter(v => v.nom.toLowerCase().includes(qVille.toLowerCase())) : villes;

  const label = adresse || ville?.nom || dept?.nom;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
          open || label
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : "bg-white/[0.06] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
        }`}
      >
        <MapPin size={14} />
        <span className="hidden sm:inline max-w-[160px] truncate">{label ?? "Zone de recherche"}</span>
        {label
          ? <X size={13} onClick={e => { e.stopPropagation(); reset(); }} />
          : <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>

      {/* Dropdown panel — stopPropagation empêche la fermeture sur clic intérieur */}
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute top-full mt-2 left-0 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-bold text-gray-800">Localiser une zone</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>

          <div className="p-3 space-y-3">
            {/* Pays */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pays</p>
              <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-500">🇫🇷 France</div>
            </div>

            {/* Département */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Département {loadingD && <Loader2 size={10} className="inline animate-spin ml-1" />}
              </p>
              {dept ? (
                <button
                  onClick={() => { setDept(null); setVille(null); }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"
                >
                  <span><span className="text-emerald-400 mr-1.5">{dept.code}</span>{dept.nom}</span>
                  <div className="flex items-center gap-1">
                    <Check size={13} className="text-emerald-500" />
                    <X size={12} className="text-emerald-400 hover:text-emerald-700" />
                  </div>
                </button>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                    <Search size={13} className="text-gray-400" />
                    <input
                      value={qDept}
                      onChange={e => setQDept(e.target.value)}
                      placeholder="Ex: 75 Paris, Loire..."
                      className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
                    />
                    {qDept && <button onClick={() => setQDept("")}><X size={11} className="text-gray-400" /></button>}
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {dFiltered.map(d => (
                      <button
                        key={d.code}
                        onClick={() => { setDept(d); setQDept(""); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-gray-400 text-xs w-7 shrink-0">{d.code}</span>
                        <span className="text-gray-800">{d.nom}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ville */}
            {dept && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Ville / Commune {loadingV && <Loader2 size={10} className="inline animate-spin ml-1" />}
                </p>
                {ville ? (
                  <button
                    onClick={() => setVille(null)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"
                  >
                    <span>{ville.nom}</span>
                    <div className="flex items-center gap-1"><Check size={13} className="text-emerald-500" /><X size={12} className="text-emerald-400" /></div>
                  </button>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                      <Search size={13} className="text-gray-400" />
                      <input
                        value={qVille}
                        onChange={e => setQVille(e.target.value)}
                        placeholder={loadingV ? "Chargement..." : "Chercher une ville..."}
                        disabled={loadingV}
                        className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
                      />
                      {qVille && <button onClick={() => setQVille("")}><X size={11} className="text-gray-400" /></button>}
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {loadingV
                        ? <p className="text-center text-gray-400 text-sm py-4 flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/>Chargement...</p>
                        : vFiltered.map(v => (
                          <button
                            key={v.code}
                            onClick={() => { setVille(v); setQVille(""); }}
                            className="w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left text-gray-800"
                          >
                            {v.nom}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Adresse */}
            {ville && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Adresse <span className="normal-case text-gray-300 font-normal">(optionnel)</span></p>
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:border-emerald-400">
                    {loadingA ? <Loader2 size={13} className="text-gray-400 animate-spin" /> : <Search size={13} className="text-gray-400" />}
                    <input
                      value={qAdr}
                      onChange={e => setQAdr(e.target.value)}
                      placeholder={`Rue, numéro à ${ville.nom}...`}
                      className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400 min-w-0"
                    />
                    {qAdr && <button onClick={() => { setQAdr(""); setSuggestions([]); }}><X size={12} className="text-gray-400" /></button>}
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => pickAdresse(s)}
                          className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <MapPin size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-xs leading-snug">{s.properties.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all"
            >
              Voir sur la carte ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
