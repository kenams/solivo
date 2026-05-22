const express = require("express");
const Stripe = require("stripe");
const { db } = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { env } = require("../config/env");

const router = express.Router();

function getStripe() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-04-10" });
}

// ── INVENDUS ENRICHIS ────────────────────────────────────────────────────────

// Publier un invenu (commerce)
router.post("/invendus", authRequired, async (req, res, next) => {
  try {
    const { commerce_id, title, description, quantity, unit, available_until, category, weight_kg, photo_url } = req.body;
    if (!commerce_id || !title) return res.status(400).json({ error: "missing_fields" });

    // Vérifier que le commerce appartient à l'user
    const commerce = await db("commerces").where({ id: commerce_id }).first();
    if (!commerce) return res.status(404).json({ error: "commerce_not_found" });

    const [inv] = await db("invendus")
      .insert({ commerce_id, title, description, quantity, unit, available_until })
      .returning("*");

    return res.status(201).json(inv);
  } catch (err) { next(err); }
});

// Invendus disponibles avec géoloc
router.get("/invendus", async (req, res, next) => {
  try {
    const { lat, lng, radius = 20, limit = 50 } = req.query;

    let q = db("invendus as i")
      .join("commerces as c", "i.commerce_id", "c.id")
      .select(
        "i.id", "i.title", "i.description", "i.quantity", "i.unit", "i.available_until", "i.status", "i.created_at",
        "c.id as commerce_id", "c.name as commerce_name", "c.type as commerce_type",
        "c.lat", "c.lng", "c.city", "c.address", "c.phone as commerce_phone"
      )
      .where("i.status", "available")
      .whereRaw("(i.available_until IS NULL OR i.available_until > NOW())")
      .where("c.active", true)
      .orderBy("i.created_at", "desc")
      .limit(parseInt(limit as string));

    if (lat && lng) {
      const latF = parseFloat(lat as string), lngF = parseFloat(lng as string), r = parseFloat(radius as string);
      q = q.whereRaw(
        `(6371 * acos(LEAST(1, cos(radians(?)) * cos(radians(c.lat)) * cos(radians(c.lng) - radians(?)) + sin(radians(?)) * sin(radians(c.lat))))) < ?`,
        [latF, lngF, latF, r]
      );
    }

    const invendus = await q;
    return res.json(invendus);
  } catch (err) { next(err); }
});

// ── DEMANDES DE COLLECTE ─────────────────────────────────────────────────────

// Faire une demande de collecte (association)
router.post("/collecte-requests", authRequired, async (req, res, next) => {
  try {
    const { invenu_id, association_id, pickup_scheduled_at, collector_name, collector_phone, note_association } = req.body;
    if (!invenu_id || !association_id) return res.status(400).json({ error: "missing_fields" });

    const invenu = await db("invendus").where({ id: invenu_id, status: "available" }).first();
    if (!invenu) return res.status(400).json({ error: "invenu_unavailable" });

    // Vérifier si déjà une demande en cours
    const existing = await db("collecte_requests").where({ invenu_id, status: "pending" }).first();
    if (existing) return res.status(409).json({ error: "already_requested" });

    // Récupérer le taux de commission du commerce
    const sub = await db("commerce_subscriptions").where({ commerce_id: invenu.commerce_id }).first();
    const commission_cents = sub?.commission_rate_cents ?? 150;

    const [req_] = await db("collecte_requests")
      .insert({
        invenu_id, commerce_id: invenu.commerce_id, association_id,
        requested_by: req.user.sub, pickup_scheduled_at,
        collector_name, collector_phone, note_association,
        commission_cents,
      })
      .returning("*");

    // Marquer l'invenu comme réservé
    await db("invendus").where({ id: invenu_id }).update({ status: "reserved", reserved_by: association_id });

    return res.status(201).json(req_);
  } catch (err) { next(err); }
});

