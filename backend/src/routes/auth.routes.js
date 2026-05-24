const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { env } = require("../config/env");
const { findUserByEmail, findUserById, createUser, verifyPassword } = require("../services/users.service");
const { authRequired } = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const crypto = require("crypto");
const { send, welcomeEmail, resetPasswordEmail } = require("../services/email.service");

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["user", "volunteer", "association", "commerce"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "invalid_payload", details: parse.error.flatten() });
    const { email, password, name, role } = parse.data;

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "email_already_used" });

    const user = await createUser({ email, password, name, role });
    const token = signToken(user);

    send({ to: user.email, subject: "Bienvenue sur Solivo 🤝", html: welcomeEmail(user.name) }).catch(() => {});

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, points: user.points },
    });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "invalid_payload" });
    const { email, password } = parse.data;

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash))
      return res.status(401).json({ error: "invalid_credentials" });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, points: user.points, avatar_url: user.avatar_url },
    });
  } catch (err) { next(err); }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: "not_found" });
    const { data: badges } = await supabase.from("badges").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    return res.json({ ...user, password_hash: undefined, badges: badges || [] });
  } catch (err) { next(err); }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "email_required" });
    const user = await findUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await supabase.from("users").update({
        reset_token: token,
        reset_token_expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      }).eq("id", user.id);
      send({ to: user.email, subject: "Réinitialisation de mot de passe — Solivo", html: resetPasswordEmail(user.name, token, env.appUrl) }).catch(() => {});
    }
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
