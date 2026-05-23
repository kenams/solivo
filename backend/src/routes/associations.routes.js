const express = require("express");
const Stripe = require("stripe");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { env } = require("../config/env");

const router = express.Router();

function getStripe() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-04-10" });
}

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

// ── STRIPE CONNECT ────────────────────────────────────────────────────────────

// Créer ou récupérer le lien d'onboarding Stripe Connect
router.post("/:id/connect/onboarding", authRequired, async (req, res, next) => {
  try {
    const asso = await db("associations").where({ id: req.params.id }).first();
    if (!asso) return res.status(404).json({ error: "not_found" });

    const stripe = getStripe();
    let connectId = asso.stripe_connect_id;

    if (!connectId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: asso.email || undefined,
        capabilities: { transfers: { requested: true } },
        business_type: "non_profit",
        metadata: { association_id: asso.id },
      });
      connectId = account.id;
      await db("associations").where({ id: asso.id }).update({
        stripe_connect_id: connectId,
        stripe_connect_status: "onboarding",
      });
    }

    const link = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${env.appUrl}/associations/${asso.id}/connect?refresh=1`,
      return_url: `${env.appUrl}/associations/${asso.id}/connect/success`,
      type: "account_onboarding",
    });

    return res.json({ url: link.url });
  } catch (err) { next(err); }
});

// Statut Connect de l'association
router.get("/:id/connect/status", authRequired, async (req, res, next) => {
  try {
    const asso = await db("associations").where({ id: req.params.id }).first();
    if (!asso) return res.status(404).json({ error: "not_found" });

    if (!asso.stripe_connect_id) {
      return res.json({ status: "not_connected" });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(asso.stripe_connect_id);
    const active = account.charges_enabled && account.payouts_enabled;

    if (active && asso.stripe_connect_status !== "active") {
      await db("associations").where({ id: asso.id }).update({ stripe_connect_status: "active" });
    }

    return res.json({
      status: active ? "active" : "onboarding",
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      connect_id: asso.stripe_connect_id,
    });
  } catch (err) { next(err); }
});

// ── DÉPENSES ─────────────────────────────────────────────────────────────────

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