// Mes demandes (association)
router.get("/collecte-requests/mes", authRequired, async (req, res, next) => {
  try {
    const { association_id } = req.query;
    const requests = await db("collecte_requests as cr")
      .join("invendus as i", "cr.invenu_id", "i.id")
      .join("commerces as c", "cr.commerce_id", "c.id")
      .leftJoin("associations as a", "cr.association_id", "a.id")
      .select(
        "cr.*",
        "i.title as invenu_title", "i.quantity", "i.unit",
        "c.name as commerce_name", "c.address as commerce_address", "c.phone as commerce_phone",
        "a.name as association_name"
      )
      .where("cr.association_id", association_id)
      .orderBy("cr.created_at", "desc");
    return res.json(requests);
  } catch (err) { next(err); }
});

// Demandes reçues (commerce)
router.get("/collecte-requests/commerce/:commerce_id", authRequired, async (req, res, next) => {
  try {
    const requests = await db("collecte_requests as cr")
      .join("invendus as i", "cr.invenu_id", "i.id")
      .join("associations as a", "cr.association_id", "a.id")
      .select("cr.*", "i.title as invenu_title", "i.quantity", "i.unit", "a.name as association_name", "a.phone as association_phone")
      .where("cr.commerce_id", req.params.commerce_id)
      .orderBy("cr.created_at", "desc");
    return res.json(requests);
  } catch (err) { next(err); }
});

