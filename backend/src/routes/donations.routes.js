const express = require("express");
const Stripe = require("stripe");
const { env } = require("../config/env");
const { db } = require("../config/db");
const { authRequired, optionalAuth } = require("../middleware/auth");

const router = express.Router();

function getStripe() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-04-10" });
}

// Créer une session de don (avec contribution volontaire + Stripe Connect)
router.post("/checkout", optionalAuth, async (req, res, next) => {
  try {
    const { amount, anonymous = false, message, association_id, recurring = false, contribution_percent = 0 } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: "min_amount_100_cents" });

    const pct = Math.max(0, Math.min(30, parseInt(contribution_percent) || 0));
    const platformFee = Math.round(amount * pct / 100);

    const stripe = getStripe();

    let connectId = null;
    if (association_id) {
      const asso = await db("associations").where({ id: association_id, stripe_connect_status: "active" }).first();
      connectId = asso?.stripe_connect_id || null;
    }

    const metadata = {
      donor_id: req.user?.sub || "anonymous",
      anonymous: String(anonymous),
      association_id: association_id || "",
      message: message || "",
      recurring: String(recurring),
      contribution_percent: String(pct),
      platform_fee_cents: String(platformFee),
    };

    let session;

    if (recurring) {
      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: "eur",
        recurring: { interval: "month" },
        product_data: { name: "Don mensuel Solivo" },
      });
      const sessionParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${env.appUrl}/don/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.appUrl}/don`,
        metadata,
        customer_email: req.user?.email,
      };
      if (connectId && pct > 0) {
        sessionParams.subscription_data = {
          application_fee_percent: pct,
          transfer_data: { destination: connectId },
        };
      }
      session = await stripe.checkout.sessions.create(sessionParams);
    } else {
      const sessionParams = {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: { name: "Don solidaire Solivo" },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        success_url: `${env.appUrl}/don/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.appUrl}/don`,
        metadata,
        customer_email: req.user?.email,
      };
      if (connectId) {
        sessionParams.payment_intent_data = {
          application_fee_amount: platformFee,
          transfer_data: { destination: connectId },
        };
      }
      session = await stripe.checkout.sessions.create(sessionParams);
    }

    await db("donations").insert({
      donor_id: req.user?.sub || null,
      amount_cents: amount,
      currency: "eur",
      stripe_session_id: session.id,
      status: "pending",
      anonymous,
      recurring,
      recurring_interval: recurring ? "month" : null,
      association_id: association_id || null,
      message: message || null,
      contribution_percent: pct,
      platform_fee_cents: platformFee,
    });

    return res.json({ url: session.url, session_id: session.id });
  } catch (err) { next(err); }
});

// Webhook Stripe
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], env.stripeWebhookSecret);
  } catch {
    return res.status(400).json({ error: "invalid_signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await db("donations").where({ stripe_session_id: session.id }).update({
        status: "completed",
        stripe_payment_intent: session.payment_intent,
      });
      const donation = await db("donations").where({ stripe_session_id: session.id }).first();
      if (donation?.donor_id) {
        await db("users").where({ id: donation.donor_id }).increment("total_donations", donation.amount_cents);
      }
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "webhook_error" });
  }
});

// Historique des dons (transparence publique)
router.get("/public", async (req, res, next) => {
  try {
    const donations = await db("donations as d")
      .leftJoin("users as u", "d.donor_id", "u.id")
      .leftJoin("associations as a", "d.association_id", "a.id")
      .select(
        "d.id", "d.amount_cents", "d.currency", "d.created_at",
        "d.anonymous", "d.message", "d.recurring",
        "d.contribution_percent", "d.platform_fee_cents",
        db.raw("CASE WHEN d.anonymous THEN NULL ELSE u.name END as donor_name"),
        "a.name as association_name"
      )
      .where("d.status", "completed")
      .orderBy("d.created_at", "desc")
      .limit(50);

    const total = await db("donations").where({ status: "completed" }).sum("amount_cents as total").first();
    const count = await db("donations").where({ status: "completed" }).count("id as count").first();
    const platformTotal = await db("donations").where({ status: "completed" }).sum("platform_fee_cents as total").first();

    return res.json({
      donations,
      total_cents: total?.total || 0,
      count: count?.count || 0,
      platform_collected_cents: platformTotal?.total || 0,
    });
  } catch (err) { next(err); }
});

// Stats transparence
router.get("/stats", async (req, res, next) => {
  try {
    const totalDonations = await db("donations").where({ status: "completed" }).sum("amount_cents as total").first();
    const totalExpenses = await db("expenses").sum("amount_cents as total").first();
    const byCategory = await db("expenses").groupBy("category").select("category").sum("amount_cents as total");
    const totalBeneficiaries = await db("maraudes").where({ status: "completed" }).sum("beneficiaries_helped as total").first();
    const totalMaraudes = await db("maraudes").where({ status: "completed" }).count("id as count").first();

    return res.json({
      donations_total_cents: totalDonations?.total || 0,
      expenses_total_cents: totalExpenses?.total || 0,
      balance_cents: (totalDonations?.total || 0) - (totalExpenses?.total || 0),
      by_category: byCategory,
      total_beneficiaries: totalBeneficiaries?.total || 0,
      total_maraudes: totalMaraudes?.count || 0,
    });
  } catch (err) { next(err); }
});

// Mes dons
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const donations = await db("donations")
      .where({ donor_id: req.user.sub, status: "completed" })
      .orderBy("created_at", "desc");
    return res.json(donations);
  } catch (err) { next(err); }
});

module.exports = router;
