const express = require("express");
const { db } = require("../config/db");
const { authRequired, optionalAuth } = require("../middleware/auth");
const { addPoints } = require("../services/users.service");

const router = express.Router();

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { status = "pending", lat, lng, radius = 10 } = req.query;
    let q = db("signalements").where({ status }).orderBy("created_at", "desc").limit(100);

    if (lat && lng) {
      const latF = parseFloat(lat), lngF = parseFloat(lng), r = parseFloat(radius);
      q = q.whereRaw(
        `(6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) < ?`,
        [latF, lngF, latF, r]
      );
    }

    const signalements = await q;
    // Masquer reported_by si anonymous
    return res.json(signalements.map(s => ({
      ...s,
      reported_by: s.anonymous ? null : s.reported_by,
    })));
  } catch (err) { next(err); }
});

router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { type, description, lat, lng, address, city, anonymous = true, photo_url } = req.body;
    if (!type || !lat || !lng) return res.status(400).json({ error: "missing_fields" });

    const [sig] = await db("signalements")
      .insert({
        type, description, lat, lng, address, city, anonymous,
        photo_url,
        reported_by: anonymous ? null : (req.user?.sub || null),
      })
      .returning("*");

    if (req.user && !anonymous) await addPoints(req.user.sub, 5);

    return res.status(201).json(sig);
  } catch (err) { next(err); }
});

router.patch("/:id/upvote", optionalAuth, async (req, res, next) => {
  try {
    await db("signalements").where({ id: req.params.id }).increment("upvotes", 1);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch("/:id/status", authRequired, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["pending", "assigned", "resolved", "invalid"].includes(status))
      return res.status(400).json({ error: "invalid_status" });
    await db("signalements").where({ id: req.params.id }).update({ status });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
