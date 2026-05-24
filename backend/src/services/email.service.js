const { env } = require("../config/env");

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const FROM = env.emailFrom || "noreply@solivo.app";

async function send({ to, subject, html }) {
  if (!RESEND_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `Solivo <${FROM}>`, to, subject, html }),
    });
  } catch (e) {
    console.error("Email send error:", e.message);
  }
}

function welcomeEmail(name) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;padding:14px 20px;font-size:28px">🤝</div>
        <h1 style="color:#111827;font-size:24px;font-weight:800;margin:16px 0 4px">Bienvenue sur Solivo, ${name} !</h1>
        <p style="color:#6b7280;font-size:14px;margin:0">La plateforme solidaire qui fait la différence</p>
      </div>
      <div style="background:#f0fdf4;border-radius:16px;padding:24px;margin-bottom:24px">
        <p style="color:#065f46;font-size:14px;margin:0 0 16px;font-weight:600">Ce que vous pouvez faire dès maintenant :</p>
        <ul style="color:#374151;font-size:14px;line-height:22px;margin:0;padding-left:20px">
          <li>🚶 Rejoindre une <strong>maraude</strong> près de chez vous</li>
          <li>⚠️ Signaler une situation d'urgence sur la <strong>carte</strong></li>
          <li>💚 Faire un <strong>don</strong> à une association locale</li>
          <li>⚡ Gagner des <strong>points de solidarité</strong> et des badges</li>
        </ul>
      </div>
      <div style="text-align:center">
        <a href="https://web-ten-kappa-35.vercel.app" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none">Accéder à Solivo →</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:28px">Solivo · Solidarité locale · <a href="https://web-ten-kappa-35.vercel.app" style="color:#10b981">solivo.app</a></p>
    </div>`;
}

function resetPasswordEmail(name, token, appUrl) {
  const url = `${appUrl}/reset-password?token=${token}`;
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <h1 style="color:#111827;font-size:22px;font-weight:800;margin-bottom:8px">Réinitialisation de mot de passe</h1>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px">Bonjour ${name}, vous avez demandé à réinitialiser votre mot de passe Solivo.</p>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${url}" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none">Réinitialiser mon mot de passe</a>
      </div>
      <p style="color:#9ca3af;font-size:12px">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>`;
}

function donationReceiptEmail(name, amountEuros, assoName, recurring, sessionId) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:48px;margin-bottom:12px">💚</div>
        <h1 style="color:#111827;font-size:24px;font-weight:800;margin:0 0 4px">Merci pour votre don !</h1>
        <p style="color:#6b7280;font-size:14px;margin:0">Votre générosité fait une vraie différence</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:16px;padding:24px;margin-bottom:24px">
        <p style="color:#065f46;font-size:13px;margin:0 0 16px;font-weight:600">Reçu de don</p>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#374151;font-size:14px">Donateur</span>
          <strong style="color:#111827;font-size:14px">${name}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#374151;font-size:14px">Montant</span>
          <strong style="color:#10b981;font-size:16px">${amountEuros}€${recurring ? "/mois" : ""}</strong>
        </div>
        ${assoName ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#374151;font-size:14px">Association</span><strong style="color:#111827;font-size:14px">${assoName}</strong></div>` : ""}
        ${recurring ? `<div style="background:#fef3c7;border-radius:8px;padding:10px;margin-top:12px"><p style="color:#92400e;font-size:12px;margin:0">🔁 Don mensuel activé — prélevé automatiquement chaque mois</p></div>` : ""}
        <p style="color:#9ca3af;font-size:11px;margin:12px 0 0">Référence : ${sessionId ? sessionId.slice(0, 20) + "..." : "—"}</p>
      </div>
      <div style="text-align:center;margin-bottom:20px">
        <a href="https://web-ten-kappa-35.vercel.app/transparence" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none">Voir la transparence des dons →</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center">Solivo · Association solidaire · Votre don est traité par Stripe</p>
    </div>`;
}

module.exports = { send, welcomeEmail, resetPasswordEmail, donationReceiptEmail };
