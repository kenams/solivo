const express = require("express");
const Stripe = require("stripe");
const { supabase, supa } = require("../config/supabase");
const { authRequired } = require("../middleware/auth");
const { env } = require("../config/env");

const router = express.Router();

function getStripe() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-04-10" });
}

router.post("/invendus", authRequired, async (req, res, next) => {
  try {
    const { commerce_id, title, description, quantity, unit, available_until } = req.body;
    if (!commerce_id || !title) return res.status(400).json({ error: "missing_fields" });

    const { data: commerce } = await supabase.from("commerces").select("id").eq("id", commerce_id).maybeSingle();
    if (!commerce) return res.status(404).json({ error: "commerce_not_found" });

    const inv = await supa(supabase.from("invendus")
      .insert({ commerce_id, title, description, quantity, unit, available_until })
      .select().single());
    return res.status(201).json(inv);
  } catch (err) { next(err); }
});

router.get("/invendus", async (req, res, next) => {
  try {
    const { lat, lng, radius = 20, limit = 50 } = req.query;

    if (lat && lng) {
      const { data } = await supabase.rpc("sp_invendus_nearby", {
        p_lat: parseFloat(lat), p_lng: parseFloat(lng),
        p_radius: parseFloat(radius), p_limit: parseInt(limit),
      });
      return res.json(data || []);
    }

    const { data } = await supabase.from("invendus")
      .select("*, commerces!commerce_id(id, name, type, lat, lng, city, address, phone)")
      .eq("status", "available")
      .or(`available_until.is.null,available_until.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false }).limit(parseInt(limit));

    return res.json((data || []).map(i => ({
      ...i, commerce_id: i.commerces?.id, commerce_name: i.commerces?.name,
      commerce_type: i.commerces?.type, lat: i.commerces?.lat, lng: i.commerces?.lng,
      city: i.commerces?.city, address: i.commerces?.address, commerce_phone: i.commerces?.phone,
      commerces: undefined,
    })));
  } catch (err) { next(err); }
});

router.post("/collecte-requests", authRequired, async (req, res, next) => {
  try {
    const { invenu_id, association_id, pickup_scheduled_at, collector_name, collector_phone, note_association } = req.body;
    if (!invenu_id || !association_id) return res.status(400).json({ error: "missing_fields" });

    const { data: invenu } = await supabase.from("invendus").select("*").eq("id", invenu_id).eq("status", "available").maybeSingle();
    if (!invenu) return res.status(400).json({ error: "invenu_unavailable" });

    const { data: existing } = await supabase.from("collecte_requests").select("id").eq("invenu_id", invenu_id).eq("status", "pending").maybeSingle();
    if (existing) return res.status(409).json({ error: "already_requested" });

    const { data: sub } = await supabase.from("commerce_subscriptions").select("commission_rate_cents").eq("commerce_id", invenu.commerce_id).maybeSingle();
    const commission_cents = sub?.commission_rate_cents ?? 150;

    const req_ = await supa(supabase.from("collecte_requests")
      .insert({ invenu_id, commerce_id: invenu.commerce_id, association_id, requested_by: req.user.sub, pickup_scheduled_at, collector_name, collector_phone, note_association, commission_cents })
      .select().single());

    await supabase.from("invendus").update({ status: "reserved", reserved_by: association_id }).eq("id", invenu_id);
    return res.status(201).json(req_);
  } catch (err) { next(err); }
});

router.get("/collecte-requests/mes", authRequired, async (req, res, next) => {
  try {
    const { association_id } = req.query;
    const { data } = await supabase.from("collecte_requests")
      .select("*, invendus!invenu_id(title, quantity, unit), commerces!commerce_id(name, address, phone), associations!association_id(name)")
      .eq("association_id", association_id).order("created_at", { ascending: false });
    return res.json((data || []).map(r => ({
      ...r, invenu_title: r.invendus?.title, quantity: r.invendus?.quantity, unit: r.invendus?.unit,
      commerce_name: r.commerces?.name, commerce_address: r.commerces?.address, commerce_phone: r.commerces?.phone,
      association_name: r.associations?.name, invendus: undefined, commerces: undefined, associations: undefined,
    })));
  } catch (err) { next(err); }
});

router.get("/collecte-requests/commerce/:commerce_id", authRequired, async (req, res, next) => {
  try {
    const { data } = await supabase.from("collecte_requests")
      .select("*, invendus!invenu_id(title, quantity, unit), associations!association_id(name, phone)")
      .eq("commerce_id", req.params.commerce_id).order("created_at", { ascending: false });
    return res.json((data || []).map(r => ({
      ...r, invenu_title: r.invendus?.title, quantity: r.invendus?.quantity, unit: r.invendus?.unit,
      association_name: r.associations?.name, association_phone: r.associations?.phone,
      invendus: undefined, associations: undefined,
    })));
  } catch (err) { next(err); }
});

router.patch("/collecte-requests/:id/status", authRequired, async (req, res, next) => {
  try {
    const { status, note_commerce } = req.body;
    if (!["accepted", "rejected"].includes(status)) return res.status(400).json({ error: "invalid_status" });

    const { data: cr } = await supabase.from("collecte_requests").select("*").eq("id", req.params.id).maybeSingle();
    if (!cr) return res.status(404).json({ error: "not_found" });

    await supabase.from("collecte_requests").update({ status, note_commerce }).eq("id", req.params.id);
    if (status === "rejected") {
      await supabase.from("invendus").update({ status: "available", reserved_by: null }).eq("id", cr.invenu_id);
    }
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post("/collecte-requests/:id/confirm", authRequired, async (req, res, next) => {
  try {
    const { quantity_collected, photo_url } = req.body;
    const { data: cr } = await supabase.from("collecte_requests").select("*").eq("id", req.params.id).maybeSingle();
    if (!cr) return res.status(404).json({ error: "not_found" });

    await supabase.from("collecte_requests").update({ status: "collected", collected_at: new Date().toISOString(), quantity_collected, photo_url }).eq("id", req.params.id);
    await supabase.from("invendus").update({ status: "collected" }).eq("id", cr.invenu_id);

    await supabase.rpc("sp_increment_field", { p_table: "commerce_subscriptions", p_id: cr.commerce_id, p_column: "total_pickups", p_amount: 1 });
    await supabase.rpc("sp_increment_field", { p_table: "commerce_subscriptions", p_id: cr.commerce_id, p_column: "monthly_pickups", p_amount: 1 });

    if (cr.commission_cents > 0 && env.stripeSecretKey) {
      try {
        const stripe = getStripe();
        const { data: sub } = await supabase.from("commerce_subscriptions").select("stripe_customer_id").eq("commerce_id", cr.commerce_id).maybeSingle();
        if (sub?.stripe_customer_id) {
          const pi = await stripe.paymentIntents.create({
            amount: cr.commission_cents, currency: "eur", customer: sub.stripe_customer_id,
            description: `Solivo — Commission collecte #${cr.id.slice(0, 8)}`,
            metadata: { collecte_request_id: cr.id, commerce_id: cr.commerce_id },
          });
          await supabase.from("collecte_requests").update({ stripe_payment_intent_commission: pi.id, commission_status: "pending" }).eq("id", cr.id);
        }
      } catch {}
    }

    await supabase.rpc("sp_increment_field", { p_table: "associations", p_id: cr.association_id, p_column: "beneficiaries_count", p_amount: 1 });
    return res.json({ ok: true, message: "Collecte confirmée" });
  } catch (err) { next(err); }
});

