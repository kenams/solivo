const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired, optionalAuth } = require("../middleware/auth");
const { addPoints } = require("../services/users.service");

const router = express.Router();

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { status = "pending", lat, lng, radius = 10 } = req.query;

    let signalements;
    if (lat && lng) {
      const { data } = await supabase.rpc("sp_signalements_nearby", {
        p_lat: parseFloat(lat), p_lng: parseFloat(lng),
        p_radius: parseFloat(radius), p_status: status,
      });
      signalements = data || [];
    } else {
      const { data } = await supabase.from("signalements").select("*").eq("status", status).order("created_at", { ascending: false }).limit(100);
      signalements = data || [];
    }

    return res.json(signalements.map(s => ({ ...s, reported_by: s.anonymous ? null : s.reported_by })));
  } catch (err) { next(err); }
});

router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { type, description, lat, lng, address, city, anonymous = true, photo_url } = req.body;
    if (!type || !lat || !lng) return res.status(400).json({ error: "missing_fields" });

    const sig = await supa(supabase.from("signalements").insert({
      type, description, lat, lng, address, city, anonymous, photo_url,
      reported_by: anonymous ? null : (req.user?.sub || null),
    }).select().single());

    if (req.user && !anonymous) await addPoints(req.user.sub, 5);
    return res.status(201).json(sig);
  } catch (err) { next(err); }
});

router.patch("/:id/upvote", optionalAuth, async (req, res, next) => {
  try {
    await supabase.rpc("sp_increment_field", { p_table: "signalements", p_id: req.params.id, p_column: "upvotes", p_amount: 1 });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch("/:id/status", authRequired, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["pending", "assigned", "resolved", "invalid"].includes(status))
      return res.status(400).json({ error: "invalid_status" });
    await supabase.from("signalements").update({ status }).eq("id", req.params.id);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
