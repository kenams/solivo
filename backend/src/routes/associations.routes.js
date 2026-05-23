const express = require("express");
const Stripe = require("stripe");
const { supabase, supa } = require("../config/supabase");
const { authRequired } = require("../middleware/auth");
const { env } = require("../config/env");

const router = express.Router();

function getStripe() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-04-10" });
}

router.get("/", async (req, res, next) => {
  try {
    const { city, verified, limit = 20, offset = 0 } = req.query;
    let q = supabase.from("associations").select("*").order("created_at", { ascending: false })
      .limit(parseInt(limit)).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    if (city) q = q.ilike("city", `%${city}%`);
    if (verified === "true") q = q.eq("verified", true);
    const { data } = await q;
    return res.json(data || []);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data: asso } = await supabase.from("associations").select("*").eq("id", req.params.id).maybeSingle();
    if (!asso) return res.status(404).json({ error: "not_found" });
    const [{ data: maraudes }, { data: expenses }] = await Promise.all([
      supabase.from("maraudes").select("*").eq("association_id", asso.id).order("date_start", { ascending: false }).limit(10),
      supabase.from("expenses").select("*").eq("association_id", asso.id).order("created_at", { ascending: false }).limit(20),
    ]);
    return res.json({ ...asso, maraudes: maraudes || [], expenses: expenses || [] });
  } catch (err) { next(err); }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const { name, description, address, lat, lng, city, phone, email, website, siret } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });
    const asso = await supa(supabase.from("associations")
      .insert({ name, description, address, lat, lng, city, phone, email, website, siret, owner_id: req.user.sub })
      .select().single());
    await supabase.from("users").update({ role: "association" }).eq("id", req.user.sub);
    return res.status(201).json(asso);
  } catch (err) { next(err); }
});

router.post("/:id/connect/onboarding", authRequired, async (req, res, next) => {
  try {
    const { data: asso } = await supabase.from("associations").select("*").eq("id", req.params.id).maybeSingle();
    if (!asso) return res.status(404).json({ error: "not_found" });

    const stripe = getStripe();
    let connectId = asso.stripe_connect_id;

    if (!connectId) {
      const account = await stripe.accounts.create({
        type: "express", country: "FR", email: asso.email || undefined,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "non_profit", metadata: { association_id: asso.id },
      });
      connectId = account.id;
      await supabase.from("associations").update({ stripe_connect_id: connectId, stripe_connect_status: "onboarding" }).eq("id", asso.id);
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

router.get("/:id/connect/status", authRequired, async (req, res, next) => {
  try {
    const { data: asso } = await supabase.from("associations").select("*").eq("id", req.params.id).maybeSingle();
    if (!asso) return res.status(404).json({ error: "not_found" });
    if (!asso.stripe_connect_id) return res.json({ status: "not_connected" });

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(asso.stripe_connect_id);
    const active = account.charges_enabled && account.payouts_enabled;

    if (active && asso.stripe_connect_status !== "active") {
      await supabase.from("associations").update({ stripe_connect_status: "active" }).eq("id", asso.id);
    }

    return res.json({ status: active ? "active" : "onboarding", charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled, connect_id: asso.stripe_connect_id });
  } catch (err) { next(err); }
});

router.post("/:id/expenses", authRequired, async (req, res, next) => {
  try {
    const { amount_cents, description, category, receipt_url, beneficiaries_count, maraude_id, expense_date } = req.body;
    if (!amount_cents || !description) return res.status(400).json({ error: "missing_fields" });
    const exp = await supa(supabase.from("expenses")
      .insert({ association_id: req.params.id, declared_by: req.user.sub, amount_cents, description, category, receipt_url, beneficiaries_count, maraude_id, expense_date })
      .select().single());
    return res.status(201).json(exp);
  } catch (err) { next(err); }
});

module.exports = router;
