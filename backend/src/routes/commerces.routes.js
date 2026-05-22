const express = require("express");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { city } = req.query;
    let q = db("commerces").where({ active: true }).orderBy("created_at", "desc");
    if (city) q = q.whereILike("city", `%${city}%`);
    return res.json(await q);
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { name, address, lat, lng, city, phone, email, type } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });
    const [commerce] = await db("commerces")
      .insert({ name, address, lat, lng, city, phone, email, type, owner_id: req.user.sub })
      .returning("*");
    return res.status(201).json(commerce);
  } catch (err) { next(err); }
});

module.exports = router;
