"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, ChevronDown, Search, Loader2, X } from "lucide-react";

interface LocationResult { lat: number; lng: number; zoom: number; label: string }

interface Dept { code: string; nom: string }
interface Ville { code: string; nom: string; centre: { coordinates: [number, number] } }
interface BANResult { properties: { label: string; x: number; y: number; citycode: string } }

export function LocationPicker({ onLocation }: { onLocation: (r: LocationResult) => void }) {
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState<Dept | null>(null);
  const [ville, setVille] = useState<Ville | null>(null);
  const [label, setLabel] = useState("");

  const [depts, setDepts] = useState<Dept[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [adresses, setAdresses] = useState<BANResult[]>([]);

  const [loadingVilles, setLoadingVilles] = useState(false);
  const [loadingAdresses, setLoadingAdresses] = useState(false);
  const [adresseQ, setAdresseQ] = useState("");
  const [adresseOpen, setAdresseOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load departments on mount
  useEffect(() => {
    fetch("https://geo.api.gouv.fr/departements?fields=nom,code&limit=110")
      .then(r => r.json())
      .then((d: Dept[]) => setDepts(d.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))))
      .catch(() => {});
  }, []);

  // Load cities when dept changes
  useEffect(() => {
    if (!dept) return;
    setVilles([]); setVille(null); setAdresseQ(""); setAdresses([]);
    setLoadingVilles(true);
    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=nom,code,centre&boost=population&limit=300`)
      .then(r => r.json())
      .then((d: Ville[]) => setVilles(d.sort((a, b) => a.nom.localeCompare(b.nom))))
      .catch(() => {})
      .finally(() => setLoadingVilles(false));

    // Fly to dept level
    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=centre&boost=population&limit=1`)
      .then(r => r.json())
      .then((d: Ville[]) => {
        if (d[0]?.centre) {
          const [lng, lat] = d[0].centre.coordinates;
          onLocation({ lat, lng, zoom: 9, label: dept.nom });
        }
      }).catch(() => {});
  }, [dept]);

  // Fly to city
  useEffect(() => {
    if (!ville?.centre) return;
    setAdresseQ(""); setAdresses([]);
    const [lng, lat] = ville.centre.coordinates;
    onLocation({ lat, lng, zoom: 13, label: ville.nom });
  }, [ville]);

  // BAN address search
  const searchAdresse = useCallback((q: string) => {
    if (!ville || q.trim().length < 3) { setAdresses([]); return; }
    setLoadingAdresses(true);
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&citycode=${ville.code}&limit=6&type=housenumber,street`)
      .then(r => r.json())
      .then((d: { features: BANResult[] }) => { setAdresses(d.features ?? []); setAdresseOpen(true); })
      .catch(() => {})
      .finally(() => setLoadingAdresses(false));
  }, [ville]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAdresse(adresseQ), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [adresseQ, searchAdresse]);

  const pickAdresse = (a: BANResult) => {
    const { label: lbl, x: lng, y: lat } = a.properties;
    setAdresseQ(lbl); setAdresseOpen(false); setAdresses([]);
    setLabel(lbl);
    onLocation({ lat, lng, zoom: 17, label: lbl });
  };

  const reset = () => {
    setDept(null); setVille(null); setAdresseQ(""); setAdresses([]);
    setLabel(""); setOpen(false);
  };

  // Close panel on outside click
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
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
          open || currentLabel
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : "bg-white/[0.06] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
        }`}
      >
        <MapPin size={14} />
        <span className="hidden sm:inline max-w-[140px] truncate">
          {currentLabel ?? "Zone de recherche"}
        </span>
        {currentLabel
          ? <X size={13} onClick={(e) => { e.stopPropagation(); reset(); }} className="hover:text-white/80" />
          : <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        }
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-[#0f1e32]/98 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl z-[2000] p-4 space-y-3">

          {/* Pays — fixed */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Pays</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white/70 text-sm">
              🇫🇷 France
            </div>
          </div>

          {/* Département */}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Département</label>
            <div className="relative">
              <select
                value={dept?.code ?? ""}
                onChange={e => {
                  const d = depts.find(d => d.code === e.target.value) ?? null;
                  setDept(d);
                }}
                className="w-full appearance-none px-3 py-2 pr-8 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="" className="bg-[#0f1e32]">Choisir un département...</option>
                {depts.map(d => (
                  <option key={d.code} value={d.code} className="bg-[#0f1e32]">{d.code} — {d.nom}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Ville */}
          {dept && (
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1 block">
                Ville / Commune
                {loadingVilles && <Loader2 size={10} className="inline ml-1 animate-spin" />}
              </label>
              <div className="relative">
                <select
                  value={ville?.code ?? ""}
                  onChange={e => {
                    const v = villes.find(v => v.code === e.target.value) ?? null;
                    setVille(v);
                  }}
                  disabled={loadingVilles || villes.length === 0}
                  className="w-full appearance-none px-3 py-2 pr-8 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm outline-none focus:border-emerald-500/50 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <option value="" className="bg-[#0f1e32]">Choisir une ville...</option>
                  {villes.map(v => (
                    <option key={v.code} value={v.code} className="bg-[#0f1e32]">{v.nom}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Adresse / Rue */}
          {ville && (
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1 block">Adresse / Rue</label>
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
                    placeholder={`Rue, n° dans ${ville.nom}...`}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none min-w-0"
                  />
                  {adresseQ && (
                    <button onClick={() => { setAdresseQ(""); setAdresses([]); }} className="text-white/30 hover:text-white/60 shrink-0">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* BAN suggestions */}
                {adresseOpen && adresses.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-[#0f1e32]/98 border border-white/[0.1] rounded-xl shadow-xl overflow-hidden z-10">
                    {adresses.map((a, i) => (
                      <button
                        key={i}
                        onClick={() => pickAdresse(a)}
                        className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-white/[0.07] transition-colors text-left"
                      >
                        <MapPin size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/75 text-xs leading-snug hover:text-white transition-colors">{a.properties.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirm / Close */}
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-xl transition-all"
          >
            Voir sur la carte
          </button>
        </div>
      )}
    </div>
  );
}
