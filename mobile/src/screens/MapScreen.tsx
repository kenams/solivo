import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { api } from "../lib/api";

interface MapPoint { id: string; lat: number; lng: number; _type: string; title?: string; name?: string; type?: string; description?: string; }
interface MapData { maraudes: MapPoint[]; signalements: MapPoint[]; commerces: MapPoint[]; invendus: MapPoint[]; }

const COLORS: Record<string, string> = { maraude: "#10b981", signalement: "#ef4444", commerce: "#3b82f6", invenu: "#f59e0b" };
const FILTERS = [
  { key: null, label: "Tout", color: "#6b7280" },
  { key: "maraude", label: "Maraudes", color: "#10b981" },
  { key: "signalement", label: "Signalements", color: "#ef4444" },
  { key: "commerce", label: "Commerces", color: "#3b82f6" },
  { key: "invenu", label: "Invendus", color: "#f59e0b" },
];

function buildHtml(points: MapPoint[], lat?: number, lng?: number): string {
  const markers = points.filter(p => p.lat && p.lng).map(p => {
    const c = COLORS[p._type] || "#6b7280";
    const label = (p.title || p.name || p._type).replace(/['"<>]/g, "");
    const desc = (p.description || p.type || "").replace(/['"<>]/g, "");
    return `L.circleMarker([${p.lat},${p.lng}],{radius:11,color:'${c}',fillColor:'${c}',fillOpacity:0.9,weight:2}).addTo(map).bindPopup('<b>${label}</b>${desc ? `<br/><span style="color:#666">${desc}</span>` : ""}')`;
  }).join(";\n");
  const me = lat && lng ? `L.circleMarker([${lat},${lng}],{radius:9,color:'#fff',fillColor:'#7c3aed',fillOpacity:1,weight:3}).addTo(map).bindPopup('<b>📍 Ma position</b>')` : "";
  const cLat = lat || 46.6; const cLng = lng || 2.3; const zoom = lat ? 14 : 5;
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%;font-family:sans-serif}.leaflet-popup-content-wrapper{border-radius:10px}.leaflet-popup-content{font-size:13px;line-height:1.4}</style></head><body><div id="m"></div><script>var map=L.map('m',{zoomControl:true}).setView([${cLat},${cLng}],${zoom});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'OSM'}).addTo(map);${markers};${me};</script></body></html>`;
}

export function MapScreen() {
  const insets = useSafeAreaInsets();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    Promise.all([loadData(), locateUser()]);
  }, []);

  async function locateUser() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        return { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
    } catch {}
    setLocating(false);
    return null;
  }

  async function loadData() {
    try {
      const data: MapData = await api.get("/map");
      const pts: MapPoint[] = [
        ...(data.maraudes || []).map(m => ({ ...m, _type: "maraude" })),
        ...(data.signalements || []).map(s => ({ ...s, _type: "signalement" })),
        ...(data.commerces || []).map(c => ({ ...c, _type: "commerce" })),
        ...(data.invendus || []).map(i => ({ ...i, _type: "invenu" })),
      ];
      setAllPoints(pts);
      const pos = userPos;
      setHtml(buildHtml(pts, pos?.lat, pos?.lng));
    } catch { setHtml(buildHtml([])); }
    finally { setLoading(false); setLocating(false); }
  }

  useEffect(() => {
    if (allPoints.length > 0 && userPos) {
      const filtered = filter ? allPoints.filter(p => p._type === filter) : allPoints;
      setHtml(buildHtml(filtered, userPos.lat, userPos.lng));
    }
  }, [userPos]);

  function applyFilter(type: string | null) {
    setFilter(type);
    const filtered = type ? allPoints.filter(p => p._type === type) : allPoints;
    setHtml(buildHtml(filtered, userPos?.lat, userPos?.lng));
  }

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={[styles.filterBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity key={String(f.key)} onPress={() => applyFilter(f.key)}
              style={[styles.filterChip, filter === f.key && { backgroundColor: f.color, borderColor: f.color }]}>
              <Text style={[styles.filterText, filter === f.key && { color: "#fff" }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={locateUser} style={[styles.filterChip, styles.locateBtn]} disabled={locating}>
            {locating ? <ActivityIndicator size="small" color="#7c3aed" /> : <Text style={styles.locateText}>📍 Me localiser</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loaderText}>Chargement de la carte...</Text>
        </View>
      ) : (
        <WebView
          source={{ html, baseUrl: "https://unpkg.com" }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => <View style={styles.loader}><ActivityIndicator size="large" color="#10b981" /></View>}
        />
      )}

      {/* Légende */}
      <View style={[styles.legend, { paddingBottom: insets.bottom + 4 }]}>
        {Object.entries(COLORS).map(([key, color]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#7c3aed" }]} />
          <Text style={styles.legendText}>Moi</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  filterBar: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingHorizontal: 12, paddingBottom: 8 },
  filterScroll: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  locateBtn: { borderColor: "#7c3aed", borderStyle: "dashed" },
  locateText: { fontSize: 12, fontWeight: "600", color: "#7c3aed" },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText: { color: "#6b7280", fontSize: 14 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 14, paddingVertical: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, color: "#6b7280" },
});
