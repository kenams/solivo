const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired, optionalAuth } = require("../middleware/auth");
const { addPoints } = require("../services/users.service");

const router = express.Router();

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { city, status = "upcoming", limit = 20, offset = 0 } = req.query;
    let q = supabase.from("maraudes").select("*, associations(name, logo_url), users!created_by(name, avatar_url)")
      .eq("status", status).order("date_start", { ascending: true })
      .limit(parseInt(limit)).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (city) q = q.ilike("city", `%${city}%`);

    const { data: maraudes } = await q;
    const result = (maraudes || []).map(m => ({
      ...m,
      association_name: m.associations?.name,
      association_logo: m.associations?.logo_url,
      organizer_name: m.users?.name,
      organizer_avatar: m.users?.avatar_url,
      associations: undefined, users: undefined,
    }));

    if (req.user) {
      const { data: joins } = await supabase.from("maraude_participants").select("maraude_id").eq("user_id", req.user.sub);
      const mySet = new Set((joins || []).map(j => j.maraude_id));
      result.forEach(m => m.is_joined = mySet.has(m.id));
    }

    return res.json({ maraudes: result, total: result.length });
  } catch (err) { next(err); }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const { data: maraude } = await supabase.from("maraudes")
      .select("*, associations(name, logo_url), users!created_by(name)")
      .eq("id", req.params.id).maybeSingle();

    if (!maraude) return res.status(404).json({ error: "not_found" });

    const { data: participants } = await supabase.from("maraude_participants")
      .select("status, users(id, name, avatar_url)").eq("maraude_id", maraude.id);

    const is_joined = req.user
      ? !!(await supabase.from("maraude_participants").select("id").eq("maraude_id", maraude.id).eq("user_id", req.user.sub).maybeSingle()).data
      : false;

    return res.json({
      ...maraude,
      association_name: maraude.associations?.name,
      association_logo: maraude.associations?.logo_url,
      organizer_name: maraude.users?.name,
      participants: (participants || []).map(p => ({ ...p.users, status: p.status })),
      is_joined,
    });
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { title, description, date_start, date_end, meeting_point, lat, lng, city, max_volunteers, association_id } = req.body;
    if (!title || !date_start || !meeting_point || !lat || !lng)
      return res.status(400).json({ error: "missing_fields" });

    if (association_id) {
      const { data: asso } = await supabase.from("associations").select("id, created_by").eq("id", association_id).maybeSingle();
      if (!asso) return res.status(404).json({ error: "association_not_found" });
      if (asso.created_by !== req.user.sub && req.user.role !== "admin")
        return res.status(403).json({ error: "forbidden_not_owner" });
    }

    const maraude = await supa(supabase.from("maraudes")
      .insert({ title, description, date_start, date_end, meeting_point, lat, lng, city, max_volunteers, association_id: association_id || null, created_by: req.user.sub })
      .select().single());

    return res.status(201).json(maraude);
  } catch (err) { next(err); }
});

router.post("/:id/join", authRequired, async (req, res, next) => {
  try {
    const { data: maraude } = await supabase.from("maraudes").select("*").eq("id", req.params.id).maybeSingle();
    if (!maraude) return res.status(404).json({ error: "not_found" });
    if (maraude.status !== "upcoming") return res.status(400).json({ error: "maraude_not_upcoming" });
    if (maraude.volunteers_count >= maraude.max_volunteers) return res.status(400).json({ error: "maraude_full" });

    const { data: existing } = await supabase.from("maraude_participants").select("id").eq("maraude_id", maraude.id).eq("user_id", req.user.sub).maybeSingle();
    if (existing) return res.status(409).json({ error: "already_joined" });

    await supabase.from("maraude_participants").insert({ maraude_id: maraude.id, user_id: req.user.sub });
    await supabase.rpc("sp_increment_field", { p_table: "maraudes", p_id: maraude.id, p_column: "volunteers_count", p_amount: 1 });
    await addPoints(req.user.sub, 10);

    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete("/:id/join", authRequired, async (req, res, next) => {
  try {
    await supabase.from("maraude_participants").delete().eq("maraude_id", req.params.id).eq("user_id", req.user.sub);
    await supabase.rpc("sp_increment_field", { p_table: "maraudes", p_id: req.params.id, p_column: "volunteers_count", p_amount: -1 });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch("/:id/complete", authRequired, async (req, res, next) => {
  try {
    const { data: maraude } = await supabase.from("maraudes").select("id, created_by").eq("id", req.params.id).maybeSingle();
    if (!maraude) return res.status(404).json({ error: "not_found" });
    if (maraude.created_by !== req.user.sub && req.user.role !== "admin")
      return res.status(403).json({ error: "forbidden" });

    const { beneficiaries_helped } = req.body;
    await supabase.from("maraudes").update({ status: "completed", beneficiaries_helped: beneficiaries_helped || 0 }).eq("id", req.params.id);

    const { data: participants } = await supabase.from("maraude_participants").select("user_id").eq("maraude_id", req.params.id);
    for (const { user_id } of (participants || [])) {
      await addPoints(user_id, 50);
      await supabase.rpc("sp_increment_field", { p_table: "users", p_id: user_id, p_column: "maraudes_count", p_amount: 1 });
    }

    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
