const express = require("express");
const { supabase } = require("../config/supabase");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { scope = "global", city, limit = 10 } = req.query;

    let q = supabase.from("users").select("id, name, avatar_url, points, maraudes_count, total_donations, city, role")
      .order("points", { ascending: false }).limit(parseInt(limit));

    if (scope === "city" && city) q = q.ilike("city", `%${city}%`);

    const [{ data: users }, { data: associations }] = await Promise.all([
      q,
      supabase.from("associations").select("id, name, logo_url, city, volunteers_count, beneficiaries_count")
        .order("beneficiaries_count", { ascending: false }).limit(10),
    ]);

    return res.json({ users: users || [], associations: associations || [] });
  } catch (err) { next(err); }
});

module.exports = router;
