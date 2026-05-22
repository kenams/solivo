const express = require("express");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// Liste des bénéficiaires d'une association
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { association_id, statut = "actif", limit = 50, offset = 0 } = req.query;
    let q = db("beneficiaires").where({ statut }).orderBy("last_seen_at", "desc").limit(parseInt(limit)).offset(parseInt(offset));
    if (association_id) q = q.where({ association_id });
    return res.json(await q);
  } catch (err) { next(err); }
});

// Créer un bénéficiaire
router.post("/", authRequired, async (req, res, next) => {
  try {
    const { association_id, pseudonym, age_approx, genre, situation, besoins, zone_habituelle, notes, consentement } = req.body;
    if (!pseudonym) return res.status(400).json({ error: "pseudonym_required" });
    const [b] = await db("beneficiaires")
      .insert({ association_id, pseudonym, age_approx, genre, situation, besoins, zone_habituelle, notes, consentement })
      .returning("*");
    return res.status(201).json(b);
  } catch (err) { next(err); }
});

// Détail d'un bénéficiaire + historique rencontres
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const b = await db("beneficiaires").where({ id: req.params.id }).first();
    if (!b) return res.status(404).json({ error: "not_found" });
    const rencontres = await db("rencontres as r")
      .leftJoin("maraudes as m", "r.maraude_id", "m.id")
      .leftJoin("users as u", "r.reported_by", "u.id")
      .select("r.*", "m.title as maraude_title", "m.date_start", "u.name as reported_by_name")
      .where({ "r.beneficiaire_id": req.params.id })
      .orderBy("r.created_at", "desc");
    return res.json({ ...b, rencontres });
  } catch (err) { next(err); }
});

// Mettre à jour un bénéficiaire
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const { statut, situation, besoins, notes, last_seen_lat, last_seen_lng } = req.body;
    const update = { updated_at: new Date() };
    if (statut) update.statut = statut;
    if (situation) update.situation = situation;
    if (besoins) update.besoins = besoins;
    if (notes) update.notes = notes;
    if (last_seen_lat) { update.last_seen_lat = last_seen_lat; update.last_seen_lng = last_seen_lng; update.last_seen_at = new Date(); }
    const [b] = await db("beneficiaires").where({ id: req.params.id }).update(update).returning("*");
    return res.json(b);
  } catch (err) { next(err); }
});

// Enregistrer une rencontre
router.post("/:id/rencontres", authRequired, async (req, res, next) => {
  try {
    const { maraude_id, lat, lng, note, dons_materiel, etat_general, oriente_structure, structure_orientation } = req.body;
    const [r] = await db("rencontres")
      .insert({ beneficiaire_id: req.params.id, maraude_id, lat, lng, note, dons_materiel, etat_general, oriente_structure, structure_orientation, reported_by: req.user.sub })
      .returning("*");
    // Mettre à jour last_seen
    await db("beneficiaires").where({ id: req.params.id }).update({ last_seen_lat: lat, last_seen_lng: lng, last_seen_at: new Date() });
    return res.status(201).json(r);
  } catch (err) { next(err); }
});

// Stats globales bénéficiaires
router.get("/stats/global", authRequired, async (req, res, next) => {
  try {
    const { association_id } = req.query;
    let q = db("beneficiaires");
    if (association_id) q = q.where({ association_id });

    const total = await q.clone().count("id as count").first();
    const par_statut = await q.clone().groupBy("statut").select("statut").count("id as count");
    const reloges = await q.clone().where({ statut: "relogé" }).count("id as count").first();
    const rencontres_total = await db("rencontres").count("id as count").first();

    return res.json({
      total: parseInt(total?.count || 0),
      par_statut,
      reloges: parseInt(reloges?.count || 0),
      rencontres_total: parseInt(rencontres_total?.count || 0),
    });
  } catch (err) { next(err); }
});

module.exports = router;
