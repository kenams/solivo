"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Navigation, X, Users, Calendar, AlertTriangle, ShoppingBag, ArrowRight, Loader2, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type L from "leaflet";

interface MapPoint {
  id: string; lat: number; lng: number;
  _type: "maraude" | "signalement" | "commerce" | "invenu";
  title?: string; name?: string; type?: string; status?: string;
  date_start?: string; description?: string;
  volunteers_count?: number; max_volunteers?: number; address?: string;
}

export interface Filters {
  maraudes: boolean; signalements: boolean; commerces: boolean; invendus: boolean;
}

interface MapData {
  maraudes: MapPoint[]; signalements: MapPoint[];
  commerces: MapPoint[]; invendus: MapPoint[];
}

const STYLES = {
  maraude:    { bg: "#3b82f6", glow: "rgba(59,130,246,0.7)",  emoji: "🚶", size: 36 },
  signalement:{ bg: "#f97316", glow: "rgba(249,115,22,0.7)",  emoji: "⚠️", size: 32 },
  commerce:   { bg: "#10b981", glow: "rgba(16,185,129,0.7)",  emoji: "🛒", size: 32 },
  invenu:     { bg: "#8b5cf6", glow: "rgba(139,92,246,0.7)",  emoji: "♻️", size: 32 },
};

function divIcon(Leaflet: typeof L, s: typeof STYLES[keyof typeof STYLES]) {
  return Leaflet.divIcon({
    html: `<div style="background:${s.bg};border-radius:50%;width:${s.size}px;height:${s.size}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(s.size * 0.44)}px;box-shadow:0 0 0 3px rgba(255,255,255,0.2),0 4px 16px ${s.glow};cursor:pointer">${s.emoji}</div>`,
    className: "", iconSize: [s.size, s.size], iconAnchor: [s.size / 2, s.size / 2],
  });
}

