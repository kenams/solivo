import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, Switch, Modal
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const AMOUNTS = [500, 1000, 2000, 5000, 10000];
const CONTRIBUTIONS = [
  { pct: 0, label: "0%", desc: "100% à l'asso" },
  { pct: 3, label: "3%", desc: "Recommandé" },
  { pct: 5, label: "5%", desc: "" },
  { pct: 10, label: "10%", desc: "Généreux" },
];

export function DonsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [anonymous, setAnonymous] = useState(!user);
  const [message, setMessage] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [contribution, setContribution] = useState(3);
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const finalAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amount;
  const platformFee = Math.round(finalAmount * contribution / 100);
  const assoAmount = finalAmount - platformFee;

  async function startCheckout() {
    if (finalAmount < 100) return Alert.alert("Montant invalide", "Le montant minimum est de 1€");
    if (finalAmount > 500000) return Alert.alert("Montant invalide", "Le montant maximum est de 5000€");
    setLoading(true);
    try {
      const data = await api.post("/donations/checkout", {
        amount: finalAmount,
        anonymous: user ? anonymous : true,
        message: message || undefined,
        recurring,
        contribution_percent: contribution,
      });
      setCheckoutUrl(data.url);
    } catch {
      Alert.alert("Erreur", "Impossible de démarrer le paiement. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  function handleNavChange(navState: { url: string }) {
    if (navState.url.includes("/don/merci") || navState.url.includes("session_id=")) {
      setCheckoutUrl(null);
      setSuccess(true);
    }
    if (navState.url.includes("/don") && !navState.url.includes("merci")) {
      setCheckoutUrl(null);
    }
  }

  if (success) return (
    <View style={[styles.successWrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.successEmoji}>🎉</Text>
      <Text style={styles.successTitle}>Merci pour votre don !</Text>
      <Text style={styles.successSub}>
        Votre générosité aide concrètement des personnes en difficulté. Chaque euro compte.
      </Text>
      {user && <Text style={styles.successPoints}>+50 points de solidarité ajoutés ✨</Text>}
      <TouchableOpacity style={styles.successBtn} onPress={() => { setSuccess(false); setCustomAmount(""); setMessage(""); }}>
        <Text style={styles.successBtnText}>Faire un autre don</Text>
      </TouchableOpacity>
    </View>
  );

  if (checkoutUrl) return (
    <Modal visible animationType="slide">
      <View style={[styles.webviewWrap, { paddingTop: insets.top }]}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity onPress={() => setCheckoutUrl(null)} style={styles.webviewClose}>
            <Text style={styles.webviewCloseText}>✕ Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>Paiement sécurisé</Text>
          <View style={{ width: 80 }} />
        </View>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.wvLoader}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroTitle}>💚 Faire un don</Text>
        <Text style={styles.heroSub}>100% transparent · Zéro frais cachés</Text>
      </View>

      <View style={styles.content}>
        {/* Montant */}
        <Text style={styles.label}>Choisissez un montant</Text>
        <View style={styles.amountGrid}>
          {AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.amountBtn, amount === a && !customAmount && styles.amountBtnActive]}
              onPress={() => { setAmount(a); setCustomAmount(""); }}
            >
              <Text style={[styles.amountText, amount === a && !customAmount && styles.amountTextActive]}>
                {a / 100}€
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.customInput, customAmount && styles.customInputActive]}
          placeholder="Autre montant (ex: 15)"
          keyboardType="decimal-pad"
          value={customAmount}
          onChangeText={setCustomAmount}
          placeholderTextColor="#9ca3af"
        />

        {/* Récurrent */}
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchLabel}>Don mensuel récurrent</Text>
            <Text style={styles.switchSub}>Automatique chaque mois, annulable à tout moment</Text>
          </View>
          <Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: "#10b981" }} />
        </View>

        {/* Contribution plateforme */}
        <Text style={styles.label}>Contribution à Solivo (optionnel)</Text>
        <Text style={styles.labelSub}>Aide à maintenir la plateforme. 100% pour les associations sinon.</Text>
        <View style={styles.contribRow}>
          {CONTRIBUTIONS.map((c) => (
            <TouchableOpacity
              key={c.pct}
              style={[styles.contribBtn, contribution === c.pct && styles.contribBtnActive]}
              onPress={() => setContribution(c.pct)}
            >
              <Text style={[styles.contribPct, contribution === c.pct && styles.contribPctActive]}>{c.label}</Text>
              {c.desc ? <Text style={styles.contribDesc}>{c.desc}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Récapitulatif */}
        <View style={styles.recap}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Votre don</Text>
            <Text style={styles.recapVal}>{(finalAmount / 100).toFixed(2)}€</Text>
          </View>
          {contribution > 0 && (
            <View style={styles.recapRow}>
              <Text style={styles.recapLabel}>Dont plateforme ({contribution}%)</Text>
              <Text style={styles.recapVal}>{(platformFee / 100).toFixed(2)}€</Text>
            </View>
          )}
          <View style={[styles.recapRow, styles.recapTotal]}>
            <Text style={styles.recapTotalLabel}>Pour l'association</Text>
            <Text style={styles.recapTotalVal}>{(assoAmount / 100).toFixed(2)}€ {recurring ? "/mois" : ""}</Text>
          </View>
        </View>

        {/* Anonymat */}
        {user && (
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Text style={styles.switchLabel}>Don anonyme</Text>
              <Text style={styles.switchSub}>Votre nom n'apparaîtra pas dans le bilan</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ true: "#6b7280" }} />
          </View>
        )}

        {/* Message */}
        <Text style={styles.label}>Message (optionnel)</Text>
        <TextInput
          style={[styles.msgInput]}
          placeholder="Un mot pour les bénéficiaires..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          placeholderTextColor="#9ca3af"
        />

        {!user && (
          <View style={styles.anonBanner}>
            <Text style={styles.anonText}>
              💡 Vous donnez sans compte. Créez un profil pour suivre vos dons et gagner des points de solidarité.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={startCheckout} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {recurring ? `🔁 S'abonner à ${(finalAmount / 100).toFixed(2)}€/mois` : `💚 Donner ${(finalAmount / 100).toFixed(2)}€`}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.secureNote}>🔒 Paiement sécurisé par Stripe · CB, Apple Pay, Google Pay</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  hero: { backgroundColor: "#10b981", paddingHorizontal: 20, paddingBottom: 28 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroSub: { color: "#a7f3d0", fontSize: 13, marginTop: 4 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8, marginTop: 16 },
  labelSub: { fontSize: 12, color: "#6b7280", marginTop: -6, marginBottom: 8 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amountBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff", minWidth: "30%" },
  amountBtnActive: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  amountText: { fontWeight: "700", color: "#374151", fontSize: 16, textAlign: "center" },
  amountTextActive: { color: "#10b981" },
  customInput: { marginTop: 10, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#111" },
  customInputActive: { borderColor: "#10b981" },
  switchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 16, marginTop: 12, gap: 12 },
  switchLeft: { flex: 1 },
  switchLabel: { fontWeight: "600", color: "#111827", fontSize: 14 },
  switchSub: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  contribRow: { flexDirection: "row", gap: 8 },
  contribBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#fff", paddingVertical: 10, alignItems: "center" },
  contribBtnActive: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  contribPct: { fontWeight: "800", fontSize: 15, color: "#374151" },
  contribPctActive: { color: "#10b981" },
  contribDesc: { fontSize: 9, color: "#9ca3af", marginTop: 2 },
  recap: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  recapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  recapLabel: { color: "#6b7280", fontSize: 13 },
  recapVal: { color: "#374151", fontSize: 13, fontWeight: "600" },
  recapTotal: { borderTopWidth: 1, borderTopColor: "#f3f4f6", marginTop: 4, paddingTop: 10 },
  recapTotalLabel: { fontWeight: "700", color: "#111827", fontSize: 14 },
  recapTotalVal: { fontWeight: "800", color: "#10b981", fontSize: 16 },
  msgInput: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: "#111", textAlignVertical: "top", minHeight: 80, marginTop: 4 },
  anonBanner: { backgroundColor: "#fef3c7", borderRadius: 12, padding: 14, marginTop: 12 },
  anonText: { color: "#92400e", fontSize: 13, lineHeight: 18 },
  submitBtn: { backgroundColor: "#10b981", borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 20, elevation: 2, shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 8 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  secureNote: { textAlign: "center", color: "#9ca3af", fontSize: 11, marginTop: 12, marginBottom: 8 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#f9fafb" },
  successEmoji: { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successSub: { color: "#6b7280", textAlign: "center", lineHeight: 22, marginBottom: 12 },
  successPoints: { color: "#10b981", fontWeight: "700", fontSize: 14, marginBottom: 24 },
  successBtn: { backgroundColor: "#10b981", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  successBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  webviewWrap: { flex: 1, backgroundColor: "#fff" },
  webviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  webviewClose: { width: 80 },
  webviewCloseText: { color: "#ef4444", fontWeight: "600" },
  webviewTitle: { fontWeight: "700", color: "#111827" },
  wvLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
