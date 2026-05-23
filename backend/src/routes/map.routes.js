const express = require("express");
const { supabase } = require("../config/supabase");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [{ data: maraudes }, { data: signalements }, { data: commerces }, { data: invendus }] = await Promise.all([
      supabase.from("maraudes").select("id, title, lat, lng, date_start, status, city, volunteers_count, max_volunteers")
        .in("status", ["upcoming", "ongoing"]).not("lat", "is", null).not("lng", "is", null),
      supabase.from("signalements").select("id, type, lat, lng, description, status, upvotes, created_at")
        .in("status", ["pending", "assigned"]).not("lat", "is", null).not("lng", "is", null),
      supabase.from("commerces").select("id, name, lat, lng, type, city")
        .eq("active", true).eq("verified", true).not("lat", "is", null).not("lng", "is", null),
      supabase.from("invendus").select("id, title, quantity, unit, available_until, commerces!commerce_id(lat, lng, name)")
        .eq("status", "available").not("commerces.lat", "is", null),
    ]);

    return res.json({
      maraudes: (maraudes || []).map(m => ({ ...m, _type: "maraude" })),
      signalements: (signalements || []).map(s => ({ ...s, _type: "signalement" })),
      commerces: (commerces || []).map(c => ({ ...c, _type: "commerce" })),
      invendus: (invendus || []).map(i => ({
        ...i, lat: i.commerces?.lat, lng: i.commerces?.lng, commerce_name: i.commerces?.name,
        commerces: undefined, _type: "invenu",
      })),
    });
  } catch (err) { next(err); }
});

module.exports = router;
