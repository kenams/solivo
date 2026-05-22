const express = require("express");
const { db } = require("../config/db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { scope = "global", city, limit = 10 } = req.query;

    let q = db("users")
      .select("id", "name", "avatar_url", "points", "maraudes_count", "total_donations", "city", "role")
      .orderBy("points", "desc")
      .limit(parseInt(limit));

    if (scope === "city" && city) q = q.whereILike("city", `%${city}%`);

    const users = await q;

    const associations = await db("associations")
      .select("id", "name", "logo_url", "city", "volunteers_count", "beneficiaries_count")
      .orderBy("beneficiaries_count", "desc")
      .limit(10);

    return res.json({ users, associations });
  } catch (err) { next(err); }
});

module.exports = router;
