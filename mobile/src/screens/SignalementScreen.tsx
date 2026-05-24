import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const TYPES = [
  { value: "homeless", label: "Personne à la rue", emoji: "🏚️" },
  { value: "food", label: "Besoin alimentaire", emoji: "🍞" },
  { value: "medical", label: "Besoin médical", emoji: "🏥" },
  { value: "family", label: "Famille en difficulté", emoji: "👨‍👩‍👧" },
  { value: "urgent", label: "Urgence sociale", emoji: "🆘" },
  { value: "other", label: "Autre", emoji: "📌" },
];

export function SignalementScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function geolocate() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Autorisez la géolocalisation dans les réglages.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert("Erreur", "Impossible de récupérer votre position");
    } finally { setLocating(false); }
  }

  async function submit() {
    if (!type) return Alert.alert("Requis", "Sélectionnez le type de besoin");
    if (!coords) return Alert.alert("Requis", "Veuillez vous géolocaliser d'abord");
    setLoading(true);
    try {
      await api.post("/signalements", {
        type, description, address, city,
        lat: coords.lat, lng: coords.lng,
        anonymous: !user,
      });
      setSent(true);
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le signalement. Réessayez.");
    } finally { setLoading(false); }
  }

  if (sent) return (
    <View style={[styles.successContainer, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Signalement envoyé !</Text>
      <Text style={styles.successText}>Les équipes de votre zone ont été alertées. Merci pour votre vigilance.</Text>
      {user && <Text style={styles.successPoints}>+10 points de solidarité ✨</Text>}
      <TouchableOpacity style={styles.resetBtn} onPress={() => {
        setSent(false); setType(""); setDescription(""); setCoords(null); setAddress(""); setCity("");
      }}>
        <Text style={styles.resetBtnText}>Nouveau signalement</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroTitle}>⚠️ Signaler un besoin</Text>
        <Text style={styles.heroSub}>Anonyme · Sécurisé · Transmis aux équipes terrain</Text>
      </View>

      <View style={styles.content}>
        {/* Types */}
        <Text style={styles.label}>Type de besoin *</Text>
        <View style={styles.typeGrid}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
              onPress={() => setType(t.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeLabel, type === t.value && styles.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Géolocalisation */}
        <Text style={styles.label}>Localisation *</Text>
        <TouchableOpacity style={[styles.geoBtn, coords && styles.geoBtnActive]} onPress={geolocate} disabled={locating} activeOpacity={0.8}>
          {locating
            ? <ActivityIndicator color="#10b981" size="small" />
            : <Text style={[styles.geoBtnText, coords && styles.geoBtnTextActive]}>
                {coords ? `✓ Position détectée (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "📍 Détecter ma position actuelle"}
              </Text>
          }
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Adresse précise (optionnel)"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.input}
          placeholder="Ville"
          value={city}
          onChangeText={setCity}
          placeholderTextColor="#9ca3af"
        />

        {/* Description */}
        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Précisions pour les bénévoles (apparence, situation, besoins spécifiques)..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor="#9ca3af"
        />

        {!user && (
          <View style={styles.anonBanner}>
            <Text style={styles.anonText}>🔒 Ce signalement sera envoyé anonymement. Créez un compte pour suivre vos signalements et gagner des points.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>⚠️ Envoyer le signalement</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  hero: { backgroundColor: "#f97316", paddingHorizontal: 20, paddingBottom: 28 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroSub: { color: "#fed7aa", fontSize: 13, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10, marginTop: 16 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "white" },
  typeBtnActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  typeEmoji: { fontSize: 18 },
  typeLabel: { fontSize: 12, color: "#374151", fontWeight: "600" },
  typeLabelActive: { color: "#ea580c" },
  geoBtn: { padding: 16, borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "#d1d5db", alignItems: "center", marginBottom: 10 },
  geoBtnActive: { borderColor: "#10b981", backgroundColor: "#f0fdf4", borderStyle: "solid" },
  geoBtnText: { color: "#6b7280", fontWeight: "600", fontSize: 14 },
  geoBtnTextActive: { color: "#059669" },
  input: { backgroundColor: "white", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, fontSize: 14, color: "#111" },
  textArea: { backgroundColor: "white", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111", textAlignVertical: "top", minHeight: 100, marginTop: 4 },
  anonBanner: { backgroundColor: "#fef3c7", borderRadius: 12, padding: 14, marginTop: 12 },
  anonText: { color: "#92400e", fontSize: 13, lineHeight: 18 },
  submitBtn: { backgroundColor: "#f97316", borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 20, elevation: 2, shadowColor: "#f97316", shadowOpacity: 0.4, shadowRadius: 8 },
  submitBtnText: { color: "white", fontWeight: "800", fontSize: 16 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, backgroundColor: "#f9fafb" },
  successIcon: { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successText: { color: "#6b7280", textAlign: "center", lineHeight: 22, marginBottom: 12 },
  successPoints: { color: "#10b981", fontWeight: "700", fontSize: 14, marginBottom: 24 },
  resetBtn: { backgroundColor: "#f97316", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  resetBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
});