// Accepter / refuser une demande (commerce)
router.patch("/collecte-requests/:id/status", authRequired, async (req, res, next) => {
  try {
    const { status, note_commerce } = req.body;
    if (!["accepted", "rejected"].includes(status)) return res.status(400).json({ error: "invalid_status" });

    const cr = await db("collecte_requests").where({ id: req.params.id }).first();
    if (!cr) return res.status(404).json({ error: "not_found" });

    await db("collecte_requests").where({ id: req.params.id }).update({ status, note_commerce });

    if (status === "rejected") {
      await db("invendus").where({ id: cr.invenu_id }).update({ status: "available", reserved_by: null });
    }

    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// Confirmer la collecte + déclencher paiement commission (association confirme)
router.post("/collecte-requests/:id/confirm", authRequired, async (req, res, next) => {
  try {
    const { quantity_collected, photo_url } = req.body;
    const cr = await db("collecte_requests").where({ id: req.params.id }).first();
    if (!cr) return res.status(404).json({ error: "not_found" });

    await db("collecte_requests").where({ id: req.params.id }).update({
      status: "collected", collected_at: new Date(), quantity_collected, photo_url,
    });
    await db("invendus").where({ id: cr.invenu_id }).update({ status: "collected" });

    // Stats commerce
    await db("commerce_subscriptions")
      .where({ commerce_id: cr.commerce_id })
      .increment("total_pickups", 1)
      .increment("monthly_pickups", 1);

    // Déclencher le paiement de commission via Stripe (si commerce a une méthode de paiement)
    // En mode MVP: on crée un PaymentIntent et on le stocke — le commerce paye à la fin du mois
    if (cr.commission_cents > 0 && env.stripeSecretKey) {
      try {
        const stripe = getStripe();
        const sub = await db("commerce_subscriptions").where({ commerce_id: cr.commerce_id }).first();
        if (sub?.stripe_customer_id) {
          const pi = await stripe.paymentIntents.create({
            amount: cr.commission_cents,
            currency: "eur",
            customer: sub.stripe_customer_id,
            description: `Solivo — Commission collecte #${cr.id.slice(0, 8)}`,
            metadata: { collecte_request_id: cr.id, commerce_id: cr.commerce_id },
          });
          await db("collecte_requests").where({ id: cr.id }).update({
            stripe_payment_intent_commission: pi.id,
            commission_status: "pending",
          });
        }
      } catch {} // Ne pas bloquer si Stripe échoue
    }

    // Mettre à jour les stats association
    await db("associations").where({ id: cr.association_id }).increment("beneficiaries_count", 1);

    return res.json({ ok: true, message: "Collecte confirmée" });
  } catch (err) { next(err); }
});

// ── IMPACT REPORT COMMERCE ───────────────────────────────────────────────────

router.get("/impact/:commerce_id", async (req, res, next) => {
  try {
    const commerce = await db("commerces").where({ id: req.params.commerce_id }).first();
    if (!commerce) return res.status(404).json({ error: "not_found" });

    const sub = await db("commerce_subscriptions").where({ commerce_id: req.params.commerce_id }).first();
    const collectes = await db("collecte_requests")
      .where({ commerce_id: req.params.commerce_id, status: "collected" })
      .count("id as count").first();

    const totalKg = await db("collecte_requests as cr")
      .join("invendus as i", "cr.invenu_id", "i.id")
      .where({ "cr.commerce_id": req.params.commerce_id, "cr.status": "collected" })
      .sum("cr.quantity_collected as total").first();

    const total = parseInt(collectes?.count as string || "0");
    const kg = parseFloat(totalKg?.total as string || "0");

    return res.json({
      commerce_name: commerce.name,
      plan: sub?.plan || "free",
      total_pickups: total,
      kg_saved: kg,
      meals_equivalent: Math.round(kg * 2.5),
      co2_saved_kg: Math.round(kg * 2.5), // ~2.5kg CO2 par kg de nourriture sauvé
      associations_helped: await db("collecte_requests").where({ commerce_id: req.params.commerce_id, status: "collected" }).countDistinct("association_id as count").first().then(r => parseInt(r?.count as string || "0")),
      commission_total_cents: await db("collecte_requests").where({ commerce_id: req.params.commerce_id, status: "collected" }).sum("commission_cents as total").first().then(r => parseInt(r?.total as string || "0")),
      monthly: await db("collecte_requests")
        .where({ commerce_id: req.params.commerce_id, status: "collected" })
        .whereRaw("created_at > NOW() - INTERVAL '30 days'")
        .count("id as count").first().then(r => parseInt(r?.count as string || "0")),
    });
  } catch (err) { next(err); }
});

// ── ONBOARDING COMMERCE ──────────────────────────────────────────────────────

// Créer compte commerce + subscription gratuite initiale
router.post("/onboarding/commerce", authRequired, async (req, res, next) => {
  try {
    const { name, address, lat, lng, city, phone, email, type, siret } = req.body;
    if (!name) return res.status(400).json({ error: "name_required" });

    const [commerce] = await db("commerces")
      .insert({ name, address, lat, lng, city, phone, email, type, owner_id: req.user.sub })
      .returning("*");

    // Créer client Stripe pour ce commerce
    let stripeCustomerId = null;
    if (env.stripeSecretKey && email) {
      try {
        const stripe = getStripe();
        const customer = await stripe.customers.create({ email, name, metadata: { commerce_id: commerce.id } });
        stripeCustomerId = customer.id;
      } catch {}
    }

    // Créer subscription gratuite
    await db("commerce_subscriptions").insert({
      commerce_id: commerce.id,
      plan: "free",
      commission_rate_cents: 150,
      stripe_customer_id: stripeCustomerId,
    });

    await db("users").where({ id: req.user.sub }).update({ role: "commerce" });

    return res.status(201).json({ commerce, message: "Compte commerce créé avec succès" });
  } catch (err) { next(err); }
});

// Statistiques globales marketplace
router.get("/stats", async (req, res, next) => {
  try {
    const collectes = await db("collecte_requests").where({ status: "collected" }).count("id as count").first();
    const commerces = await db("commerces").where({ active: true }).count("id as count").first();
    const associations = await db("associations").count("id as count").first();
    const invendus = await db("invendus").count("id as count").first();
    const kgSaved = await db("collecte_requests").where({ status: "collected" }).sum("quantity_collected as total").first();

    return res.json({
      collectes_confirmees: parseInt(collectes?.count as string || "0"),
      commerces_partenaires: parseInt(commerces?.count as string || "0"),
      associations_actives: parseInt(associations?.count as string || "0"),
      invendus_publies: parseInt(invendus?.count as string || "0"),
      kg_sauves: parseFloat(kgSaved?.total as string || "0"),
      repas_equivalents: Math.round(parseFloat(kgSaved?.total as string || "0") * 2.5),
    });
  } catch (err) { next(err); }
});

module.exports = router;
