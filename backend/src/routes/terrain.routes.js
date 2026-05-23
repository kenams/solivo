const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/maraudes/:id/rapport", authRequired, async (req, res, next) => {
  try {
    const { personnes_rencontrees, repas_distribues, kits_distribues, orientations, bilan_qualitatif, incidents, besoins_identifies, zone_couverte, duree_heures } = req.body;
    const rapport = await supa(supabase.from("maraude_rapports")
      .upsert({ maraude_id: req.params.id, redige_par: req.user.sub, personnes_rencontrees, repas_distribues, kits_distribues, orientations, bilan_qualitatif, incidents, besoins_identifies, zone_couverte, duree_heures }, { onConflict: "maraude_id" })
      .select().single());
    await supabase.from("maraudes").update({ status: "completed", beneficiaries_helped: personnes_rencontrees || 0 }).eq("id", req.params.id);
    return res.status(201).json(rapport);
  } catch (err) { next(err); }
});

router.get("/maraudes/:id/rapport", async (req, res, next) => {
  try {
    const { data } = await supabase.from("maraude_rapports")
      .select("*, users!redige_par(name)").eq("maraude_id", req.params.id).maybeSingle();
    return res.json(data ? { ...data, redige_par_name: data.users?.name, users: undefined } : null);
  } catch (err) { next(err); }
});

router.get("/maraudes/:id/messages", authRequired, async (req, res, next) => {
  try {
    const { data } = await supabase.from("team_messages")
      .select("*, users!sender_id(name, avatar_url)").eq("maraude_id", req.params.id)
      .order("created_at", { ascending: true }).limit(100);
    return res.json((data || []).map(m => ({ ...m, sender_name: m.users?.name, sender_avatar: m.users?.avatar_url, users: undefined })));
  } catch (err) { next(err); }
});

router.post("/maraudes/:id/messages", authRequired, async (req, res, next) => {
  try {
    const { content, type = "text", lat, lng } = req.body;
    if (!content) return res.status(400).json({ error: "content_required" });
    const msg = await supa(supabase.from("team_messages")
      .insert({ maraude_id: req.params.id, sender_id: req.user.sub, content, type, lat, lng })
      .select().single());
    return res.status(201).json(msg);
  } catch (err) { next(err); }
});

router.post("/maraudes/:id/position", authRequired, async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: "lat_lng_required" });
    await supabase.from("team_positions")
      .upsert({ maraude_id: req.params.id, user_id: req.user.sub, lat, lng, updated_at: new Date().toISOString() }, { onConflict: "maraude_id,user_id" });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/maraudes/:id/positions", authRequired, async (req, res, next) => {
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data } = await supabase.from("team_positions")
      .select("*, users!user_id(name, avatar_url)").eq("maraude_id", req.params.id).gt("updated_at", tenMinsAgo);
    return res.json((data || []).map(p => ({ ...p, name: p.users?.name, avatar_url: p.users?.avatar_url, users: undefined })));
  } catch (err) { next(err); }
});

router.get("/stocks/:association_id", authRequired, async (req, res, next) => {
  try {
    const { data } = await supabase.from("stocks").select("*").eq("association_id", req.params.association_id).order("categorie");
    return res.json(data || []);
  } catch (err) { next(err); }
});

router.post("/stocks/:association_id", authRequired, async (req, res, next) => {
  try {
    const { item, categorie, quantite, unite } = req.body;
    const s = await supa(supabase.from("stocks")
      .insert({ association_id: req.params.association_id, item, categorie, quantite, unite }).select().single());
    return res.status(201).json(s);
  } catch (err) { next(err); }
});

router.patch("/stocks/:id", authRequired, async (req, res, next) => {
  try {
    const { quantite } = req.body;
    const s = await supa(supabase.from("stocks").update({ quantite, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single());
    return res.json(s);
  } catch (err) { next(err); }
});

router.get("/alertes", async (req, res, next) => {
  try {
    const { city } = req.query;
    const now = new Date().toISOString();
    let q = supabase.from("alertes").select("*").eq("active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`).order("created_at", { ascending: false });
    if (city) q = q.ilike("city", `%${city}%`);
    const { data } = await q;
    return res.json(data || []);
  } catch (err) { next(err); }
});

router.post("/alertes", authRequired, async (req, res, next) => {
  try {
    const { type, titre, description, city, lat, lng, niveau, expires_at } = req.body;
    if (!type || !titre) return res.status(400).json({ error: "missing_fields" });
    if (niveau && !["info", "warning", "critical"].includes(niveau))
      return res.status(400).json({ error: "invalid_niveau", valid: ["info", "warning", "critical"] });
    const a = await supa(supabase.from("alertes")
      .insert({ type, titre, description, city, lat, lng, niveau, expires_at, created_by: req.user.sub }).select().single());
    return res.status(201).json(a);
  } catch (err) { next(err); }
});

router.get("/collectes", async (req, res, next) => {
  try {
    const { city } = req.query;
    const now = new Date().toISOString();
    let q = supabase.from("collectes").select("*, associations!association_id(name)")
      .eq("status", "active").or(`date_fin.is.null,date_fin.gt.${now}`).order("created_at", { ascending: false });
    if (city) q = q.ilike("lieu_depot", `%${city}%`);
    const { data } = await q;
    return res.json((data || []).map(c => ({ ...c, association_name: c.associations?.name, associations: undefined })));
  } catch (err) { next(err); }
});

router.post("/collectes", authRequired, async (req, res, next) => {
  try {
    const { association_id, titre, description, items_recherches, lieu_depot, lat, lng, date_fin } = req.body;
    if (!titre) return res.status(400).json({ error: "titre_required" });
    const c = await supa(supabase.from("collectes")
      .insert({ association_id, titre, description, items_recherches, lieu_depot, lat, lng, date_fin }).select().single());
    return res.status(201).json(c);
  } catch (err) { next(err); }
});

module.exports = router;
