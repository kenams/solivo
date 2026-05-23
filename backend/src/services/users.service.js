const { supabase, supa } = require("../config/supabase");
const { hashPassword, verifyPassword } = require("../utils/crypto");

async function findUserByEmail(email) {
  const { data } = await supabase.from("users").select("*").ilike("email", email.toLowerCase()).maybeSingle();
  return data;
}

async function findUserById(id) {
  const { data } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  return data;
}

async function createUser({ email, password, name, role = "user" }) {
  return supa(supabase.from("users").insert({ email, password_hash: hashPassword(password), name, role }).select().single());
}

async function updateUser(id, data) {
  return supa(supabase.from("users").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id).select().single());
}

async function addPoints(userId, points) {
  await supabase.rpc("sp_increment_field", { p_table: "users", p_id: userId, p_column: "points", p_amount: points });
  await checkBadges(userId);
}

async function checkBadges(userId) {
  const user = await findUserById(userId);
  if (!user) return;
  const { data: earned_ } = await supabase.from("badges").select("badge_key").eq("user_id", userId);
  const earned = (earned_ || []).map(r => r.badge_key);

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

  if (toEarn.length > 0) await supabase.from("badges").insert(toEarn);
}

module.exports = { findUserByEmail, findUserById, createUser, updateUser, addPoints, checkBadges, verifyPassword };
