const express = require("express");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const invendus = await db("invendus as i")
      .join("commerces as c", "i.commerce_id", "c.id")
      .select("i.*", "c.name as commerce_name", "c.lat", "c.lng", "c.city", "c.type as commerce_type")
      .where("i.status", "available")
      .orderBy("i.available_until", "asc");
    return res.json(invendus);
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { commerce_id, title, description, quantity, unit, available_until } = req.body;
    if (!commerce_id || !title) return res.status(400).json({ error: "missing_fields" });
    const [inv] = await db("invendus")
      .insert({ commerce_id, title, description, quantity, unit, available_until })
      .returning("*");
    return res.status(201).json(inv);
  } catch (err) { next(err); }
});

router.patch("/:id/reserve", authRequired, async (req, res, next) => {
  try {
    const { association_id } = req.body;
    await db("invendus").where({ id: req.params.id }).update({ status: "reserved", reserved_by: association_id });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
