import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "../lib/api";

interface LeaderUser { id: string; name: string; points: number; maraudes_count: number; city: string; }

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen() {
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leaderboard?limit=20").then(d => setUsers(d.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={users}
      keyExtractor={i => i.id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <Text style={styles.header}>Héros de la solidarité 🏆</Text>
      }
      renderItem={({ item, index }) => (
        <View style={[styles.card, index < 3 && styles.cardTop]}>
          <Text style={styles.medal}>{index < 3 ? MEDALS[index] : `#${index + 1}`}</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>🚶 {item.maraudes_count} maraudes{item.city ? ` · ${item.city}` : ""}</Text>
          </View>
          <View style={styles.pts}>
            <Text style={styles.ptsNum}>⚡{item.points}</Text>
            <Text style={styles.ptsSub}>pts</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardTop: { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a" },
  medal: { width: 28, textAlign: "center", fontSize: 18 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 18, fontWeight: "700", color: "#065f46" },
  info: { flex: 1 },
  name: { fontWeight: "700", color: "#111827", fontSize: 14 },
  sub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  pts: { alignItems: "flex-end" },
  ptsNum: { fontWeight: "800", color: "#10b981", fontSize: 16 },
  ptsSub: { color: "#9ca3af", fontSize: 11 },
});