router.get("/impact/:commerce_id", async (req, res, next) => {
  try {
    const { data: commerce } = await supabase.from("commerces").select("name").eq("id", req.params.commerce_id).maybeSingle();
    if (!commerce) return res.status(404).json({ error: "not_found" });

    const { data: sub } = await supabase.from("commerce_subscriptions").select("plan").eq("commerce_id", req.params.commerce_id).maybeSingle();
    const { data: impact } = await supabase.rpc("sp_commerce_impact", { p_commerce_id: req.params.commerce_id });

    return res.json({ commerce_name: commerce.name, plan: sub?.plan || "free", ...impact });
  } catch (err) { next(err); }
});

router.post("/onboarding/commerce", authRequired, async (req, res, next) => {
  try {
    const { name, address, lat, lng, city, phone, email, type, siret } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });

    const commerce = await supa(supabase.from("commerces")
      .insert({ name, address, lat, lng, city, phone, email, type, owner_id: req.user.sub })
      .select().single());

    let stripeCustomerId = null;
    if (env.stripeSecretKey && email) {
      try {
        const stripe = getStripe();
        const customer = await stripe.customers.create({ email, name, metadata: { commerce_id: commerce.id } });
        stripeCustomerId = customer.id;
      } catch {}
    }

    await supabase.from("commerce_subscriptions").insert({ commerce_id: commerce.id, plan: "free", commission_rate_cents: 150, stripe_customer_id: stripeCustomerId });
    await supabase.from("users").update({ role: "commerce" }).eq("id", req.user.sub);

    return res.status(201).json({ commerce, message: "Compte commerce créé avec succès" });
  } catch (err) { next(err); }
});

router.get("/stats", async (req, res, next) => {
  try {
    const { data } = await supabase.rpc("sp_platform_stats");
    return res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
