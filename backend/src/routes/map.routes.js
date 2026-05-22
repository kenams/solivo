const express = require("express");
const { db } = require("../config/db");

const router = express.Router();

// Tous les points sur la carte
router.get("/", async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    const maraudes = await db("maraudes")
      .select("id", "title", "lat", "lng", "date_start", "status", "city", "volunteers_count", "max_volunteers")
      .whereIn("status", ["upcoming", "ongoing"])
      .whereNotNull("lat")
      .whereNotNull("lng");

    const signalements = await db("signalements")
      .select("id", "type", "lat", "lng", "description", "status", "upvotes", "created_at")
      .whereIn("status", ["pending", "assigned"])
      .whereNotNull("lat")
      .whereNotNull("lng");

    const commerces = await db("commerces")
      .select("id", "name", "lat", "lng", "type", "city")
      .where({ active: true, verified: true })
      .whereNotNull("lat")
      .whereNotNull("lng");

    const invendus = await db("invendus as i")
      .join("commerces as c", "i.commerce_id", "c.id")
      .select("i.id", "i.title", "i.quantity", "i.unit", "i.available_until", "c.lat", "c.lng", "c.name as commerce_name")
      .where("i.status", "available")
      .whereNotNull("c.lat");

    return res.json({
      maraudes: maraudes.map(m => ({ ...m, _type: "maraude" })),
      signalements: signalements.map(s => ({ ...s, _type: "signalement" })),
      commerces: commerces.map(c => ({ ...c, _type: "commerce" })),
      invendus: invendus.map(i => ({ ...i, _type: "invenu" })),
    });
  } catch (err) { next(err); }
});

module.exports = router;
