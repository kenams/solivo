import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { RootStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Alerte { id: string; titre: string; type: string; niveau: string; city: string; }
interface Maraude { id: string; title: string; date_start: string; city: string; volunteers_count: number; max_volunteers: number; is_joined: boolean; }
interface Stats { donations_total_cents: number; donations_count: number; }

const NIVEAU_COLOR: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
const NIVEAU_LABEL: Record<string, string> = { critical: "🔴 Critique", warning: "🟠 Alerte", info: "🔵 Info" };

export function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [maraudes, setMaraudes] = useState<Maraude[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [alertesData, maraudesData, statsData] = await Promise.all([
        api.get("/terrain/alertes?limit=5").catch(() => []),
        api.get("/maraudes?limit=4&status=upcoming").catch(() => ({ maraudes: [] })),
        api.get("/donations/stats").catch(() => null),
      ]);
      setAlertes(Array.isArray(alertesData) ? alertesData.slice(0, 3) : []);
      setMaraudes((maraudesData?.maraudes || []).slice(0, 4));
      setStats(statsData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); }

  if (loading) return (
    <View style={[styles.loaderWrap, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );

  const totalDons = stats ? (stats.donations_total_cents / 100).toFixed(0) : "0";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.welcome}>
            {user ? `Bonjour, ${user.name.split(" ")[0]} 👋` : "Bienvenue sur Solivo 👋"}
          </Text>
          <Text style={styles.subtitle}>Ensemble, faisons la différence</Text>
        </View>
        {user && (
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsNum}>⚡{user.points}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statBig}>{totalDons}€</Text>
          <Text style={styles.statSub}>collectés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statBig}>{maraudes.length}+</Text>
          <Text style={styles.statSub}>maraudes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statBig}>{alertes.length}</Text>
          <Text style={styles.statSub}>alertes actives</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="⚠️" label="Signaler" color="#f97316" onPress={() => navigation.navigate("Tabs", { screen: "Signaler" } as never)} />
          <QuickAction icon="💚" label="Donner" color="#10b981" onPress={() => navigation.navigate("Tabs", { screen: "Donner" } as never)} />
          <QuickAction icon="🗺️" label="Carte" color="#3b82f6" onPress={() => navigation.navigate("Tabs", { screen: "Carte" } as never)} />
          <QuickAction icon="🏆" label="Classement" color="#8b5cf6" onPress={() => navigation.navigate("Classement" as never)} />
        </View>
      </View>

      {/* Alertes */}
      {alertes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Alertes en cours</Text>
          {alertes.map((a) => (
            <View key={a.id} style={[styles.alerteCard, { borderLeftColor: NIVEAU_COLOR[a.niveau] || "#6b7280" }]}>
              <View style={styles.alerteTop}>
                <Text style={[styles.alerteNiveau, { color: NIVEAU_COLOR[a.niveau] || "#6b7280" }]}>
                  {NIVEAU_LABEL[a.niveau] || a.niveau}
                </Text>
                {a.city && <Text style={styles.alerteCity}>{a.city}</Text>}
              </View>
              <Text style={styles.alerteTitre}>{a.titre}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Prochaines maraudes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚶 Prochaines maraudes</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Maraudes" as never)}>
            <Text style={styles.seeAll}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        {maraudes.length === 0 ? (
          <Text style={styles.empty}>Aucune maraude à venir pour l'instant.</Text>
        ) : (
          maraudes.map((m) => (
            <View key={m.id} style={styles.maraudeCard}>
              <View style={styles.maraudeLeft}>
                <Text style={styles.maraudeTitle}>{m.title}</Text>
                <Text style={styles.maraudeMeta}>
                  📅 {new Date(m.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
                {m.city && <Text style={styles.maraudeMeta}>📍 {m.city}</Text>}
              </View>
              <View style={styles.maraudeRight}>
                <Text style={styles.maraudeCount}>{m.volunteers_count}/{m.max_volunteers}</Text>
                <Text style={styles.maraudeLabel}>bénévoles</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* CTA don si non connecté */}
      {!user && (
        <View style={styles.ctaBanner}>
          <Text style={styles.ctaTitle}>Rejoignez le mouvement</Text>
          <Text style={styles.ctaSub}>Créez votre compte pour participer aux maraudes et suivre votre impact</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate("Tabs", { screen: "Profil" } as never)}>
            <Text style={styles.ctaBtnText}>Créer mon compte →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickIcon, { backgroundColor: color + "20" }]}>
        <Text style={styles.quickEmoji}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#10b981", paddingHorizontal: 20, paddingBottom: 24 },
  welcome: { fontSize: 22, fontWeight: "800", color: "#fff" },
  subtitle: { color: "#a7f3d0", fontSize: 13, marginTop: 2 },
  pointsBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center" },
  pointsNum: { color: "#fff", fontWeight: "800", fontSize: 15 },
  pointsLabel: { color: "#a7f3d0", fontSize: 10 },
  statsBar: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: -12, borderRadius: 16, padding: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statBig: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#f3f4f6" },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  seeAll: { color: "#10b981", fontSize: 13, fontWeight: "600" },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickBtn: { flex: 1, alignItems: "center", gap: 6 },
  quickIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "#374151" },
  alerteCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  alerteTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  alerteNiveau: { fontSize: 12, fontWeight: "700" },
  alerteCity: { fontSize: 11, color: "#9ca3af" },
  alerteTitre: { fontSize: 14, fontWeight: "600", color: "#111827" },
  maraudeCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  maraudeLeft: { flex: 1 },
  maraudeTitle: { fontWeight: "700", color: "#111827", fontSize: 14, marginBottom: 4 },
  maraudeMeta: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  maraudeRight: { alignItems: "center", marginLeft: 12 },
  maraudeCount: { fontSize: 18, fontWeight: "800", color: "#10b981" },
  maraudeLabel: { fontSize: 10, color: "#9ca3af" },
  empty: { color: "#9ca3af", fontSize: 14, textAlign: "center", paddingVertical: 20 },
  ctaBanner: { margin: 16, backgroundColor: "#10b981", borderRadius: 20, padding: 20, alignItems: "center" },
  ctaTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 6 },
  ctaSub: { color: "#a7f3d0", textAlign: "center", fontSize: 13, lineHeight: 18, marginBottom: 16 },
  ctaBtn: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  ctaBtnText: { color: "#10b981", fontWeight: "700", fontSize: 14 },
});
