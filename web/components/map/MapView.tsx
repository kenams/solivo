"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, X, Users, Calendar, AlertTriangle, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type L from "leaflet";

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  _type: "maraude" | "signalement" | "commerce" | "invenu";
  title?: string;
  name?: string;
  type?: string;
  status?: string;
  date_start?: string;
  description?: string;
  volunteers_count?: number;
  max_volunteers?: number;
  address?: string;
}

export interface Filters {
  maraudes: boolean;
  signalements: boolean;
  commerces: boolean;
  invendus: boolean;
}

const MARKER_STYLES = {
  maraude: { bg: "#3b82f6", glow: "rgba(59,130,246,0.6)", emoji: "🚶", size: 36 },
  signalement: { bg: "#f97316", glow: "rgba(249,115,22,0.6)", emoji: "⚠️", size: 32 },
  commerce: { bg: "#10b981", glow: "rgba(16,185,129,0.6)", emoji: "🛒", size: 32 },
  invenu: { bg: "#8b5cf6", glow: "rgba(139,92,246,0.6)", emoji: "♻️", size: 32 },
};

function makeIcon(Leaflet: typeof L, style: { bg: string; glow: string; emoji: string; size: number }) {
  return Leaflet.divIcon({
    html: `<div style="background:${style.bg};color:white;border-radius:50%;width:${style.size}px;height:${style.size}px;display:flex;align-items:center;justify-content:center;font-size:${style.size * 0.45}px;box-shadow:0 0 0 3px rgba(255,255,255,0.15),0 4px 16px ${style.glow};transition:transform .15s;cursor:pointer;" class="map-marker">${style.emoji}</div>`,
    className: "",
    iconSize: [style.size, style.size],
    iconAnchor: [style.size / 2, style.size / 2],
  });
}

