import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "../lib/api";

interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  _type: string;
  title?: string;
  name?: string;
  type?: string;
  date_start?: string;
  volunteers_count?: number;
  max_volunteers?: number;
  description?: string;
}

interface MapData {
  maraudes: MapPoint[];
  signalements: MapPoint[];
  commerces: MapPoint[];
  invendus: MapPoint[];
}

export function MapScreen() {
  const [data, setData] = useState<MapData | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadData();
    requestLocation();
  }, []);

  async function loadData() {
    try {
      const d = await api.get("/map");
      setData(d);
    } catch (e) {
      console.error("Map load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setLocation(coords);
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.1, longitudeDelta: 0.1 }, 1000);
  }

  const filters = [
    { key: null, label: "Tout", emoji: "🌍" },
    { key: "maraude", label: "Maraudes", emoji: "🚶" },
    { key: "signalement", label: "Besoins", emoji: "⚠️" },
    { key: "commerce", label: "Invendus", emoji: "🛒" },
  ];

  const allPoints = data ? [
    ...(!filter || filter === "maraude" ? data.maraudes : []),
    ...(!filter || filter === "signalement" ? data.signalements : []),
    ...(!filter || filter === "commerce" ? data.commerces : []),
  ] : [];

  function markerColor(type: string) {
    switch (type) {
      case "maraude": return "#3b82f6";
      case "signalement": return "#f97316";
      case "commerce": return "#22c55e";
      default: return "#6b7280";
    }
  }

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filterBar}>
        {filters.map(f => (
          <TouchableOpacity key={String(f.key)} onPress={() => setFilter(f.key)}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}>
            <Text style={styles.filterText}>{f.emoji} {f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loaderText}>Chargement de la carte...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{ latitude: 46.2276, longitude: 2.2137, latitudeDelta: 8, longitudeDelta: 8 }}
          showsUserLocation
          showsMyLocationButton
        >
          {allPoints.map(point => (
            <Marker
              key={`${point._type}-${point.id}`}
              coordinate={{ latitude: point.lat, longitude: point.lng }}
              pinColor={markerColor(point._type)}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {point._type === "maraude" ? "🚶" : point._type === "signalement" ? "⚠️" : "🛒"}{" "}
                    {point.title || point.name || "Point d'entraide"}
                  </Text>
                  {point.date_start && (
                    <Text style={styles.calloutText}>
                      📅 {new Date(point.date_start).toLocaleDateString("fr-FR")}
                    </Text>
                  )}
                  {point.volunteers_count !== undefined && (
                    <Text style={styles.calloutText}>
                      👥 {point.volunteers_count}/{point.max_volunteers} bénévoles
                    </Text>
                  )}
                  {point.description && (
                    <Text style={styles.calloutText} numberOfLines={2}>{point.description}</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* FAB localisation */}
      <TouchableOpacity style={styles.fab} onPress={requestLocation}>
        <Text style={styles.fabIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  filterBar: { flexDirection: "row", padding: 8, gap: 6, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6" },
  filterBtnActive: { backgroundColor: "#d1fae5" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderText: { color: "#6b7280" },
  callout: { width: 180, padding: 4 },
  calloutTitle: { fontWeight: "bold", fontSize: 13, marginBottom: 4 },
  calloutText: { fontSize: 11, color: "#4b5563", marginTop: 2 },
  fab: { position: "absolute", bottom: 24, right: 16, width: 50, height: 50, borderRadius: 25, backgroundColor: "white", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  fabIcon: { fontSize: 22 },
});
