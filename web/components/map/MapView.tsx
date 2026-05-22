"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

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
}

export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [data, setData] = useState<{ maraudes: MapPoint[]; signalements: MapPoint[]; commerces: MapPoint[]; invendus: MapPoint[] } | null>(null);

  useEffect(() => {
    api.get("/map").then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let map: L.Map;
    import("leaflet").then(L => {
      if (!mapRef.current) return;

      // Fix Leaflet icons
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(mapRef.current!).setView([48.8566, 2.3522], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Géolocalisation utilisateur
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 12);
          L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
            radius: 8, fillColor: "#10b981", color: "white", weight: 2, fillOpacity: 0.9
          }).addTo(map).bindPopup("📍 Vous êtes ici");
        });
      }

      if (!data) return;

      // Maraudes — bleu
      data.maraudes.forEach(m => {
        const icon = L.divIcon({
          html: `<div style="background:#3b82f6;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(59,130,246,0.5)">🚶</div>`,
          className: "", iconSize: [32, 32], iconAnchor: [16, 16]
        });
        L.marker([m.lat, m.lng], { icon }).addTo(map)
          .bindPopup(`<b>${m.title}</b><br>📅 ${m.date_start ? new Date(m.date_start).toLocaleDateString("fr-FR") : ""}<br>👥 ${m.volunteers_count}/${m.max_volunteers} bénévoles<br><a href="/maraudes/${m.id}" style="color:#3b82f6">Voir les détails →</a>`);
      });

      // Signalements — orange
      data.signalements.forEach(s => {
        const icon = L.divIcon({
          html: `<div style="background:#f97316;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(249,115,22,0.5)">⚠️</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14]
        });
        L.marker([s.lat, s.lng], { icon }).addTo(map)
          .bindPopup(`<b>Besoin signalé</b><br>Type: ${s.type}<br>${s.description || ""}`);
      });

      // Commerces — vert
      data.commerces.forEach(c => {
        const icon = L.divIcon({
          html: `<div style="background:#22c55e;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(34,197,94,0.5)">🛒</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14]
        });
        L.marker([c.lat, c.lng], { icon }).addTo(map)
          .bindPopup(`<b>${c.name}</b><br>Commerce partenaire`);
      });
    });

    return () => { if (map) map.remove(); };
  }, [data]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400 text-center">
            <div className="text-4xl mb-2 animate-pulse">🗺️</div>
            <p>Chargement de la carte...</p>
          </div>
        </div>
      )}
    </>
  );
}
