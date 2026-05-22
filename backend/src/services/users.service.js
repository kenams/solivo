const { db } = require("../config/db");
const { hashPassword, verifyPassword } = require("../utils/crypto");

async function findUserByEmail(email) {
  return db("users").whereRaw("LOWER(email) = ?", [email.toLowerCase()]).first();
}

async function findUserById(id) {
  return db("users").where({ id }).first();
}

async function createUser({ email, password, name, role = "user" }) {
  const [user] = await db("users")
    .insert({ email, password_hash: hashPassword(password), name, role })
    .returning("*");
  return user;
}

async function updateUser(id, data) {
  const [user] = await db("users").where({ id }).update({ ...data, updated_at: new Date() }).returning("*");
  return user;
}

async function addPoints(userId, points) {
  await db("users").where({ id: userId }).increment("points", points);
  await checkBadges(userId);
}

async function checkBadges(userId) {
  const user = await findUserById(userId);
  if (!user) return;
  const earned = await db("badges").where({ user_id: userId }).pluck("badge_key");

  const toEarn = [];

  if (user.maraudes_count >= 1 && !earned.includes("first_maraude"))
    toEarn.push({ user_id: userId, badge_key: "first_maraude", name: "Première Maraude", description: "Participé à votre première maraude", icon: "🌟" });
  if (user.maraudes_count >= 5 && !earned.includes("maraude_5"))
    toEarn.push({ user_id: userId, badge_key: "maraude_5", name: "Bénévole Confirmé", description: "5 maraudes effectuées", icon: "🏅" });
  if (user.maraudes_count >= 20 && !earned.includes("maraude_20"))
    toEarn.push({ user_id: userId, badge_key: "maraude_20", name: "Héros de la Rue", description: "20 maraudes effectuées", icon: "🏆" });
  if (user.total_donations >= 1000 && !earned.includes("donor_10"))
    toEarn.push({ user_id: userId, badge_key: "donor_10", name: "Donateur Solidaire", description: "Plus de 10€ donnés", icon: "💙" });
  if (user.total_donations >= 10000 && !earned.includes("donor_100"))
    toEarn.push({ user_id: userId, badge_key: "donor_100", name: "Grand Bienfaiteur", description: "Plus de 100€ donnés", icon: "💎" });
  if (user.points >= 100 && !earned.includes("points_100"))
    toEarn.push({ user_id: userId, badge_key: "points_100", name: "Impact Réel", description: "100 points d'impact", icon: "⚡" });

  if (toEarn.length > 0) await db("badges").insert(toEarn);
}

module.exports = { findUserByEmail, findUserById, createUser, updateUser, addPoints, checkBadges, verifyPassword };