export function MapView({ filters }: { filters: Filters }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.LayerGroup }>({});
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [data, setData] = useState<{ maraudes: MapPoint[]; signalements: MapPoint[]; commerces: MapPoint[]; invendus: MapPoint[] } | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    api.get("/map").then(setData).catch(() => {});
  }, []);

  const locateUser = useCallback(() => {
    if (!mapInstanceRef.current || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const map = mapInstanceRef.current!;

        if (userMarkerRef.current) userMarkerRef.current.remove();
        if (accuracyCircleRef.current) accuracyCircleRef.current.remove();

        import("leaflet").then(L => {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(map);

          userMarkerRef.current = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: "#10b981",
            color: "white",
            weight: 2.5,
            fillOpacity: 1,
          }).addTo(map).bindPopup("📍 Vous êtes ici");

          map.flyTo([lat, lng], 14, { duration: 1.2, easeLinearity: 0.25 });
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then(L => {
      if (!mapRef.current || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        wheelPxPerZoomLevel: 80,
        preferCanvas: true,
      }).setView([46.8, 2.3], 6);

      // Dark tile — CartoDB Dark Matter
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // Zoom controls bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Layer groups
      layersRef.current = {
        maraudes: L.layerGroup().addTo(map),
        signalements: L.layerGroup().addTo(map),
        commerces: L.layerGroup().addTo(map),
        invendus: L.layerGroup().addTo(map),
      };

      mapInstanceRef.current = map;
      setMapReady(true);

      // Auto-locate on load
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const { latitude: lat, longitude: lng, accuracy } = pos.coords;

            accuracyCircleRef.current = L.circle([lat, lng], {
              radius: accuracy,
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.08,
              weight: 1,
            }).addTo(map);

            userMarkerRef.current = L.circleMarker([lat, lng], {
              radius: 9,
              fillColor: "#10b981",
              color: "white",
              weight: 2.5,
              fillOpacity: 1,
            }).addTo(map);

            map.setView([lat, lng], 13);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
        );
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Populate markers when data arrives
  useEffect(() => {
    if (!mapReady || !data) return;

    import("leaflet").then(L => {
      const layers = layersRef.current;

      layers.maraudes.clearLayers();
      data.maraudes.forEach(m => {
        const icon = makeIcon(L, MARKER_STYLES.maraude);
        L.marker([m.lat, m.lng], { icon })
          .addTo(layers.maraudes)
          .on("click", () => setSelected(m));
      });

      layers.signalements.clearLayers();
      data.signalements.forEach(s => {
        const icon = makeIcon(L, MARKER_STYLES.signalement);
        L.marker([s.lat, s.lng], { icon })
          .addTo(layers.signalements)
          .on("click", () => setSelected(s));
      });

      layers.commerces.clearLayers();
      data.commerces.forEach(c => {
        const icon = makeIcon(L, MARKER_STYLES.commerce);
        L.marker([c.lat, c.lng], { icon })
          .addTo(layers.commerces)
          .on("click", () => setSelected(c));
      });

      layers.invendus.clearLayers();
      (data.invendus ?? []).forEach(i => {
        const icon = makeIcon(L, MARKER_STYLES.invenu);
        L.marker([i.lat, i.lng], { icon })
          .addTo(layers.invendus)
          .on("click", () => setSelected(i));
      });
    });
  }, [data, mapReady]);

  // Filter toggle
  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current!;
    const layers = layersRef.current;
    (Object.keys(filters) as (keyof Filters)[]).forEach(key => {
      const layer = layers[key];
      if (!layer) return;
      if (filters[key]) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });
  }, [filters, mapReady]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Map */}
      <div ref={mapRef} className="w-full h-full" style={{ background: "#0d1117" }} />

      {/* Loading overlay */}
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <MapPin className="text-emerald-400 animate-pulse" size={22} />
            </div>
            <p className="text-white/50 text-sm">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Locate button */}
      <button
        onClick={locateUser}
        disabled={locating}
        className="absolute right-4 bottom-24 md:bottom-12 z-[1000] w-11 h-11 rounded-xl bg-[#0d1e35]/90 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-emerald-400 hover:border-emerald-500/40 transition-all shadow-lg"
        title="Me localiser"
      >
        {locating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
      </button>

      {/* Detail panel — desktop right side */}
      {selected && (
        <div className="hidden md:flex absolute right-4 top-4 bottom-4 w-80 z-[1000] flex-col">
          <div className="bg-[#0d1e35]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full max-h-[calc(100vh-8rem)]">
            <DetailPanel point={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}

      {/* Detail panel — mobile bottom sheet */}
      {selected && (
        <div className="md:hidden absolute bottom-20 left-2 right-2 z-[1000]">
          <div className="bg-[#0d1e35]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
            <DetailPanel point={selected} onClose={() => setSelected(null)} compact />
          </div>
        </div>
      )}
    </>
  );
}

function DetailPanel({ point, onClose, compact = false }: { point: MapPoint; onClose: () => void; compact?: boolean }) {
  const typeConfig = {
    maraude: { label: "Maraude", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/20", icon: <Users size={16} /> },
    signalement: { label: "Besoin signalé", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/20", icon: <AlertTriangle size={16} /> },
    commerce: { label: "Commerce partenaire", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: <ShoppingBag size={16} /> },
    invenu: { label: "Invendus disponibles", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/20", icon: <ShoppingBag size={16} /> },
  };

  const cfg = typeConfig[point._type] ?? typeConfig.signalement;

  const href =
    point._type === "maraude" ? `/maraudes/${point.id}` :
    point._type === "commerce" ? `/commerces` :
    point._type === "invenu" ? `/invendus` : `/signalement`;

  return (
    <div className={`flex flex-col ${compact ? "p-4" : "p-5 h-full"}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <h3 className="text-white font-bold text-base leading-tight mb-3">
        {point.title ?? point.name ?? "Sans titre"}
      </h3>

      {!compact && point.description && (
        <p className="text-white/50 text-sm leading-relaxed mb-4">{point.description}</p>
      )}

      <div className="space-y-2 text-sm">
        {point.date_start && (
          <div className="flex items-center gap-2 text-white/50">
            <Calendar size={13} className="text-white/30 shrink-0" />
            <span>{new Date(point.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        )}
        {point.volunteers_count !== undefined && (
          <div className="flex items-center gap-2 text-white/50">
            <Users size={13} className="text-white/30 shrink-0" />
            <span>{point.volunteers_count}/{point.max_volunteers} bénévoles</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                style={{ width: `${Math.min(100, ((point.volunteers_count ?? 0) / (point.max_volunteers ?? 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {point.address && (
          <div className="flex items-center gap-2 text-white/50">
            <MapPin size={13} className="text-white/30 shrink-0" />
            <span className="truncate">{point.address}</span>
          </div>
        )}
        {point.type && (
          <div className="flex items-center gap-2 text-white/50">
            <AlertTriangle size={13} className="text-white/30 shrink-0" />
            <span className="capitalize">{point.type}</span>
          </div>
        )}
      </div>

      <a
        href={href}
        className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-500 hover:to-green-500 text-white text-sm font-semibold rounded-xl transition-all"
      >
        Voir les détails <ArrowRight size={14} />
      </a>
    </div>
  );
}
