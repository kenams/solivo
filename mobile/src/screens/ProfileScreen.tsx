import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api, saveToken, clearToken } from "../lib/api";

interface User { id: string; name: string; email: string; role: string; points: number; maraudes_count: number; badges: { badge_key: string; name: string; icon: string }[]; }

export function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("solivo_token").then(t => {
      if (t) { setIsLoggedIn(true); loadProfile(); }
    });
  }, []);

  async function loadProfile() {
    try {
      const data = await api.get("/auth/me");
      setUser(data);
    } catch { setIsLoggedIn(false); }
  }

  async function login() {
    if (!loginForm.email || !loginForm.password) return Alert.alert("Requis", "Email et mot de passe obligatoires");
    setLoading(true);
    try {
      const data = await api.post("/auth/login", loginForm);
      await saveToken(data.token);
      setIsLoggedIn(true);
      setUser(data.user);
    } catch {
      Alert.alert("Erreur", "Email ou mot de passe incorrect");
    } finally { setLoading(false); }
  }

  async function register() {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      return Alert.alert("Requis", "Tous les champs sont obligatoires");
    }
    setLoading(true);
    try {
      const data = await api.post("/auth/register", registerForm);
      await saveToken(data.token);
      setIsLoggedIn(true);
      setUser(data.user);
    } catch (e: unknown) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  }

  async function logout() {
    await clearToken();
    setIsLoggedIn(false);
    setUser(null);
  }

  if (!isLoggedIn) return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, justifyContent: "center", minHeight: 500 }}>
      <Text style={styles.loginTitle}>🤝 {mode === "login" ? "Connexion" : "Inscription"}</Text>
      <Text style={styles.loginSub}>
        {mode === "login" ? "Connectez-vous pour participer aux maraudes" : "Créez votre compte bénévole"}
      </Text>

      {mode === "register" && (
        <TextInput style={styles.input} placeholder="Prénom Nom" value={registerForm.name}
          onChangeText={v => setRegisterForm(f => ({ ...f, name: v }))}
          autoCapitalize="words" placeholderTextColor="#9ca3af" />
      )}

      {mode === "login" ? (
        <>
          <TextInput style={styles.input} placeholder="Email" value={loginForm.email}
            onChangeText={v => setLoginForm(f => ({ ...f, email: v }))}
            keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Mot de passe" value={loginForm.password}
            onChangeText={v => setLoginForm(f => ({ ...f, password: v }))}
            secureTextEntry placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={styles.loginBtn} onPress={login} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? "..." : "Se connecter"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Email" value={registerForm.email}
            onChangeText={v => setRegisterForm(f => ({ ...f, email: v }))}
            keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Mot de passe" value={registerForm.password}
            onChangeText={v => setRegisterForm(f => ({ ...f, password: v }))}
            secureTextEntry placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={styles.loginBtn} onPress={register} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? "..." : "Créer mon compte"}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.switchMode} onPress={() => setMode(m => m === "login" ? "register" : "login")}>
        <Text style={styles.switchModeText}>
          {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (!user) return <View style={styles.loader}><Text>Chargement...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileRole}>{user.role}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>⚡{user.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>🚶{user.maraudes_count}</Text>
          <Text style={styles.statLabel}>Maraudes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>🏅{user.badges?.length || 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {user.badges?.length > 0 && (
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

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loginTitle: { fontSize: 28, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 8 },
  loginSub: { color: "#6b7280", textAlign: "center", marginBottom: 24 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, fontSize: 14, color: "#111" },
  loginBtn: { backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  loginBtnText: { color: "white", fontWeight: "700", fontSize: 16 },
  switchMode: { marginTop: 16, alignItems: "center" },
  switchModeText: { color: "#10b981", fontSize: 14, fontWeight: "600" },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "800", color: "#065f46" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  profileEmail: { color: "#6b7280", fontSize: 13 },
  profileRole: { color: "#10b981", fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: "white", borderRadius: 14, padding: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statNum: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  section: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12 },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: { alignItems: "center", width: 70 },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 10, color: "#6b7280", textAlign: "center" },
  logoutBtn: { backgroundColor: "#fee2e2", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  logoutText: { color: "#dc2626", fontWeight: "700" },
});
