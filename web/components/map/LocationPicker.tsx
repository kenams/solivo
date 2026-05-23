"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Search, Loader2, X, Check } from "lucide-react";

interface LocationResult { lat: number; lng: number; zoom: number; label: string }
interface Dept { code: string; nom: string }
interface Ville { code: string; nom: string; centre: { coordinates: [number, number] } }
interface BANFeature {
  geometry: { coordinates: [number, number] };
  properties: { label: string };
}

type Step = "dept" | "ville" | "adresse" | null;

export function LocationPicker({ onLocation }: { onLocation: (r: LocationResult) => void }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<Step>(null);

  const [dept, setDept] = useState<Dept | null>(null);
  const [ville, setVille] = useState<Ville | null>(null);
  const [adresseLabel, setAdresseLabel] = useState("");

  const [depts, setDepts] = useState<Dept[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [adresses, setAdresses] = useState<BANFeature[]>([]);

  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingAdresses, setLoadingAdresses] = useState(false);

  const [deptQ, setDeptQ] = useState("");
  const [villeQ, setVilleQ] = useState("");
  const [adresseQ, setAdresseQ] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch departments once
  useEffect(() => {
    setLoadingDepts(true);
    fetch("https://geo.api.gouv.fr/departements?fields=nom,code&limit=110")
      .then(r => r.json())
      .then((d: Dept[]) => setDepts(d.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))))
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, []);

  // Fetch cities when dept selected
  useEffect(() => {
    if (!dept) return;
    setVilles([]); setVille(null); setAdresseQ(""); setAdresseLabel(""); setVilleQ("");
    setLoadingVilles(true);
    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=nom,code,centre&boost=population&limit=500`)
      .then(r => r.json())
      .then((d: Ville[]) => setVilles(d.sort((a, b) => a.nom.localeCompare(b.nom))))
      .catch(() => {})
      .finally(() => setLoadingVilles(false));
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

  // Fly to city
  useEffect(() => {
    if (!ville?.centre) return;
    setAdresseQ(""); setAdresseLabel(""); setAdresses([]);
    const [lng, lat] = ville.centre.coordinates;
    onLocation({ lat, lng, zoom: 13, label: ville.nom });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ville]);

  // BAN address search
  const searchAdresse = useCallback((q: string) => {
    if (!ville || q.trim().length < 3) { setAdresses([]); return; }
    setLoadingAdresses(true);
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&citycode=${ville.code}&limit=6`)
      .then(r => r.json())
      .then((d: { features: BANFeature[] }) => setAdresses(d.features ?? []))
      .catch(() => {})
      .finally(() => setLoadingAdresses(false));
  }, [ville]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAdresse(adresseQ), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [adresseQ, searchAdresse]);

  const pickAdresse = (a: BANFeature) => {
    const [lng, lat] = a.geometry.coordinates;
    const lbl = a.properties.label;
    setAdresseLabel(lbl); setAdresseQ(lbl); setAdresses([]);
    onLocation({ lat, lng, zoom: 17, label: lbl });
    setPanelOpen(false); setActiveStep(null);
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDept(null); setVille(null); setAdresseLabel(""); setAdresseQ("");
    setDeptQ(""); setVilleQ(""); setAdresses([]);
    setPanelOpen(false); setActiveStep(null);
  };

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false); setActiveStep(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredDepts = deptQ.trim()
    ? depts.filter(d => d.nom.toLowerCase().includes(deptQ.toLowerCase()) || d.code.includes(deptQ))
    : depts;

  const filteredVilles = villeQ.trim()
    ? villes.filter(v => v.nom.toLowerCase().includes(villeQ.toLowerCase()))
    : villes;

  const currentLabel = adresseLabel || ville?.nom || dept?.nom;

  return (
    <div ref={panelRef} className="relative shrink-0">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setPanelOpen(o => !o); setActiveStep("dept"); }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
          panelOpen || currentLabel
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : "bg-white/[0.06] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
        }`}
      >
        <MapPin size={14} />
        <span className="hidden sm:inline max-w-[160px] truncate">
          {currentLabel ?? "Zone de recherche"}
        </span>
        {currentLabel
          ? <X size={13} onClick={reset} className="hover:text-white/80" />
          : <ChevronDown size={13} className={`transition-transform ${panelOpen ? "rotate-180" : ""}`} />
        }
      </button>

      {/* Panel */}
      {panelOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-[#0d1a2d] border border-white/[0.12] rounded-2xl shadow-2xl z-[2000] p-4 space-y-3">

          {/* Pays — fixed */}
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">Pays</p>
            <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white/50 text-sm">
              🇫🇷 France
            </div>
          </div>

          {/* Département */}
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">
              Département {loadingDepts && <Loader2 size={10} className="inline animate-spin ml-1" />}
            </p>
            {/* Selected display */}
            {dept && activeStep !== "dept" ? (
              <button
                type="button"
                onClick={() => setActiveStep("dept")}
                className="w-full flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm"
              >
                <span><span className="text-emerald-500/70 mr-1.5">{dept.code}</span>{dept.nom}</span>
                <Check size={13} />
              </button>
            ) : (
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                  <Search size={12} className="text-white/40 shrink-0" />
                  <input
                    autoFocus={activeStep === "dept"}
                    value={deptQ}
                    onChange={e => setDeptQ(e.target.value)}
                    placeholder="Ex: 75, Paris, Rhône..."
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
                  />
                  {deptQ && <button type="button" onClick={() => setDeptQ("")}><X size={11} className="text-white/40" /></button>}
                </div>
                <div className="max-h-40 overflow-y-auto overscroll-contain">
                  {filteredDepts.length === 0
                    ? <p className="text-white/30 text-xs px-3 py-2 text-center">Aucun résultat</p>
                    : filteredDepts.map(d => (
                      <button
                        key={d.code}
                        type="button"
                        onMouseDown={e => e.preventDefault()} // empêche le blur de l'input
                        onClick={() => { setDept(d); setDeptQ(""); setActiveStep("ville"); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.08] transition-colors text-left"
                      >
                        <span className="text-white/40 text-xs w-6 shrink-0">{d.code}</span>
                        <span className="text-white/80">{d.nom}</span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Ville */}
          {dept && (
            <div>
              <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">
                Ville / Commune {loadingVilles && <Loader2 size={10} className="inline animate-spin ml-1" />}
              </p>
              {ville && activeStep !== "ville" ? (
                <button
                  type="button"
                  onClick={() => setActiveStep("ville")}
                  className="w-full flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm"
                >
                  <span>{ville.nom}</span>
                  <Check size={13} />
                </button>
              ) : (
                <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                    <Search size={12} className="text-white/40 shrink-0" />
                    <input
                      autoFocus={activeStep === "ville"}
                      value={villeQ}
                      onChange={e => setVilleQ(e.target.value)}
                      placeholder="Rechercher une ville..."
                      disabled={loadingVilles}
                      className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none disabled:opacity-40"
                    />
                    {villeQ && <button type="button" onClick={() => setVilleQ("")}><X size={11} className="text-white/40" /></button>}
                  </div>
                  <div className="max-h-40 overflow-y-auto overscroll-contain">
                    {loadingVilles
                      ? <p className="text-white/30 text-xs px-3 py-3 text-center flex items-center justify-center gap-2"><Loader2 size={12} className="animate-spin" />Chargement...</p>
                      : filteredVilles.length === 0
                      ? <p className="text-white/30 text-xs px-3 py-2 text-center">Aucun résultat</p>
                      : filteredVilles.map(v => (
                        <button
                          key={v.code}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setVille(v); setVilleQ(""); setActiveStep("adresse"); }}
                          className="w-full flex items-center px-3 py-2 text-sm hover:bg-white/[0.08] transition-colors text-left text-white/80"
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
              <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold mb-1.5">Rue / Adresse <span className="normal-case text-white/20">(optionnel)</span></p>
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl focus-within:border-emerald-500/40">
                  {loadingAdresses
                    ? <Loader2 size={13} className="text-white/40 animate-spin shrink-0" />
                    : <Search size={13} className="text-white/40 shrink-0" />
                  }
                  <input
                    autoFocus={activeStep === "adresse"}
                    value={adresseQ}
                    onChange={e => setAdresseQ(e.target.value)}
                    placeholder={`Rue à ${ville.nom}...`}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none min-w-0"
                  />
                  {adresseQ && (
                    <button type="button" onClick={() => { setAdresseQ(""); setAdresses([]); }}>
                      <X size={12} className="text-white/30 hover:text-white/60" />
                    </button>
                  )}
                </div>
                {adresses.length > 0 && (
                  <div className="mt-1 bg-[#0d1a2d] border border-white/[0.12] rounded-xl overflow-hidden shadow-xl">
                    {adresses.map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
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
            onClick={() => { setPanelOpen(false); setActiveStep(null); }}
            className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-xl transition-all"
          >
            Voir sur la carte ↗
          </button>
        </div>
      )}
    </div>
  );
}
