const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res, next) => {
  try {
    const { association_id, statut = "actif", limit = 50, offset = 0 } = req.query;
    let q = supabase.from("beneficiaires").select("*").eq("statut", statut)
      .order("last_seen_at", { ascending: false }).limit(parseInt(limit)).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    if (association_id) q = q.eq("association_id", association_id);
    const { data } = await q;
    return res.json(data || []);
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { association_id, pseudonym, age_approx, genre, situation, besoins, zone_habituelle, notes, consentement } = req.body;
    if (!pseudonym) return res.status(400).json({ error: "pseudonym_required" });
    const b = await supa(supabase.from("beneficiaires")
      .insert({ association_id, pseudonym, age_approx, genre, situation, besoins, zone_habituelle, notes, consentement })
      .select().single());
    return res.status(201).json(b);
  } catch (err) { next(err); }
});

router.get("/stats/global", authRequired, async (req, res, next) => {
  try {
    const { association_id } = req.query;
    const { data } = await supabase.rpc("sp_beneficiaires_stats", {
      p_association_id: association_id || null,
    });
    return res.json(data);
  } catch (err) { next(err); }
});

router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const { data: b } = await supabase.from("beneficiaires").select("*").eq("id", req.params.id).maybeSingle();
    if (!b) return res.status(404).json({ error: "not_found" });

    const { data: rencontres } = await supabase.from("rencontres")
      .select("*, maraudes!maraude_id(title, date_start), users!reported_by(name)")
      .eq("beneficiaire_id", req.params.id).order("created_at", { ascending: false });

    return res.json({
      ...b,
      rencontres: (rencontres || []).map(r => ({
        ...r, maraude_title: r.maraudes?.title, date_start: r.maraudes?.date_start,
        reported_by_name: r.users?.name, maraudes: undefined, users: undefined,
      })),
    });
  } catch (err) { next(err); }
});

router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const { statut, situation, besoins, notes, last_seen_lat, last_seen_lng } = req.body;
    const update = { updated_at: new Date().toISOString() };
    if (statut) update.statut = statut;
    if (situation) update.situation = situation;
    if (besoins) update.besoins = besoins;
    if (notes) update.notes = notes;
    if (last_seen_lat) { update.last_seen_lat = last_seen_lat; update.last_seen_lng = last_seen_lng; update.last_seen_at = new Date().toISOString(); }
    const b = await supa(supabase.from("beneficiaires").update(update).eq("id", req.params.id).select().single());
    return res.json(b);
  } catch (err) { next(err); }
});

router.post("/:id/rencontres", authRequired, async (req, res, next) => {
  try {
    const { maraude_id, lat, lng, note, dons_materiel, etat_general, oriente_structure, structure_orientation } = req.body;
    const r = await supa(supabase.from("rencontres")
      .insert({ beneficiaire_id: req.params.id, maraude_id, lat, lng, note, dons_materiel, etat_general, oriente_structure, structure_orientation, reported_by: req.user.sub })
      .select().single());
    await supabase.from("beneficiaires").update({ last_seen_lat: lat, last_seen_lng: lng, last_seen_at: new Date().toISOString() }).eq("id", req.params.id);
    return res.status(201).json(r);
  } catch (err) { next(err); }
});

module.exports = router;
