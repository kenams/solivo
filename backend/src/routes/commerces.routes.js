const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { city } = req.query;
    let q = supabase.from("commerces").select("*").eq("active", true).order("created_at", { ascending: false });
    if (city) q = q.ilike("city", `%${city}%`);
    const { data } = await q;
    return res.json(data || []);
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { name, address, lat, lng, city, phone, email, type } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });
    const commerce = await supa(supabase.from("commerces")
      .insert({ name, address, lat, lng, city, phone, email, type, owner_id: req.user.sub })
      .select().single());
    return res.status(201).json(commerce);
  } catch (err) { next(err); }
});

module.exports = router;
