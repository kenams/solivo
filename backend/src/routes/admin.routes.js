const express = require("express");
const { supabase, supa } = require("../config/supabase");
const { authRequired, requireRole } = require("../middleware/auth");
const { env } = require("../config/env");

const router = express.Router();
const adminOnly = [authRequired, requireRole("admin")];

router.post("/bootstrap", async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!env.adminSecret || !secret || secret !== env.adminSecret) {
    return res.status(403).json({ error: "forbidden" });
  }
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email_required" });
  const { data: user } = await supabase.from("users").select("id, email").ilike("email", email.toLowerCase().trim()).maybeSingle();
  if (!user) return res.status(404).json({ error: "user_not_found" });
  await supabase.from("users").update({ role: "admin", updated_at: new Date().toISOString() }).eq("id", user.id);
  return res.json({ ok: true, user: { id: user.id, email: user.email, role: "admin" } });
});

router.get("/stats", ...adminOnly, async (req, res, next) => {
  try {
    const { data } = await supabase.rpc("sp_admin_stats");
    res.json(data);
  } catch (err) { next(err); }
});

router.get("/users", ...adminOnly, async (req, res, next) => {
  try {
    const { page = 1, search = "", role = "" } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let q = supabase.from("users").select("id, name, email, role, points, maraudes_count, verified, created_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role) q = q.eq("role", role);
    const { data: users, count } = await q.range(offset, offset + limit - 1);
    res.json({ users: users || [], total: count || 0, page: parseInt(page), pages: Math.ceil((count || 0) / limit) });
  } catch (err) { next(err); }
});

router.patch("/users/:id/role", ...adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "volunteer", "association", "commerce", "admin"].includes(role))
      return res.status(400).json({ error: "invalid_role" });
    await supabase.from("users").update({ role, updated_at: new Date().toISOString() }).eq("id", req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete("/users/:id", ...adminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) return res.status(400).json({ error: "cannot_delete_self" });
    await supabase.from("users").delete().eq("id", req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/signalements", ...adminOnly, async (req, res, next) => {
  try {
    const { status = "", page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let q = supabase.from("signalements").select("*, users!reported_by(name)", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data: items, count } = await q.range(offset, offset + limit - 1);
    res.json({ items: (items || []).map(s => ({ ...s, reporter_name: s.users?.name, users: undefined })), total: count || 0 });
  } catch (err) { next(err); }
});

router.patch("/signalements/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { status, admin_note } = req.body;
    await supabase.from("signalements").update({ status, admin_note, updated_at: new Date().toISOString() }).eq("id", req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/associations", ...adminOnly, async (req, res, next) => {
  try {
    const { data: items } = await supabase.from("associations")
      .select("*, users!owner_id(name, email)").order("created_at", { ascending: false });
    res.json({ items: (items || []).map(a => ({ ...a, owner_name: a.users?.name, owner_email: a.users?.email, users: undefined })) });
  } catch (err) { next(err); }
});

router.patch("/associations/:id/verify", ...adminOnly, async (req, res, next) => {
  try {
    const { verified } = req.body;
    await supabase.from("associations").update({ verified: !!verified, updated_at: new Date().toISOString() }).eq("id", req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/maraudes", ...adminOnly, async (req, res, next) => {
  try {
    const { status = "", page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let q = supabase.from("maraudes").select("*, users!created_by(name)", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data: items, count } = await q.range(offset, offset + limit - 1);
    res.json({ items: (items || []).map(m => ({ ...m, organizer_name: m.users?.name, users: undefined })), total: count || 0 });
  } catch (err) { next(err); }
});

router.delete("/maraudes/:id", ...adminOnly, async (req, res, next) => {
  try {
    await supabase.from("maraudes").delete().eq("id", req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get("/donations", ...adminOnly, async (req, res, next) => {
  try {
    const { data: items } = await supabase.from("donations")
      .select("*, users!donor_id(name), associations!association_id(name)")
      .order("created_at", { ascending: false }).limit(50);
    res.json({ items: (items || []).map(d => ({ ...d, donor_name: d.users?.name, asso_name: d.associations?.name, users: undefined, associations: undefined })) });
  } catch (err) { next(err); }
});

module.exports = router;
