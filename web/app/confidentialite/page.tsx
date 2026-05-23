import Link from "next/link";

export const metadata = { title: "Politique de confidentialité — Solivo" };

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <Link href="/" className="text-sm text-emerald-600 hover:underline">← Retour à l&apos;accueil</Link>
          <h1 className="text-4xl font-black text-gray-900 mt-4 mb-2">Politique de confidentialité</h1>
          <p className="text-gray-500">Dernière mise à jour : mai 2026 · Conforme RGPD</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Données collectées</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Lors de votre utilisation de Solivo, nous collectons :</p>
            <ul className="space-y-2 text-gray-600 text-sm">
              {[
                "Informations de compte : nom/pseudo, adresse email, mot de passe (hashé)",
                "Données de profil : ville, rôle, points et badges",
                "Données d'activité : maraudes rejointes, signalements, dons effectués",
                "Données de paiement : traitées exclusivement par Stripe (nous ne stockons aucun numéro de carte)",
                "Données de localisation : uniquement si vous activez la géolocalisation (carte, signalement)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Finalités du traitement</h2>
            <ul className="space-y-2 text-gray-600 text-sm">
              {[
                "Fonctionnement de la plateforme (inscription, connexion, maraudes)",
                "Traitement des dons et paiements via Stripe",
                "Gamification (points, badges, classement)",
                "Transparence des dons (certaines données peuvent être affichées publiquement si non-anonyme)",
                "Amélioration du service",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Durée de conservation</h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données sont conservées tant que votre compte est actif.
              En cas de suppression de compte, toutes vos données personnelles sont supprimées dans un délai de 30 jours.
              Les données anonymisées (statistiques agrégées) peuvent être conservées indéfiniment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Partage des données</h2>
            <p className="text-gray-600 leading-relaxed">
              Nous ne vendons aucune donnée à des tiers. Vos données peuvent être partagées uniquement avec :
            </p>
            <ul className="space-y-2 text-gray-600 text-sm mt-3">
              {[
                "Stripe Inc. — pour le traitement des paiements",
                "Supabase Inc. — pour le stockage de la base de données",
                "Vercel Inc. / Render Inc. — pour l'hébergement",
                "Les associations partenaires — uniquement les informations nécessaires à l'organisation des maraudes",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Vos droits (RGPD)</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { right: "Droit d'accès", desc: "Consulter toutes vos données" },
                { right: "Droit de rectification", desc: "Corriger des données inexactes" },
                { right: "Droit à l'effacement", desc: "Supprimer votre compte et données" },
                { right: "Droit à la portabilité", desc: "Exporter vos données" },
                { right: "Droit d'opposition", desc: "S'opposer à certains traitements" },
                { right: "Droit de retrait", desc: "Retirer votre consentement" },
              ].map((r, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="font-semibold text-gray-800 text-sm">{r.right}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Pour exercer ces droits : <a href="mailto:contact@kah-digital.fr" className="text-emerald-600 hover:underline">contact@kah-digital.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Solivo utilise uniquement des cookies strictement nécessaires au fonctionnement de la plateforme (session, authentification).
              Aucun cookie de tracking publicitaire n&apos;est utilisé.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
