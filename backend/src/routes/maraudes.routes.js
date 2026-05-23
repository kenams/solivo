const express = require("express");
const { db } = require("../config/db");
const { authRequired, optionalAuth } = require("../middleware/auth");
const { addPoints } = require("../services/users.service");

const router = express.Router();

// Liste des maraudes
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { city, status = "upcoming", limit = 20, offset = 0 } = req.query;
    let q = db("maraudes as m")
      .leftJoin("associations as a", "m.association_id", "a.id")
      .leftJoin("users as u", "m.created_by", "u.id")
      .select(
        "m.*",
        "a.name as association_name",
        "a.logo_url as association_logo",
        "u.name as organizer_name",
        "u.avatar_url as organizer_avatar"
      )
      .where("m.status", status)
      .orderBy("m.date_start", "asc")
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (city) q = q.whereILike("m.city", `%${city}%`);

    const maraudes = await q;

    // Vérifier si l'utilisateur est inscrit
    if (req.user) {
      const myJoins = await db("maraude_participants")
        .where({ user_id: req.user.sub })
        .pluck("maraude_id");
      const mySet = new Set(myJoins);
      maraudes.forEach(m => m.is_joined = mySet.has(m.id));
    }

    return res.json({ maraudes, total: maraudes.length });
  } catch (err) { next(err); }
});

// Détail d'une maraude
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const maraude = await db("maraudes as m")
      .leftJoin("associations as a", "m.association_id", "a.id")
      .leftJoin("users as u", "m.created_by", "u.id")
      .select("m.*", "a.name as association_name", "a.logo_url as association_logo", "u.name as organizer_name")
      .where("m.id", req.params.id)
      .first();

    if (!maraude) return res.status(404).json({ error: "not_found" });

    const participants = await db("maraude_participants as mp")
      .join("users as u", "mp.user_id", "u.id")
      .select("u.id", "u.name", "u.avatar_url", "mp.status")
      .where("mp.maraude_id", maraude.id);

    const is_joined = req.user
      ? !!(await db("maraude_participants").where({ maraude_id: maraude.id, user_id: req.user.sub }).first())
      : false;

    return res.json({ ...maraude, participants, is_joined });
  } catch (err) { next(err); }
});

// Créer une maraude
router.post("/", authRequired, async (req, res, next) => {
  try {
    const { title, description, date_start, date_end, meeting_point, lat, lng, city, max_volunteers, association_id } = req.body;
    if (!title || !date_start || !meeting_point || !lat || !lng)
      return res.status(400).json({ error: "missing_fields" });

    // Si association_id fourni, vérifier que l'utilisateur en est le propriétaire
    if (association_id) {
      const asso = await db("associations").where({ id: association_id }).first();
      if (!asso) return res.status(404).json({ error: "association_not_found" });
      if (asso.created_by !== req.user.sub && req.user.role !== "admin")
        return res.status(403).json({ error: "forbidden_not_owner" });
    }

    const [maraude] = await db("maraudes")
      .insert({ title, description, date_start, date_end, meeting_point, lat, lng, city, max_volunteers, association_id: association_id || null, created_by: req.user.sub })
      .returning("*");

    return res.status(201).json(maraude);
  } catch (err) { next(err); }
});

// S'inscrire à une maraude
router.post("/:id/join", authRequired, async (req, res, next) => {
  try {
    const maraude = await db("maraudes").where({ id: req.params.id }).first();
    if (!maraude) return res.status(404).json({ error: "not_found" });
    if (maraude.status !== "upcoming") return res.status(400).json({ error: "maraude_not_upcoming" });
    if (maraude.volunteers_count >= maraude.max_volunteers) return res.status(400).json({ error: "maraude_full" });

    const existing = await db("maraude_participants").where({ maraude_id: maraude.id, user_id: req.user.sub }).first();
    if (existing) return res.status(409).json({ error: "already_joined" });

    await db("maraude_participants").insert({ maraude_id: maraude.id, user_id: req.user.sub });
    await db("maraudes").where({ id: maraude.id }).increment("volunteers_count", 1);
    await addPoints(req.user.sub, 10);

    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// Se désinscrire
router.delete("/:id/join", authRequired, async (req, res, next) => {
  try {
    await db("maraude_participants").where({ maraude_id: req.params.id, user_id: req.user.sub }).delete();
    await db("maraudes").where({ id: req.params.id }).decrement("volunteers_count", 1);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// Terminer une maraude (créateur/admin)
router.patch("/:id/complete", authRequired, async (req, res, next) => {
  try {
    const maraude = await db("maraudes").where({ id: req.params.id }).first();
    if (!maraude) return res.status(404).json({ error: "not_found" });
    if (maraude.created_by !== req.user.sub && req.user.role !== "admin")
      return res.status(403).json({ error: "forbidden" });

    const { beneficiaries_helped } = req.body;
    await db("maraudes").where({ id: req.params.id }).update({
      status: "completed",
      beneficiaries_helped: beneficiaries_helped || 0,
    });

    // Points pour les participants
    const participants = await db("maraude_participants").where({ maraude_id: req.params.id }).pluck("user_id");
    for (const uid of participants) {
      await addPoints(uid, 50);
      await db("users").where({ id: uid }).increment("maraudes_count", 1);
    }

    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
