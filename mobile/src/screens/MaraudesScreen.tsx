import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { api } from "../lib/api";

interface Maraude {
  id: string;
  title: string;
  date_start: string;
  meeting_point: string;
  city: string;
  volunteers_count: number;
  max_volunteers: number;
  status: string;
  association_name: string;
  is_joined: boolean;
}

export function MaraudesScreen() {
  const [maraudes, setMaraudes] = useState<Maraude[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    api.get("/maraudes?limit=50")
      .then(d => setMaraudes(d.maraudes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function join(id: string) {
    setJoining(id);
    try {
      await api.post(`/maraudes/${id}/join`, {});
      setMaraudes(prev => prev.map(m => m.id === id ? { ...m, is_joined: true, volunteers_count: m.volunteers_count + 1 } : m));
      Alert.alert("✅ Inscription confirmée !", "Vous êtes inscrit à cette maraude.");
    } catch (e: unknown) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Erreur lors de l'inscription");
    } finally {
      setJoining(null);
    }
  }

  const filtered = maraudes.filter(m =>
    !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.city?.toLowerCase().includes(search.toLowerCase())
  );

  function renderMaraude({ item }: { item: Maraude }) {
    const full = item.volunteers_count >= item.max_volunteers;
    const pct = Math.min(1, item.volunteers_count / item.max_volunteers);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, full ? styles.badgeFull : styles.badgeOpen]}>
            <Text style={styles.badgeText}>{full ? "Complet" : "Places dispo"}</Text>
          </View>
          {item.association_name && (
            <Text style={styles.assoc}>{item.association_name}</Text>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>📅 {new Date(item.date_start).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
        <Text style={styles.meta}>📍 {item.meeting_point}{item.city ? `, ${item.city}` : ""}</Text>
        <Text style={styles.meta}>👥 {item.volunteers_count}/{item.max_volunteers} bénévoles</Text>

        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: `${pct * 100}%` as unknown as number }]} />
        </View>

        {item.is_joined ? (
          <View style={styles.joinedBtn}>
            <Text style={styles.joinedText}>✓ Vous êtes inscrit</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, full && styles.joinBtnDisabled]}
            disabled={full || joining === item.id}
            onPress={() => join(item.id)}
          >
            <Text style={styles.joinBtnText}>
              {joining === item.id ? "..." : full ? "Complet" : "Rejoindre cette maraude"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="🔍 Rechercher par ville ou titre..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9ca3af"
      />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderMaraude}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚶</Text>
              <Text style={styles.emptyText}>Aucune maraude disponible</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const EMERALD = "#10b981";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  search: { margin: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "white", borderRadius: 12, fontSize: 14, color: "#111", borderWidth: 1, borderColor: "#e5e7eb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeOpen: { backgroundColor: "#d1fae5" },
  badgeFull: { backgroundColor: "#fee2e2" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#374151" },
  assoc: { fontSize: 11, color: "#6b7280", backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  progress: { height: 4, backgroundColor: "#f0f0f0", borderRadius: 4, marginTop: 10, marginBottom: 12, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: EMERALD, borderRadius: 4 },
  joinBtn: { backgroundColor: EMERALD, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  joinBtnDisabled: { backgroundColor: "#d1d5db" },
  joinBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
  joinedBtn: { backgroundColor: "#d1fae5", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  joinedText: { color: "#065f46", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#6b7280", fontSize: 16 },
});
