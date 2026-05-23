const express = require("express");
const { db } = require("../config/db");
const { authRequired, requireRole } = require("../middleware/auth");
const { env } = require("../config/env");

const router = express.Router();
const adminOnly = [authRequired, requireRole("admin")];

// Bootstrap : donne le rôle admin à un email (protégé par ADMIN_SECRET)
router.post("/bootstrap", async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  // Refuse si ADMIN_SECRET non défini ou vide — évite l'accès libre si env var oubliée
  if (!env.adminSecret || !secret || secret !== env.adminSecret) {
    return res.status(403).json({ error: "forbidden" });
  }
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email_required" });
  const user = await db("users").where({ email: email.toLowerCase().trim() }).first();
  if (!user) return res.status(404).json({ error: "user_not_found" });
  await db("users").where({ id: user.id }).update({ role: "admin", updated_at: new Date() });
  return res.json({ ok: true, user: { id: user.id, email: user.email, role: "admin" } });
});

// Stats globales
router.get("/stats", ...adminOnly, async (req, res, next) => {
  try {
    const [[users], [maraudes], [signalements], [donations], [associations], [commerces]] = await Promise.all([
      db("users").count("id as count"),
      db("maraudes").count("id as count"),
      db("signalements").count("id as count"),
      db("donations").sum("amount_cents as total").count("id as count"),
      db("associations").count("id as count"),
      db("commerces").count("id as count"),
    ]);
    const byRole = await db("users").select("role").count("id as count").groupBy("role");
    const recentUsers = await db("users").select("id","name","email","role","created_at").orderBy("created_at","desc").limit(5);
    const recentMaraudes = await db("maraudes").select("id","title","status","created_at").orderBy("created_at","desc").limit(5);
    res.json({
      users: parseInt(users.count),
      maraudes: parseInt(maraudes.count),
      signalements: parseInt(signalements.count),
      donations_count: parseInt(donations.count),
      donations_total: parseInt(donations.total || 0),
      associations: parseInt(associations.count),
      commerces: parseInt(commerces.count),
      byRole,
      recentUsers,
      recentMaraudes,
    });
  } catch (err) { next(err); }
});

// Utilisateurs
router.get("/users", ...adminOnly, async (req, res, next) => {
  try {
    const { page = 1, search = "", role = "" } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let q = db("users").select("id","name","email","role","points","maraudes_count","verified","created_at").orderBy("created_at","desc");
    if (search) q = q.where(b => b.whereIlike("name", `%${search}%`).orWhereIlike("email", `%${search}%`));
    if (role) q = q.where({ role });
    const [total] = await q.clone().count("id as count");
    const users = await q.limit(limit).offset(offset);
    res.json({ users, total: parseInt(total.count), page: parseInt(page), pages: Math.ceil(parseInt(total.count) / limit) });
  } catch (err) { next(err); }
});

router.patch("/users/:id/role", ...adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    const valid = ["user","volunteer","association","commerce","admin"];
    if (!valid.includes(role)) return res.status(400).json({ error: "invalid_role" });
    await db("users").where({ id: req.params.id }).update({ role, updated_at: new Date() });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete("/users/:id", ...adminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) return res.status(400).json({ error: "cannot_delete_self" });
    await db("users").where({ id: req.params.id }).delete();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Signalements
router.get("/signalements", ...adminOnly, async (req, res, next) => {
  try {
    const { status = "", page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let q = db("signalements").select("signalements.*", db.raw("users.name as reporter_name"))
      .leftJoin("users", "signalements.user_id", "users.id")
      .orderBy("signalements.created_at", "desc");
    if (status) q = q.where("signalements.status", status);
    const [total] = await q.clone().count("signalements.id as count");
    const items = await q.limit(limit).offset(offset);
    res.json({ items, total: parseInt(total.count) });
  } catch (err) { next(err); }
});

router.patch("/signalements/:id", ...adminOnly, async (req, res, next) => {
  try {
    const { status, admin_note } = req.body;
    await db("signalements").where({ id: req.params.id }).update({ status, admin_note, updated_at: new Date() });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Associations
router.get("/associations", ...adminOnly, async (req, res, next) => {
  try {
    const items = await db("associations")
      .select("associations.*", db.raw("users.name as owner_name"), db.raw("users.email as owner_email"))
      .leftJoin("users", "associations.created_by", "users.id")
      .orderBy("associations.created_at", "desc");
    res.json({ items });
  } catch (err) { next(err); }
});

router.patch("/associations/:id/verify", ...adminOnly, async (req, res, next) => {
  try {
    const { verified } = req.body;
    await db("associations").where({ id: req.params.id }).update({ verified: !!verified, updated_at: new Date() });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Maraudes
router.get("/maraudes", ...adminOnly, async (req, res, next) => {
  try {
    const { status = "", page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let q = db("maraudes")
      .select("maraudes.*", db.raw("users.name as organizer_name"))
      .leftJoin("users", "maraudes.created_by", "users.id")
      .orderBy("maraudes.created_at", "desc");
    if (status) q = q.where("maraudes.status", status);
    const [total] = await q.clone().count("maraudes.id as count");
    const items = await q.limit(limit).offset(offset);
    res.json({ items, total: parseInt(total.count) });
  } catch (err) { next(err); }
});

router.delete("/maraudes/:id", ...adminOnly, async (req, res, next) => {
  try {
    await db("maraudes").where({ id: req.params.id }).delete();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Donations
router.get("/donations", ...adminOnly, async (req, res, next) => {
  try {
    const items = await db("donations")
      .select("donations.*", db.raw("users.name as donor_name"), db.raw("associations.name as asso_name"))
      .leftJoin("users", "donations.user_id", "users.id")
      .leftJoin("associations", "donations.association_id", "associations.id")
      .orderBy("donations.created_at", "desc")
      .limit(50);
    res.json({ items });
  } catch (err) { next(err); }
});

module.exports = router;
