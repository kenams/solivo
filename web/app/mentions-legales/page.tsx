import Link from "next/link";

export const metadata = { title: "Mentions légales — Solivo" };

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <Link href="/" className="text-sm text-emerald-600 hover:underline">← Retour à l&apos;accueil</Link>
          <h1 className="text-4xl font-black text-gray-900 mt-4 mb-2">Mentions légales</h1>
          <p className="text-gray-500">Dernière mise à jour : mai 2026</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8 prose prose-gray max-w-none">
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Éditeur</h2>
            <p className="text-gray-600 leading-relaxed">
              La plateforme <strong>Solivo</strong> est éditée par <strong>KAH Digital</strong>, agence de développement numérique.
              <br />Email : <a href="mailto:contact@kah-digital.fr" className="text-emerald-600 hover:underline">contact@kah-digital.fr</a>
              <br />Site : <a href="https://kah-digital.fr" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">kah-digital.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Hébergement</h2>
            <p className="text-gray-600 leading-relaxed">
              La plateforme web est hébergée par <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis).
              <br />Le backend est hébergé par <strong>Render Inc.</strong> (San Francisco, États-Unis).
              <br />La base de données est hébergée par <strong>Supabase Inc.</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Paiements</h2>
            <p className="text-gray-600 leading-relaxed">
              Les paiements et dons sont traités par <strong>Stripe Inc.</strong> (510 Townsend Street, San Francisco, CA 94103, États-Unis).
              Solivo ne stocke aucune donnée bancaire. Toutes les transactions sont sécurisées et chiffrées par Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              L&apos;ensemble des contenus présents sur Solivo (textes, images, logos, design) est la propriété exclusive de KAH Digital,
              sauf contenus fournis par les associations et utilisateurs, qui restent sous leur responsabilité.
              Toute reproduction sans autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Responsabilité</h2>
            <p className="text-gray-600 leading-relaxed">
              Solivo est une plateforme de mise en relation entre bénévoles, associations et commerçants.
              KAH Digital ne peut être tenu responsable des actions des utilisateurs, des maraudes organisées,
              ni des invendus échangés entre les parties. Chaque association est responsable de ses activités.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question : <a href="mailto:contact@kah-digital.fr" className="text-emerald-600 hover:underline">contact@kah-digital.fr</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