export function MapView({ filters, flyTo }: {
  filters: Filters;
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
}) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<L.Map | null>(null);
  const layers    = useRef<Record<string, L.LayerGroup>>({});
  const userMark  = useRef<L.CircleMarker | null>(null);
  const accCircle = useRef<L.Circle | null>(null);

  const [selected,  setSelected]  = useState<MapPoint | null>(null);
  const [data,      setData]      = useState<MapData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [locating,  setLocating]  = useState(false);
  const [mapReady,  setMapReady]  = useState(false);

  // Fetch map data — on error, set empty so overlay disappears
  useEffect(() => {
    api.get("/map")
      .then((d: MapData) => setData(d))
      .catch(() => setData({ maraudes: [], signalements: [], commerces: [], invendus: [] }))
      .finally(() => setLoading(false));
  }, []);

  // Locate user
  const locateUser = useCallback(() => {
    if (!mapInst.current) return;
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const map = mapInst.current!;
      import("leaflet").then(L => {
        userMark.current?.remove(); accCircle.current?.remove();
        accCircle.current = L.circle([lat, lng], { radius: accuracy, color: "#10b981", fillColor: "#10b981", fillOpacity: 0.08, weight: 1 }).addTo(map);
        userMark.current  = L.circleMarker([lat, lng], { radius: 9, fillColor: "#10b981", color: "white", weight: 2.5, fillOpacity: 1 }).addTo(map).bindPopup("📍 Vous êtes ici");
        map.flyTo([lat, lng], 14, { duration: 1 });
      });
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 });
  }, []);

  // Init Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    import("leaflet").then(L => {
      if (!mapRef.current || mapInst.current) return;
      // Fix default icons
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      const map = L.map(mapRef.current, {
        zoomControl: false, scrollWheelZoom: true, wheelPxPerZoomLevel: 80, preferCanvas: true,
      }).setView([46.8, 2.3], 6);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd", maxZoom: 20,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      layers.current = {
        maraudes:    L.layerGroup().addTo(map),
        signalements:L.layerGroup().addTo(map),
        commerces:   L.layerGroup().addTo(map),
        invendus:    L.layerGroup().addTo(map),
      };

      mapInst.current = map;
      setMapReady(true);

      // Auto-locate
      navigator.geolocation?.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        accCircle.current = L.circle([lat, lng], { radius: accuracy, color: "#10b981", fillColor: "#10b981", fillOpacity: 0.08, weight: 1 }).addTo(map);
        userMark.current  = L.circleMarker([lat, lng], { radius: 9, fillColor: "#10b981", color: "white", weight: 2.5, fillOpacity: 1 }).addTo(map);
        map.setView([lat, lng], 13);
      }, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 });
    });

    return () => { mapInst.current?.remove(); mapInst.current = null; };
  }, []);

  // Place markers
  useEffect(() => {
    if (!mapReady || !data) return;
    import("leaflet").then(L => {
      const place = (arr: MapPoint[], key: keyof typeof STYLES) => {
        layers.current[key]?.clearLayers();
        arr.forEach(p => {
          L.marker([p.lat, p.lng], { icon: divIcon(L, STYLES[key]) })
            .addTo(layers.current[key])
            .on("click", () => setSelected(p));
        });
      };
      place(data.maraudes,     "maraude");
      place(data.signalements, "signalement");
      place(data.commerces,    "commerce");
      place(data.invendus ?? [],"invenu");
    });
  }, [data, mapReady]);

  // Filters
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    const map = mapInst.current;
    (Object.keys(filters) as (keyof Filters)[]).forEach(k => {
      const layer = layers.current[k];
      if (!layer) return;
      if (filters[k]) { if (!map.hasLayer(layer)) map.addLayer(layer); }
      else            { if (map.hasLayer(layer))  map.removeLayer(layer); }
    });
  }, [filters, mapReady]);

  // FlyTo on address pick
  useEffect(() => {
    if (!flyTo || !mapInst.current) return;
    mapInst.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 15, { duration: 1 });
  }, [flyTo]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" style={{ background: "#e8e0d8" }} />

      {/* Spinner uniquement pendant le fetch, pas bloquant */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg">
            <Loader2 className="text-emerald-500 animate-spin" size={28} />
            <p className="text-gray-600 text-sm font-medium">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Locate button */}
      <button
        onClick={locateUser} disabled={locating}
        className="absolute right-4 bottom-24 md:bottom-12 z-[1000] w-11 h-11 rounded-xl bg-white/90 border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:border-emerald-400 transition-all"
        title="Me localiser"
      >
        {locating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
      </button>

      {/* Detail panel — desktop */}
      {selected && (
        <div className="hidden md:flex absolute right-4 top-4 bottom-4 w-80 z-[1000] flex-col">
          <div className="bg-[#0d1e35]/96 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-8rem)]">
            <DetailPanel point={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}

      {/* Detail panel — mobile bottom sheet */}
      {selected && (
        <div className="md:hidden absolute bottom-16 left-2 right-2 z-[1000]">
          <div className="bg-[#0d1e35]/96 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
            <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
            <DetailPanel point={selected} onClose={() => setSelected(null)} compact />
          </div>
        </div>
      )}
    </>
  );
}

function DetailPanel({ point, onClose, compact = false }: { point: MapPoint; onClose: () => void; compact?: boolean }) {
  const cfg = {
    maraude:    { label: "Maraude",           color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/20",   icon: <Users size={14}/> },
    signalement:{ label: "Besoin signalé",    color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/20",icon: <AlertTriangle size={14}/> },
    commerce:   { label: "Commerce partenaire",color: "text-emerald-400",bg: "bg-emerald-500/15 border-emerald-500/20",icon: <ShoppingBag size={14}/> },
    invenu:     { label: "Invendus",          color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/20",icon: <ShoppingBag size={14}/> },
  }[point._type] ?? { label: point._type, color: "text-white/50", bg: "bg-white/5 border-white/10", icon: null };

  const href = point._type === "maraude" ? `/maraudes/${point.id}` : point._type === "commerce" ? "/commerces" : point._type === "invenu" ? "/invendus" : "/signalement";

  return (
    <div className={`flex flex-col ${compact ? "p-4" : "p-5 h-full"}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"><X size={14}/></button>
      </div>
      <h3 className="text-white font-bold text-base leading-tight mb-3">{point.title ?? point.name ?? "Sans titre"}</h3>
      {!compact && point.description && <p className="text-white/50 text-sm leading-relaxed mb-4">{point.description}</p>}
      <div className="space-y-2 text-sm">
        {point.date_start && <div className="flex items-center gap-2 text-white/50"><Calendar size={13} className="text-white/30 shrink-0"/><span>{new Date(point.date_start).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</span></div>}
        {point.volunteers_count !== undefined && (
          <div className="flex items-center gap-2 text-white/50">
            <Users size={13} className="text-white/30 shrink-0"/>
            <span>{point.volunteers_count}/{point.max_volunteers} bénévoles</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" style={{width:`${Math.min(100,((point.volunteers_count??0)/(point.max_volunteers??1))*100)}%`}}/></div>
          </div>
        )}
        {point.address && <div className="flex items-center gap-2 text-white/50"><MapPin size={13} className="text-white/30 shrink-0"/><span className="truncate">{point.address}</span></div>}
      </div>
      <a href={href} className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-500 hover:to-green-500 text-white text-sm font-semibold rounded-xl transition-all">Voir les détails <ArrowRight size={14}/></a>
    </div>
  );
}
