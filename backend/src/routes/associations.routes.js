const express = require("express");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { city, verified, limit = 20, offset = 0 } = req.query;
    let q = db("associations").orderBy("created_at", "desc").limit(parseInt(limit)).offset(parseInt(offset));
    if (city) q = q.whereILike("city", `%${city}%`);
    if (verified === "true") q = q.where({ verified: true });
    return res.json(await q);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const asso = await db("associations").where({ id: req.params.id }).first();
    if (!asso) return res.status(404).json({ error: "not_found" });
    const maraudes = await db("maraudes").where({ association_id: asso.id }).orderBy("date_start", "desc").limit(10);
    const expenses = await db("expenses").where({ association_id: asso.id }).orderBy("created_at", "desc").limit(20);
    return res.json({ ...asso, maraudes, expenses });
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { name, description, address, lat, lng, city, phone, email, website, siret } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });
    const [asso] = await db("associations")
      .insert({ name, description, address, lat, lng, city, phone, email, website, siret, owner_id: req.user.sub })
      .returning("*");
    await db("users").where({ id: req.user.sub }).update({ role: "association" });
    return res.status(201).json(asso);
  } catch (err) { next(err); }
});

router.post("/:id/expenses", authRequired, async (req, res, next) => {
  try {
    const { amount_cents, description, category, receipt_url, beneficiaries_count, maraude_id, expense_date } = req.body;
    if (!amount_cents || !description) return res.status(400).json({ error: "missing_fields" });
    const [exp] = await db("expenses")
      .insert({ association_id: req.params.id, declared_by: req.user.sub, amount_cents, description, category, receipt_url, beneficiaries_count, maraude_id, expense_date })
      .returning("*");
    return res.status(201).json(exp);
  } catch (err) { next(err); }
});

module.exports = router;
