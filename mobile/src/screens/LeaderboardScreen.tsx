import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

interface LeaderUser { id: string; name: string; points: number; maraudes_count: number; city: string; }

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leaderboard?limit=50").then(d => setUsers(d.users || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#10b981" /></View>;

  const myRank = user ? users.findIndex(u => u.id === user.id) + 1 : 0;

  return (
    <FlatList
      style={styles.container}
      data={users}
      keyExtractor={i => i.id}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      ListHeaderComponent={
        <View style={[styles.headerWrap, { paddingTop: insets.top + 4 }]}>
          <Text style={styles.header}>Héros de la solidarité 🏆</Text>
          {myRank > 0 && (
            <View style={styles.myRankBadge}>
              <Text style={styles.myRankText}>Votre rang : #{myRank}</Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item, index }) => {
        const isMe = user && item.id === user.id;
        return (
          <View style={[styles.card, index < 3 && styles.cardTop, isMe && styles.cardMe]}>
            <Text style={styles.medal}>{index < 3 ? MEDALS[index] : `#${index + 1}`}</Text>
            <View style={[styles.avatar, isMe && styles.avatarMe]}>
              <Text style={[styles.avatarLetter, isMe && styles.avatarLetterMe]}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, isMe && styles.nameMe]}>{item.name}{isMe ? " (vous)" : ""}</Text>
              <Text style={styles.sub}>🚶 {item.maraudes_count} maraudes{item.city ? ` · ${item.city}` : ""}</Text>
            </View>
            <View style={styles.pts}>
              <Text style={styles.ptsNum}>⚡{item.points}</Text>
              <Text style={styles.ptsSub}>pts</Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun bénévole pour l'instant</Text>
          <Text style={styles.emptyHint}>Participez à des maraudes pour apparaître ici !</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerWrap: { marginBottom: 16 },
  header: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  myRankBadge: { backgroundColor: "#d1fae5", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "flex-start" },
  myRankText: { color: "#065f46", fontWeight: "700", fontSize: 13 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "white", borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardTop: { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a" },
  cardMe: { borderWidth: 2, borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  medal: { width: 28, textAlign: "center", fontSize: 18 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center" },
  avatarMe: { backgroundColor: "#10b981" },
  avatarLetter: { fontSize: 18, fontWeight: "700", color: "#065f46" },
  avatarLetterMe: { color: "#fff" },
  info: { flex: 1 },
  name: { fontWeight: "700", color: "#111827", fontSize: 14 },
  nameMe: { color: "#059669" },
  sub: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  pts: { alignItems: "flex-end" },
  ptsNum: { fontWeight: "800", color: "#10b981", fontSize: 16 },
  ptsSub: { color: "#9ca3af", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#374151", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyHint: { color: "#9ca3af", fontSize: 13 },
});
