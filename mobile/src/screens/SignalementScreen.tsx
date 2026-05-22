import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Veuillez autoriser la géolocalisation.");
      setLocating(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setLocating(false);
  }

  async function submit() {
    if (!type) return Alert.alert("Requis", "Sélectionnez le type de besoin");
    if (!coords) return Alert.alert("Requis", "Veuillez vous géolocaliser");
    setLoading(true);
    try {
      await api.post("/signalements", { type, description, address, city, ...coords, anonymous: true });
      setSent(true);
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le signalement");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Signalement envoyé !</Text>
      <Text style={styles.successText}>Les équipes de votre zone ont été alertées. Merci.</Text>
      <TouchableOpacity style={styles.resetBtn} onPress={() => { setSent(false); setType(""); setDescription(""); setCoords(null); }}>
        <Text style={styles.resetBtnText}>Nouveau signalement</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.subtitle}>Alertez discrètement. 100% anonyme.</Text>

      {/* Types */}
      <Text style={styles.label}>Type de besoin *</Text>
      <View style={styles.typeGrid}>
        {TYPES.map(t => (
          <TouchableOpacity key={t.value}
            style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
            onPress={() => setType(t.value)}>
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text style={[styles.typeLabel, type === t.value && styles.typeLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Géolocalisation */}
      <Text style={styles.label}>Localisation *</Text>
      <TouchableOpacity style={[styles.geoBtn, coords && styles.geoBtnActive]} onPress={geolocate} disabled={locating}>
        {locating ? <ActivityIndicator color="#10b981" /> : <Text style={styles.geoBtnText}>
          {coords ? `✓ Position détectée (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : "📍 Détecter ma position"}
        </Text>}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Adresse précise (optionnel)" value={address} onChangeText={setAddress} placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} placeholder="Ville" value={city} onChangeText={setCity} placeholderTextColor="#9ca3af" />

      {/* Description */}
      <Text style={styles.label}>Description (optionnel)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        placeholder="Précisions pour les bénévoles..."
        value={description}
        onChangeText={setDescription}
        multiline
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? "Envoi..." : "⚠️ Envoyer le signalement"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  subtitle: { color: "#6b7280", marginBottom: 16, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white" },
  typeBtnActive: { borderColor: "#f97316", backgroundColor: "#fff7ed" },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontSize: 12, color: "#374151", fontWeight: "500" },
  typeLabelActive: { color: "#ea580c" },
  geoBtn: { padding: 14, borderRadius: 12, borderWidth: 2, borderStyle: "dashed", borderColor: "#d1d5db", alignItems: "center", marginBottom: 8 },
  geoBtnActive: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  geoBtnText: { color: "#6b7280", fontWeight: "500" },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, fontSize: 14, color: "#111" },
  submitBtn: { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 16 },
  submitBtnText: { color: "white", fontWeight: "700", fontSize: 16 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successText: { color: "#6b7280", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  resetBtn: { backgroundColor: "#f97316", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  resetBtnText: { color: "white", fontWeight: "700" },
});
