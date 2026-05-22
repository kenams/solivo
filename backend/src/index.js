const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { env } = require("./config/env");
const { db } = require("./config/db");
const { errorHandler } = require("./middleware/error");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*", credentials: true }));

// Webhook Stripe doit recevoir le raw body
app.use("/donations/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", require("./routes/auth.routes"));
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

app.get("/health", (req, res) => res.json({ status: "ok", version: "1.0.0", uptime: process.uptime() }));

app.use(errorHandler);

async function runMigrations() {
  await db.migrate.latest({ directory: "./src/migrations" });
  console.log("✅ Migrations OK");
}

async function start() {
  try {
    await runMigrations();
    app.listen(env.port, () => {
      console.log(`🚀 Solivo API on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

start();
