import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export function ProfileScreen() {
  const { user, loading, login, register, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!form.email || !form.password) return Alert.alert("Requis", "Email et mot de passe obligatoires");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      setForm({ name: "", email: "", password: "" });
    } catch {
      Alert.alert("Erreur", "Email ou mot de passe incorrect");
    } finally { setSubmitting(false); }
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password)
      return Alert.alert("Requis", "Tous les champs sont obligatoires");
    if (form.password.length < 6)
      return Alert.alert("Mot de passe trop court", "Minimum 6 caractères");
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      setForm({ name: "", email: "", password: "" });
    } catch (e: unknown) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Erreur lors de l'inscription");
    } finally { setSubmitting(false); }
  }

  if (loading) return (
    <View style={[styles.loader, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );

  if (!user) return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.authHero, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.authHeroTitle}>🤝 Rejoindre Solivo</Text>
        <Text style={styles.authHeroSub}>Bénévoles, associations, citoyens engagés</Text>
      </View>

      <View style={styles.authCard}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {mode === "register" && (
          <TextInput
            style={styles.input}
            placeholder="Prénom Nom"
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            autoCapitalize="words"
            placeholderTextColor="#9ca3af"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={v => setForm(f => ({ ...f, email: v }))}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={form.password}
          onChangeText={v => setForm(f => ({ ...f, password: v }))}
          secureTextEntry
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={mode === "login" ? handleLogin : handleRegister}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
              </Text>
          }
        </TouchableOpacity>

        <View style={styles.benefitsList}>
          {["🚶 Rejoindre les maraudes", "⚡ Gagner des points de solidarité", "🏅 Débloquer des badges", "📊 Suivre votre impact"].map(b => (
            <Text key={b} style={styles.benefit}>{b}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Header profil */}
      <View style={[styles.profileHero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
          <View style={[styles.roleBadge, user.role === "admin" && styles.roleBadgeAdmin]}>
            <Text style={styles.roleText}>{user.role === "admin" ? "Admin" : "Bénévole"}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statBig}>⚡{user.points}</Text>
          <Text style={styles.statSub}>points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statBig}>🚶{user.maraudes_count}</Text>
          <Text style={styles.statSub}>maraudes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statBig}>💚{(user.total_donations / 100).toFixed(0)}€</Text>
          <Text style={styles.statSub}>donnés</Text>
        </View>
      </View>

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes badges</Text>
          <View style={styles.badgesGrid}>
            {user.badges.map(b => (
              <View key={b.badge_key} style={styles.badgeCard}>
                <Text style={styles.badgeIcon}>{b.icon}</Text>
                <Text style={styles.badgeName}>{b.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Progression */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Prochain badge</Text>
          <Text style={styles.progressPts}>{user.points}/500 pts</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (user.points / 500) * 100)}%` as unknown as number }]} />
        </View>
        <Text style={styles.progressHint}>Participez à des maraudes et faites des dons pour gagner des points</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  authHero: { backgroundColor: "#10b981", paddingHorizontal: 24, paddingBottom: 32 },
  authHeroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 6 },
  authHeroSub: { color: "#a7f3d0", fontSize: 14 },

  authCard: { margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  modeSwitcher: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  modeBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modeBtnText: { fontWeight: "600", color: "#9ca3af", fontSize: 14 },
  modeBtnTextActive: { color: "#111827" },
  input: { backgroundColor: "#f9fafb", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 12, fontSize: 14, color: "#111" },
  submitBtn: { backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4, elevation: 2, shadowColor: "#10b981", shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  benefitsList: { marginTop: 20, gap: 8 },
  benefit: { color: "#6b7280", fontSize: 13 },

  profileHero: { backgroundColor: "#10b981", paddingHorizontal: 20, paddingBottom: 28, flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
  avatarLetter: { fontSize: 32, fontWeight: "800", color: "#fff" },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroEmail: { color: "#a7f3d0", fontSize: 13, marginTop: 2 },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6, alignSelf: "flex-start" },
  roleBadgeAdmin: { backgroundColor: "#fde68a" },
  roleText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  statsBar: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: -14, borderRadius: 16, padding: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statBig: { fontSize: 17, fontWeight: "800", color: "#111827" },
  statSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#f3f4f6" },

  section: { margin: 16, marginTop: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 14 },

  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  badgeCard: { alignItems: "center", width: 70, backgroundColor: "#f9fafb", borderRadius: 12, padding: 10 },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 9, color: "#6b7280", textAlign: "center", fontWeight: "600" },

  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  progressPts: { fontSize: 13, color: "#10b981", fontWeight: "700" },
  progressBar: { height: 8, backgroundColor: "#f0f0f0", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#10b981", borderRadius: 4 },
  progressHint: { fontSize: 12, color: "#9ca3af", lineHeight: 17 },

  logoutBtn: { margin: 16, backgroundColor: "#fee2e2", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15 },
});
