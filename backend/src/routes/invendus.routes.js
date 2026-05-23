const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { data } = await supabase.from("invendus")
      .select("*, commerces!commerce_id(name, lat, lng, city, type)")
      .eq("status", "available")
      .order("available_until", { ascending: true });
    const result = (data || []).map(i => ({
      ...i, commerce_name: i.commerces?.name, lat: i.commerces?.lat, lng: i.commerces?.lng,
      city: i.commerces?.city, commerce_type: i.commerces?.type, commerces: undefined,
    }));
    return res.json(result);
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { commerce_id, title, description, quantity, unit, available_until } = req.body;
    if (!commerce_id || !title) return res.status(400).json({ error: "missing_fields" });
    const inv = await supa(supabase.from("invendus")
      .insert({ commerce_id, title, description, quantity, unit, available_until })
      .select().single());
    return res.status(201).json(inv);
  } catch (err) { next(err); }
});

router.patch("/:id/reserve", authRequired, async (req, res, next) => {
  try {
    const { association_id } = req.body;
    await supabase.from("invendus").update({ status: "reserved", reserved_by: association_id }).eq("id", req.params.id);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
