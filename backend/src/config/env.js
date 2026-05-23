require("dotenv").config();

const isProd = process.env.NODE_ENV === "production";

function required(key, fallback) {
  const val = process.env[key];
  if (!val && isProd) throw new Error(`❌ Variable d'env manquante en production : ${key}`);
  return val || fallback;
}

const env = {
  port: parseInt(process.env.PORT || "3002"),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: required("JWT_SECRET", "dev-secret-local-only"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:8081,exp://").split(","),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: parseInt(process.env.SMTP_PORT || "587"),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "noreply@solivo.app",
  adminSecret: process.env.ADMIN_SECRET || "",
};

module.exports = { env };
