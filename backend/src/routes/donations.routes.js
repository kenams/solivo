const express = require("express");
const Stripe = require("stripe");
const { env } = require("../config/env");
const { supabase, supa } = require("../config/supabase");
const { authRequired, optionalAuth } = require("../middleware/auth");
const { send, donationReceiptEmail } = require("../services/email.service");

const router = express.Router();

function getStripe() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-04-10" });
}

router.post("/checkout", optionalAuth, async (req, res, next) => {
  try {
    const { amount, anonymous = false, message, association_id, recurring = false, contribution_percent = 0 } = req.body;
    if (!amount || amount < 100 || amount > 500000) return res.status(400).json({ error: "invalid_amount" });

    const pct = Math.max(0, Math.min(30, parseInt(contribution_percent) || 0));
    const platformFee = Math.round(amount * pct / 100);
    const stripe = getStripe();

    let connectId = null;
    if (association_id) {
      const { data: asso } = await supabase.from("associations").select("stripe_connect_id").eq("id", association_id).eq("stripe_connect_status", "active").maybeSingle();
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
        unit_amount: amount, currency: "eur",
        recurring: { interval: "month" },
        product_data: { name: "Don mensuel Solivo" },
      });
      const sessionParams = {
        mode: "subscription", payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${env.appUrl}/don/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.appUrl}/don`, metadata, customer_email: req.user?.email,
      };
      if (connectId && pct > 0) {
        sessionParams.subscription_data = { application_fee_percent: pct, transfer_data: { destination: connectId } };
      }
      session = await stripe.checkout.sessions.create(sessionParams);
    } else {
      const sessionParams = {
        mode: "payment", payment_method_types: ["card"],
        line_items: [{ price_data: { currency: "eur", product_data: { name: "Don solidaire Solivo" }, unit_amount: amount }, quantity: 1 }],
        success_url: `${env.appUrl}/don/merci?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.appUrl}/don`, metadata, customer_email: req.user?.email,
      };
      if (connectId) {
        sessionParams.payment_intent_data = { application_fee_amount: platformFee, transfer_data: { destination: connectId } };
      }
      session = await stripe.checkout.sessions.create(sessionParams);
    }

    await supabase.from("donations").insert({
      donor_id: req.user?.sub || null, amount_cents: amount, currency: "eur",
      stripe_session_id: session.id, status: "pending", anonymous, recurring,
      recurring_interval: recurring ? "month" : null, association_id: association_id || null,
      message: message || null, contribution_percent: pct, platform_fee_cents: platformFee,
    });

    return res.json({ url: session.url, session_id: session.id });
  } catch (err) { next(err); }
});

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
      await supabase.from("donations").update({ status: "completed", stripe_payment_intent: session.payment_intent }).eq("stripe_session_id", session.id);
      const { data: donation } = await supabase.from("donations").select("*, users!donor_id(name, email), associations!association_id(name)").eq("stripe_session_id", session.id).maybeSingle();
      if (donation?.donor_id) {
        await supabase.rpc("sp_increment_field", { p_table: "users", p_id: donation.donor_id, p_column: "total_donations", p_amount: donation.amount_cents });
      }
      const donorEmail = donation?.users?.email || session.customer_email;
      const donorName = donation?.anonymous ? "Donateur anonyme" : (donation?.users?.name || session.customer_details?.name || "Donateur");
      if (donorEmail && !donation?.anonymous) {
        send({
          to: donorEmail,
          subject: `Merci pour votre don de ${(donation.amount_cents / 100).toFixed(2)}€ 💚`,
          html: donationReceiptEmail(donorName, (donation.amount_cents / 100).toFixed(2), donation?.associations?.name, donation?.recurring, session.id),
        }).catch(() => {});
      }
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "webhook_error" });
  }
});

router.get("/public", async (req, res, next) => {
  try {
    const { data: donations } = await supabase.from("donations")
      .select("id, amount_cents, currency, created_at, anonymous, message, recurring, contribution_percent, platform_fee_cents, users!donor_id(name), associations!association_id(name)")
      .eq("status", "completed").order("created_at", { ascending: false }).limit(50);

    const { data: stats } = await supabase.rpc("sp_donations_stats");

    return res.json({
      donations: (donations || []).map(d => ({
        id: d.id, amount_cents: d.amount_cents, currency: d.currency, created_at: d.created_at,
        anonymous: d.anonymous, message: d.message, recurring: d.recurring,
        contribution_percent: d.contribution_percent, platform_fee_cents: d.platform_fee_cents,
        donor_name: d.anonymous ? null : d.users?.name,
        association_name: d.associations?.name,
      })),
      total_cents: stats?.donations_total_cents || 0,
      count: stats?.donations_count || 0,
      platform_collected_cents: stats?.platform_collected_cents || 0,
    });
  } catch (err) { next(err); }
});

router.get("/stats", async (req, res, next) => {
  try {
    const { data } = await supabase.rpc("sp_donations_stats");
    return res.json(data);
  } catch (err) { next(err); }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const { data } = await supabase.from("donations").select("*").eq("donor_id", req.user.sub).eq("status", "completed").order("created_at", { ascending: false });
    return res.json(data || []);
  } catch (err) { next(err); }
});

module.exports = router;
