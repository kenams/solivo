const express = require("express");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// ── RAPPORT POST-MARAUDE ─────────────────────────────────────────────────────

router.post("/maraudes/:id/rapport", authRequired, async (req, res, next) => {
  try {
    const { personnes_rencontrees, repas_distribues, kits_distribues, orientations, bilan_qualitatif, incidents, besoins_identifies, zone_couverte, duree_heures } = req.body;
    const [rapport] = await db("maraude_rapports")
      .insert({ maraude_id: req.params.id, redige_par: req.user.sub, personnes_rencontrees, repas_distribues, kits_distribues, orientations, bilan_qualitatif, incidents, besoins_identifies, zone_couverte, duree_heures })
      .onConflict("maraude_id").merge()
      .returning("*");

    await db("maraudes").where({ id: req.params.id }).update({
      status: "completed",
      beneficiaries_helped: personnes_rencontrees || 0,
    });

    return res.status(201).json(rapport);
  } catch (err) { next(err); }
});

router.get("/maraudes/:id/rapport", async (req, res, next) => {
  try {
    const rapport = await db("maraude_rapports as r")
      .leftJoin("users as u", "r.redige_par", "u.id")
      .select("r.*", "u.name as redige_par_name")
      .where({ "r.maraude_id": req.params.id })
      .first();
    return res.json(rapport || null);
  } catch (err) { next(err); }
});

// ── MESSAGERIE ÉQUIPE ────────────────────────────────────────────────────────

router.get("/maraudes/:id/messages", authRequired, async (req, res, next) => {
  try {
    const messages = await db("team_messages as m")
      .join("users as u", "m.sender_id", "u.id")
      .select("m.*", "u.name as sender_name", "u.avatar_url as sender_avatar")
      .where({ "m.maraude_id": req.params.id })
      .orderBy("m.created_at", "asc")
      .limit(100);
    return res.json(messages);
  } catch (err) { next(err); }
});

router.post("/maraudes/:id/messages", authRequired, async (req, res, next) => {
  try {
    const { content, type = "text", lat, lng } = req.body;
    if (!content) return res.status(400).json({ error: "content_required" });
    const [msg] = await db("team_messages")
      .insert({ maraude_id: req.params.id, sender_id: req.user.sub, content, type, lat, lng })
      .returning("*");
    return res.status(201).json(msg);
  } catch (err) { next(err); }
});

// ── POSITIONS LIVE ───────────────────────────────────────────────────────────

router.post("/maraudes/:id/position", authRequired, async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: "lat_lng_required" });
    await db("team_positions")
      .insert({ maraude_id: req.params.id, user_id: req.user.sub, lat, lng, updated_at: new Date() })
      .onConflict(["maraude_id", "user_id"]).merge();
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/maraudes/:id/positions", authRequired, async (req, res, next) => {
  try {
    const positions = await db("team_positions as tp")
      .join("users as u", "tp.user_id", "u.id")
      .select("tp.*", "u.name", "u.avatar_url")
      .where({ "tp.maraude_id": req.params.id })
      .whereRaw("tp.updated_at > NOW() - INTERVAL '10 minutes'");
    return res.json(positions);
  } catch (err) { next(err); }
});

// ── STOCKS ───────────────────────────────────────────────────────────────────

router.get("/stocks/:association_id", authRequired, async (req, res, next) => {
  try {
    return res.json(await db("stocks").where({ association_id: req.params.association_id }).orderBy("categorie"));
  } catch (err) { next(err); }
});

router.post("/stocks/:association_id", authRequired, async (req, res, next) => {
  try {
    const { item, categorie, quantite, unite } = req.body;
    const [s] = await db("stocks").insert({ association_id: req.params.association_id, item, categorie, quantite, unite }).returning("*");
    return res.status(201).json(s);
  } catch (err) { next(err); }
});

router.patch("/stocks/:id", authRequired, async (req, res, next) => {
  try {
    const { quantite } = req.body;
    const [s] = await db("stocks").where({ id: req.params.id }).update({ quantite, updated_at: new Date() }).returning("*");
    return res.json(s);
  } catch (err) { next(err); }
});

// ── ALERTES (grand froid, urgences) ─────────────────────────────────────────

router.get("/alertes", async (req, res, next) => {
  try {
    const { city } = req.query;
    let q = db("alertes").where({ active: true }).whereRaw("(expires_at IS NULL OR expires_at > NOW())").orderBy("created_at", "desc");
    if (city) q = q.whereILike("city", `%${city}%`);
    return res.json(await q);
  } catch (err) { next(err); }
});

router.post("/alertes", authRequired, async (req, res, next) => {
  try {
    const { type, titre, description, city, lat, lng, niveau, expires_at } = req.body;
    if (!type || !titre) return res.status(400).json({ error: "missing_fields" });
    const [a] = await db("alertes").insert({ type, titre, description, city, lat, lng, niveau, expires_at, created_by: req.user.sub }).returning("*");
    return res.status(201).json(a);
  } catch (err) { next(err); }
});

// ── COLLECTES ────────────────────────────────────────────────────────────────

router.get("/collectes", async (req, res, next) => {
  try {
    const { city } = req.query;
    let q = db("collectes as c")
      .leftJoin("associations as a", "c.association_id", "a.id")
      .select("c.*", "a.name as association_name")
      .where("c.status", "active")
      .whereRaw("(c.date_fin IS NULL OR c.date_fin > NOW())")
      .orderBy("c.created_at", "desc");
    if (city) q = q.whereILike("c.lieu_depot", `%${city}%`);
    return res.json(await q);
  } catch (err) { next(err); }
});

router.post("/collectes", authRequired, async (req, res, next) => {
  try {
    const { association_id, titre, description, items_recherches, lieu_depot, lat, lng, date_fin } = req.body;
    if (!titre) return res.status(400).json({ error: "titre_required" });
    const [c] = await db("collectes").insert({ association_id, titre, description, items_recherches, lieu_depot, lat, lng, date_fin }).returning("*");
    return res.status(201).json(c);
  } catch (err) { next(err); }
});

module.exports = router;
