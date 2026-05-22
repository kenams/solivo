import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, FlatList, ActivityIndicator, Vibration
} from "react-native";
import * as Location from "expo-location";
import { api } from "../lib/api";

interface TeamMessage {
  id: string; sender_name: string; content: string;
  type: string; created_at: string;
}

interface TeamMember {
  id: string; name: string; lat: number; lng: number; updated_at: string;
}

interface Beneficiaire {
  id: string; pseudonym: string; statut: string;
  last_seen_at: string; situation: string;
}

const PHASES = [
  { key: "prep", emoji: "👨‍🍳", label: "Préparation" },
  { key: "depart", emoji: "🚀", label: "Départ" },
  { key: "terrain", emoji: "🗺️", label: "Terrain" },
  { key: "retour", emoji: "📋", label: "Retour & Bilan" },
];

const DONS = ["repas", "boisson", "couverture", "vêtements", "kit_hygiene", "médicament", "autre"];

export function TerrainScreen({ route }: { route: { params: { maraudeId: string; maraudeTitle: string } } }) {
  const { maraudeId, maraudeTitle } = route.params;
  const [phase, setPhase] = useState(0);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBenefModal, setShowBenefModal] = useState(false);
  const [showRapportModal, setShowRapportModal] = useState(false);
  const [newBenef, setNewBenef] = useState({ pseudonym: "", genre: "inconnu", situation: "rue", dons: [] as string[], etat_general: "moyen", note: "" });
  const [rapport, setRapport] = useState({ personnes_rencontrees: "", repas_distribues: "", kits_distribues: "", orientations: "", bilan_qualitatif: "", duree_heures: "" });
  const posInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    startPositionBroadcast();
    const msgInterval = setInterval(loadMessages, 15000);
    return () => {
      clearInterval(msgInterval);
      if (posInterval.current) clearInterval(posInterval.current);
    };
  }, []);

  async function loadData() {
    try {
      const [msgs, mbrs] = await Promise.all([
        api.get(`/terrain/maraudes/${maraudeId}/messages`),
        api.get(`/terrain/maraudes/${maraudeId}/positions`),
      ]);
      setMessages(msgs);
      setMembers(mbrs);
    } catch {}
  }

  async function loadMessages() {
    try {
      const msgs = await api.get(`/terrain/maraudes/${maraudeId}/messages`);
      setMessages(msgs);
    } catch {}
  }

  function startPositionBroadcast() {
    posInterval.current = setInterval(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      api.post(`/terrain/maraudes/${maraudeId}/position`, {
        lat: loc.coords.latitude, lng: loc.coords.longitude
      }).catch(() => {});
    }, 30000);
  }

  async function sendMessage(type = "text") {
    if (!msgInput.trim() && type === "text") return;
    const content = type === "alert" ? `🚨 ALERTE: ${msgInput}` : msgInput;
    try {
      const msg = await api.post(`/terrain/maraudes/${maraudeId}/messages`, { content, type });
      setMessages(prev => [...prev, msg]);
      setMsgInput("");
      if (type === "alert") Vibration.vibrate([0, 100, 100, 100]);
    } catch { Alert.alert("Erreur", "Message non envoyé"); }
  }

  async function saveRencontre() {
    if (!newBenef.pseudonym) {
      Alert.alert("Requis", "Saisissez un pseudonyme (ex: 'Homme barbe rouge métro Châtelet')");
      return;
    }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat, lng;
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      // Créer ou trouver le bénéficiaire (par pseudonyme unique pour l'asso)
      let benef;
      try {
        benef = await api.post("/beneficiaires", {
          pseudonym: newBenef.pseudonym,
          genre: newBenef.genre,
          situation: newBenef.situation,
          consentement: false,
        });
      } catch {
        // Peut déjà exister — on continue
        benef = { id: null };
      }

      if (benef.id) {
        await api.post(`/beneficiaires/${benef.id}/rencontres`, {
          maraude_id: maraudeId, lat, lng,
          note: newBenef.note,
          dons_materiel: newBenef.dons,
          etat_general: newBenef.etat_general,
        });
        setBeneficiaires(prev => [...prev, benef]);
      }

      setShowBenefModal(false);
      setNewBenef({ pseudonym: "", genre: "inconnu", situation: "rue", dons: [], etat_general: "moyen", note: "" });
      Alert.alert("✅ Rencontre enregistrée", "La fiche a été sauvegardée.");
    } catch { Alert.alert("Erreur", "Impossible de sauvegarder"); }
    finally { setLoading(false); }
  }

  async function submitRapport() {
    setLoading(true);
    try {
      await api.post(`/terrain/maraudes/${maraudeId}/rapport`, {
        personnes_rencontrees: parseInt(rapport.personnes_rencontrees) || beneficiaires.length,
        repas_distribues: parseInt(rapport.repas_distribues) || 0,
        kits_distribues: parseInt(rapport.kits_distribues) || 0,
        orientations: parseInt(rapport.orientations) || 0,
        bilan_qualitatif: rapport.bilan_qualitatif,
        duree_heures: parseFloat(rapport.duree_heures) || 0,
      });
      setShowRapportModal(false);
      Alert.alert("✅ Rapport soumis", "Maraude terminée. Merci pour votre engagement !");
    } catch { Alert.alert("Erreur", "Impossible de soumettre le rapport"); }
    finally { setLoading(false); }
  }

  function toggleDon(d: string) {
    setNewBenef(b => ({ ...b, dons: b.dons.includes(d) ? b.dons.filter(x => x !== d) : [...b.dons, d] }));
  }

  return (
    <View style={styles.container}>
      {/* Header phase */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ {maraudeTitle}</Text>
        <Text style={styles.headerSub}>Mode terrain actif</Text>
      </View>

      {/* Phases */}
      <View style={styles.phases}>
        {PHASES.map((p, i) => (
          <TouchableOpacity key={p.key} onPress={() => setPhase(i)}
            style={[styles.phaseBtn, phase === i && styles.phaseBtnActive]}>
            <Text style={styles.phaseEmoji}>{p.emoji}</Text>
            <Text style={[styles.phaseLabel, phase === i && styles.phaseLabelActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        {/* Phase 0 — Préparation */}
        {phase === 0 && (
          <View>
            <Text style={styles.sectionTitle}>👨‍🍳 Checklist préparation</Text>
            {["Repas préparés et emballés", "Boissons chaudes (thermos)", "Kits d'hygiène", "Couvertures et vêtements", "Liste des centres d'hébergement", "Téléphones chargés", "Binômes définis", "Briefing sécurité fait"].map(item => (
              <View key={item} style={styles.checkItem}>
                <Text style={styles.checkEmoji}>☐</Text>
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🤝 Équipe aujourd'hui ({members.length} bénévoles)</Text>
              {members.map(m => <Text key={m.id} style={styles.infoText}>• {m.name}</Text>)}
            </View>
          </View>
        )}

        {/* Phase 1 — Départ */}
        {phase === 1 && (
          <View>
            <Text style={styles.sectionTitle}>🚀 Règles de sécurité terrain</Text>
            {[
              "Ne jamais partir seul — restez en binôme minimum",
              "Partagez votre position toutes les 30 minutes",
              "En urgence médicale : 15 (SAMU) ou 18 (Pompiers)",
              "Ne pas insister si quelqu'un refuse votre aide",
              "Signalez tout incident via le bouton ALERTE",
              "Numéro urgence association : à configurer",
            ].map((r, i) => (
              <View key={i} style={styles.ruleItem}>
                <Text style={styles.ruleNum}>{i + 1}</Text>
                <Text style={styles.ruleText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Phase 2 — Terrain */}
        {phase === 2 && (
          <View>
            <View style={styles.terrainActions}>
              <TouchableOpacity style={styles.bigBtn} onPress={() => setShowBenefModal(true)}>
                <Text style={styles.bigBtnEmoji}>👤</Text>
                <Text style={styles.bigBtnLabel}>Nouvelle rencontre</Text>
                <Text style={styles.bigBtnSub}>Enregistrer une personne aidée</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bigBtn, styles.bigBtnAlert]} onPress={() => {
                setMsgInput("BESOIN D'AIDE en ");
                Alert.prompt("🚨 Alerte équipe", "Décrivez l'urgence :", (text) => {
                  if (text) api.post(`/terrain/maraudes/${maraudeId}/messages`, { content: `🚨 ALERTE: ${text}`, type: "alert" });
                });
              }}>
                <Text style={styles.bigBtnEmoji}>🚨</Text>
                <Text style={styles.bigBtnLabel}>Alerte équipe</Text>
                <Text style={styles.bigBtnSub}>Signal d'urgence immédiat</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>💬 Messages équipe</Text>
            <View style={styles.chatBox}>
              {messages.slice(-5).map(m => (
                <View key={m.id} style={[styles.msg, m.type === "alert" && styles.msgAlert]}>
                  <Text style={styles.msgSender}>{m.sender_name}</Text>
                  <Text style={styles.msgContent}>{m.content}</Text>
                </View>
              ))}
            </View>
            <View style={styles.msgInput}>
              <TextInput style={styles.msgField} value={msgInput} onChangeText={setMsgInput}
                placeholder="Message à l'équipe..." placeholderTextColor="#9ca3af" />
              <TouchableOpacity style={styles.msgSendBtn} onPress={() => sendMessage()}>
                <Text style={styles.msgSendText}>→</Text>
              </TouchableOpacity>
            </View>

            {beneficiaires.length > 0 && (
              <View style={styles.counterCard}>
                <Text style={styles.counterNum}>{beneficiaires.length}</Text>
                <Text style={styles.counterLabel}>personnes rencontrées ce soir</Text>
              </View>
            )}
          </View>
        )}

        {/* Phase 3 — Retour */}
        {phase === 3 && (
          <View>
            <Text style={styles.sectionTitle}>📋 Bilan de la maraude</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{beneficiaires.length}</Text>
                <Text style={styles.statLabel}>Rencontres</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{messages.length}</Text>
                <Text style={styles.statLabel}>Messages échangés</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.rapportBtn} onPress={() => setShowRapportModal(true)}>
              <Text style={styles.rapportBtnText}>📋 Rédiger le rapport officiel</Text>
            </TouchableOpacity>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📌 Rappels post-maraude</Text>
              {["Signaler les incidents à votre responsable", "Mettre à jour les fiches des personnes suivies", "Partager les besoins identifiés", "Recharger les stocks pour la prochaine maraude"].map((r, i) => (
                <Text key={i} style={styles.infoText}>• {r}</Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal rencontre */}
      <Modal visible={showBenefModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>👤 Nouvelle rencontre</Text>
            <TouchableOpacity onPress={() => setShowBenefModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.fieldLabel}>Pseudonyme descriptif *</Text>
            <TextInput style={styles.field} value={newBenef.pseudonym}
              onChangeText={v => setNewBenef(b => ({ ...b, pseudonym: v }))}
              placeholder="Ex: Homme veste rouge, place de la gare" placeholderTextColor="#9ca3af"
            />

            <Text style={styles.fieldLabel}>Genre</Text>
            <View style={styles.radioRow}>
              {["homme", "femme", "autre", "inconnu"].map(g => (
                <TouchableOpacity key={g} style={[styles.radioBtn, newBenef.genre === g && styles.radioBtnActive]}
                  onPress={() => setNewBenef(b => ({ ...b, genre: g }))}>
                  <Text style={styles.radioBtnText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Situation</Text>
            <View style={styles.radioRow}>
              {["rue", "squat", "hébergement", "véhicule"].map(s => (
                <TouchableOpacity key={s} style={[styles.radioBtn, newBenef.situation === s && styles.radioBtnActive]}
                  onPress={() => setNewBenef(b => ({ ...b, situation: s }))}>
                  <Text style={styles.radioBtnText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>État général</Text>
            <View style={styles.radioRow}>
              {[["bon", "🟢"], ["moyen", "🟡"], ["mauvais", "🔴"], ["urgence", "🚨"]].map(([e, ic]) => (
                <TouchableOpacity key={e} style={[styles.radioBtn, newBenef.etat_general === e && styles.radioBtnActive]}
                  onPress={() => setNewBenef(b => ({ ...b, etat_general: e }))}>
                  <Text style={styles.radioBtnText}>{ic} {e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Dons effectués</Text>
            <View style={styles.donGrid}>
              {DONS.map(d => (
                <TouchableOpacity key={d} style={[styles.donBtn, newBenef.dons.includes(d) && styles.donBtnActive]}
                  onPress={() => toggleDon(d)}>
                  <Text style={styles.donBtnText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Note (optionnel)</Text>
            <TextInput style={[styles.field, { height: 80, textAlignVertical: "top" }]}
              value={newBenef.note} onChangeText={v => setNewBenef(b => ({ ...b, note: v }))}
              placeholder="Besoins particuliers, suivi nécessaire..." placeholderTextColor="#9ca3af" multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveRencontre} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? "..." : "✓ Enregistrer la rencontre"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal rapport */}
      <Modal visible={showRapportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋 Rapport officiel</Text>
            <TouchableOpacity onPress={() => setShowRapportModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {[
              ["Personnes rencontrées", "personnes_rencontrees", "numeric"],
              ["Repas distribués", "repas_distribues", "numeric"],
              ["Kits distribués", "kits_distribues", "numeric"],
              ["Orientations vers structures", "orientations", "numeric"],
              ["Durée en heures", "duree_heures", "decimal-pad"],
            ].map(([label, key, kb]) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{label as string}</Text>
                <TextInput style={styles.field} keyboardType={kb as "numeric" | "decimal-pad"}
                  value={rapport[key as keyof typeof rapport]}
                  onChangeText={v => setRapport(r => ({ ...r, [key]: v }))}
                  placeholder="0" placeholderTextColor="#9ca3af"
                />
              </View>
            ))}
            <Text style={styles.fieldLabel}>Bilan qualitatif</Text>
            <TextInput style={[styles.field, { height: 100, textAlignVertical: "top" }]}
              value={rapport.bilan_qualitatif}
              onChangeText={v => setRapport(r => ({ ...r, bilan_qualitatif: v }))}
              placeholder="Ce qui s'est bien passé, difficultés rencontrées, besoins identifiés..."
              placeholderTextColor="#9ca3af" multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={submitRapport} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? "..." : "✓ Soumettre le rapport"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const EMERALD = "#10b981";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { backgroundColor: EMERALD, padding: 16, paddingTop: 20 },
  headerTitle: { color: "white", fontWeight: "800", fontSize: 17 },
  headerSub: { color: "#d1fae5", fontSize: 12, marginTop: 2 },
  phases: { flexDirection: "row", backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  phaseBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  phaseBtnActive: { borderBottomWidth: 2, borderBottomColor: EMERALD },
  phaseEmoji: { fontSize: 16 },
  phaseLabel: { fontSize: 9, color: "#9ca3af", marginTop: 2, fontWeight: "500" },
  phaseLabelActive: { color: EMERALD, fontWeight: "700" },
  content: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12 },
  checkItem: { flexDirection: "row", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  checkEmoji: { fontSize: 16 },
  checkText: { flex: 1, fontSize: 14, color: "#374151" },
  infoCard: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, marginTop: 16 },
  infoTitle: { fontWeight: "700", color: "#065f46", marginBottom: 6, fontSize: 13 },
  infoText: { color: "#047857", fontSize: 12, marginTop: 2 },
  ruleItem: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  ruleNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: EMERALD, color: "white", textAlign: "center", lineHeight: 24, fontWeight: "700", fontSize: 12 },
  ruleText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 20 },
  terrainActions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  bigBtn: { flex: 1, backgroundColor: EMERALD, borderRadius: 16, padding: 16, alignItems: "center" },
  bigBtnAlert: { backgroundColor: "#ef4444" },
  bigBtnEmoji: { fontSize: 28, marginBottom: 6 },
  bigBtnLabel: { color: "white", fontWeight: "800", fontSize: 13 },
  bigBtnSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, textAlign: "center", marginTop: 2 },
  chatBox: { backgroundColor: "white", borderRadius: 12, padding: 10, marginBottom: 8, minHeight: 80 },
  msg: { marginBottom: 6 },
  msgAlert: { backgroundColor: "#fef2f2", borderRadius: 8, padding: 6 },
  msgSender: { fontSize: 10, fontWeight: "700", color: "#10b981", marginBottom: 1 },
  msgContent: { fontSize: 12, color: "#374151" },
  msgInput: { flexDirection: "row", gap: 8, marginBottom: 16 },
  msgField: { flex: 1, backgroundColor: "white", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: "#111", borderWidth: 1, borderColor: "#e5e7eb" },
  msgSendBtn: { backgroundColor: EMERALD, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  msgSendText: { color: "white", fontWeight: "700", fontSize: 16 },
  counterCard: { backgroundColor: "#d1fae5", borderRadius: 12, padding: 16, alignItems: "center" },
  counterNum: { fontSize: 40, fontWeight: "900", color: "#065f46" },
  counterLabel: { color: "#047857", fontSize: 13 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: 16, alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "900", color: "#111827" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  rapportBtn: { backgroundColor: EMERALD, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  rapportBtnText: { color: "white", fontWeight: "800", fontSize: 15 },
  modal: { flex: 1, backgroundColor: "white" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modalClose: { fontSize: 20, color: "#9ca3af", fontWeight: "300" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 14, marginBottom: 6 },
  field: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111" },
  radioRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  radioBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white" },
  radioBtnActive: { borderColor: EMERALD, backgroundColor: "#d1fae5" },
  radioBtnText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  donGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  donBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white" },
  donBtnActive: { borderColor: EMERALD, backgroundColor: "#d1fae5" },
  donBtnText: { fontSize: 11, color: "#374151" },
  saveBtn: { backgroundColor: EMERALD, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "white", fontWeight: "800", fontSize: 15 },
});
