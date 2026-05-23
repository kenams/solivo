import Link from "next/link";

export const metadata = { title: "Conditions Générales d'Utilisation — Solivo" };

export default function CguPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <Link href="/" className="text-sm text-emerald-600 hover:underline">← Retour à l&apos;accueil</Link>
          <h1 className="text-4xl font-black text-gray-900 mt-4 mb-2">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-gray-500">Version 1.0 — mai 2026</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">1. Objet</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme
              <strong> Solivo</strong>, développée par KAH Digital. En créant un compte, vous acceptez sans réserve ces CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">2. Accès à la plateforme</h2>
            <p className="text-gray-600 leading-relaxed">
              L&apos;accès à Solivo est gratuit pour les utilisateurs, bénévoles et associations.
              Les commerces partenaires acceptent une commission de <strong>1,50€ par collecte confirmée</strong> (plan gratuit)
              ou 0,90€/collecte (plan Pro à 29€/mois).
              Solivo se réserve le droit de suspendre tout compte en cas de comportement contraire aux présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">3. Comptes utilisateurs</h2>
            <ul className="space-y-2 text-gray-600 text-sm">
              {[
                "Vous devez être âgé(e) d'au moins 16 ans pour créer un compte.",
                "Vous êtes responsable de la confidentialité de vos identifiants.",
                "Chaque personne ne peut posséder qu'un seul compte.",
                "Les informations fournies doivent être exactes et à jour.",
                "Solivo se réserve le droit de supprimer tout compte inactif depuis plus de 12 mois.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">4. Dons et paiements</h2>
            <p className="text-gray-600 leading-relaxed">
              Les dons effectués via Solivo sont traités par Stripe et transmis directement aux associations bénéficiaires.
              Les dons sont <strong>non remboursables</strong> une fois confirmés.
              La contribution volontaire à la plateforme (0 à 10%) est prélevée en supplément du don et ne parvient pas à l&apos;association.
              Solivo ne garantit pas le statut fiscal des dons (déductibilité d&apos;impôts selon l&apos;éligibilité de l&apos;association).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">5. Maraudes et bénévolat</h2>
            <p className="text-gray-600 leading-relaxed">
              Solivo est une plateforme de mise en relation. L&apos;organisation des maraudes relève entièrement de la responsabilité
              des associations. KAH Digital ne peut être tenu responsable des incidents survenus lors des maraudes.
              Les bénévoles participent de manière volontaire et à leurs propres risques.
              Il est recommandé aux associations de souscrire une assurance bénévole adaptée.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">6. Invendus alimentaires</h2>
            <p className="text-gray-600 leading-relaxed">
              La loi Garot (France) protège les donateurs de bonne foi. Les commerces partenaires certifient
              que les invendus proposés sont propres à la consommation au moment de la mise à disposition.
              Solivo fournit un contrat de cession gratuite. La responsabilité de la qualité des invendus
              incombe au commerce donateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">7. Comportements interdits</h2>
            <ul className="space-y-2 text-gray-600 text-sm">
              {[
                "Utiliser la plateforme à des fins frauduleuses ou illicites",
                "Publier des signalements ou contenus faux ou diffamatoires",
                "Usurper l'identité d'une association ou d'un bénévole",
                "Tenter de contourner les systèmes de paiement",
                "Harceler ou menacer d'autres utilisateurs",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">8. Modification des CGU</h2>
            <p className="text-gray-600 leading-relaxed">
              KAH Digital se réserve le droit de modifier ces CGU à tout moment.
              Les utilisateurs seront notifiés par email en cas de modification substantielle.
              La poursuite de l&apos;utilisation de la plateforme vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">9. Droit applicable</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes CGU sont soumises au droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-400 text-center">
              Pour toute question : <a href="mailto:contact@kah-digital.fr" className="text-emerald-500 hover:underline">contact@kah-digital.fr</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
