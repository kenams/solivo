const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { env } = require("./config/env");
const { db } = require("./config/db");
const { errorHandler } = require("./middleware/error");

const app = express();

// ── Sécurité headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS : uniquement les origines connues
app.use(cors({
  origin: (origin, cb) => {
    // Requêtes sans origin (curl, mobile natif, Postman) → OK
    if (!origin) return cb(null, true);
    const ok = env.allowedOrigins.some(o => origin.startsWith(o.trim()));
    cb(ok ? null : new Error("CORS: origine non autorisée"), ok);
  },
  credentials: true,
}));

// ── Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});
app.use(globalLimiter);

// ── Rate limiting strict sur auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "too_many_auth_attempts" },
});

// Webhook Stripe doit recevoir le raw body avant express.json
app.use("/donations/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes
app.use("/auth", authLimiter, require("./routes/auth.routes"));
app.use("/maraudes", require("./routes/maraudes.routes"));
app.use("/signalements", require("./routes/signalements.routes"));
app.use("/donations", require("./routes/donations.routes"));
app.use("/map", require("./routes/map.routes"));
app.use("/leaderboard", require("./routes/leaderboard.routes"));
app.use("/associations", require("./routes/associations.routes"));
app.use("/commerces", require("./routes/commerces.routes"));
app.use("/invendus", require("./routes/invendus.routes"));
app.use("/beneficiaires", require("./routes/beneficiaires.routes"));
app.use("/terrain", require("./routes/terrain.routes"));
app.use("/marketplace", require("./routes/marketplace.routes"));
app.use("/admin", require("./routes/admin.routes"));

app.get("/health", (req, res) => res.json({ status: "ok", version: "1.0.0", uptime: process.uptime() }));

app.use(errorHandler);

// ── Keep-alive gratuit : auto-ping toutes les 14 min sur Render
function startKeepAlive() {
  const publicUrl = process.env.RENDER_EXTERNAL_URL;
  if (!publicUrl) return;
  const target = `${publicUrl}/health`;
  const mod = target.startsWith("https") ? require("https") : require("http");
  setInterval(() => {
    mod.get(target, () => {}).on("error", () => {});
  }, 14 * 60 * 1000);
  console.log(`🏃 Keep-alive actif → ${target}`);
}

async function runMigrations() {
  try {
    await db.migrate.latest({ directory: "./src/migrations" });
    console.log("✅ Migrations OK");
  } catch (err) {
    // Ne pas crasher — laisser le serveur démarrer même si DB inaccessible
    console.error("⚠️ Migration warning (non-fatal):", err.message);
  }
}

async function start() {
  try {
    await runMigrations();
    app.listen(env.port, () => {
      console.log(`🚀 Solivo API on port ${env.port} [${env.nodeEnv}]`);
      startKeepAlive();
    });
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

start();
