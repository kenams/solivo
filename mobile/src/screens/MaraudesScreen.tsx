import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { RootStackParamList } from "../navigation/AppNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

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
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [maraudes, setMaraudes] = useState<Maraude[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    api.get("/maraudes?limit=50")
      .then(d => setMaraudes(d.maraudes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function join(id: string, title: string) {
    if (!user) {
      Alert.alert("Connexion requise", "Connectez-vous dans l'onglet Profil pour rejoindre une maraude.", [
        { text: "Annuler" },
        { text: "Se connecter", onPress: () => navigation.navigate("Tabs", { screen: "Profil" } as never) },
      ]);
      return;
    }
    setJoining(id);
    try {
      await api.post(`/maraudes/${id}/join`, {});
      setMaraudes(prev => prev.map(m => m.id === id ? { ...m, is_joined: true, volunteers_count: m.volunteers_count + 1 } : m));
      navigation.navigate("Terrain", { maraudeId: id, maraudeTitle: title });
    } catch (e: unknown) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible de rejoindre cette maraude");
    } finally { setJoining(null); }
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
            <Text style={[styles.badgeText, full && { color: "#dc2626" }]}>{full ? "Complet" : "Places dispo"}</Text>
          </View>
          {item.association_name && (
            <Text style={styles.assoc}>{item.association_name}</Text>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>📅 {new Date(item.date_start).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
        {item.meeting_point && <Text style={styles.meta}>📍 {item.meeting_point}{item.city ? `, ${item.city}` : ""}</Text>}
        <Text style={styles.meta}>👥 {item.volunteers_count}/{item.max_volunteers} bénévoles</Text>

        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { width: `${pct * 100}%` as unknown as number }]} />
        </View>

        {item.is_joined ? (
          <TouchableOpacity style={styles.joinedBtn} onPress={() => navigation.navigate("Terrain", { maraudeId: item.id, maraudeTitle: item.title })}>
            <Text style={styles.joinedText}>✓ Inscrit — Mode terrain →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, (full || !user) && !full && styles.joinBtnGuest, full && styles.joinBtnDisabled]}
            disabled={full || joining === item.id}
            onPress={() => join(item.id, item.title)}
          >
            <Text style={styles.joinBtnText}>
              {joining === item.id ? "..." : full ? "Complet" : !user ? "Se connecter pour rejoindre" : "Rejoindre cette maraude"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchWrap, { paddingTop: insets.top + 8 }]}>
        <TextInput
          style={styles.search}
          placeholder="🔍 Rechercher par ville ou titre..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderMaraude}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚶</Text>
              <Text style={styles.emptyText}>Aucune maraude disponible</Text>
              <Text style={styles.emptySub}>Revenez bientôt pour de nouvelles dates</Text>
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
  searchWrap: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  search: { paddingHorizontal: 16, paddingVertical: 11, backgroundColor: "#f3f4f6", borderRadius: 12, fontSize: 14, color: "#111" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeOpen: { backgroundColor: "#d1fae5" },
  badgeFull: { backgroundColor: "#fee2e2" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#065f46" },
  assoc: { fontSize: 11, color: "#6b7280", backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  progressWrap: { height: 4, backgroundColor: "#f0f0f0", borderRadius: 4, marginTop: 12, marginBottom: 12, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: EMERALD, borderRadius: 4 },
  joinBtn: { backgroundColor: EMERALD, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  joinBtnGuest: { backgroundColor: "#6b7280" },
  joinBtnDisabled: { backgroundColor: "#d1d5db" },
  joinBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
  joinedBtn: { backgroundColor: "#d1fae5", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  joinedText: { color: "#065f46", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#374151", fontSize: 16, fontWeight: "700" },
  emptySub: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
});
