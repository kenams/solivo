import Link from "next/link";

const steps = [
  { icon: "📍", title: "Inscription gratuite", desc: "Créez votre compte en 30 secondes. Aucun abonnement obligatoire." },
  { icon: "🗺️", title: "Explorez la carte", desc: "Voyez les maraudes près de vous, les besoins signalés, les commerces partenaires." },
  { icon: "🤝", title: "Agissez", desc: "Rejoignez une maraude, signalez un besoin, faites un don ou donnez vos invendus." },
  { icon: "📊", title: "Mesurez l'impact", desc: "Suivez en temps réel l'utilisation des dons et les résultats des maraudes." },
];

const roles = [
  { icon: "👤", title: "Bénévoles", desc: "Rejoignez des maraudes, gagnez des badges, progressez dans le classement.", cta: "Je veux aider", href: "/inscription?role=volunteer" },
  { icon: "🏥", title: "Associations", desc: "Gérez vos bénévoles, vos maraudes et publiez vos comptes de manière transparente.", cta: "Mon association", href: "/inscription?role=association" },
  { icon: "🛒", title: "Commerces", desc: "Donnez vos invendus, réduisez le gaspillage, impactez positivement votre quartier.", cta: "Devenir partenaire", href: "/inscription?role=commerce" },
  { icon: "💼", title: "Entreprises RSE", desc: "Financez des actions solidaires et communiquez votre engagement social.", cta: "Programme RSE", href: "/inscription?role=commerce" },
];

export function HowItWorks() {
  return (
    <>
      {/* Comment ça marche */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-gray-500 text-lg">Aussi simple que possible. Aussi efficace que nécessaire.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{s.icon}</div>
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pour qui ? */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Pour tout le monde</h2>
            <p className="text-gray-500 text-lg">Chacun a son rôle. Chacun a son impact.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="text-4xl mb-4">{r.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{r.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{r.desc}</p>
                <Link href={r.href} className="text-center px-4 py-2 bg-emerald-50 text-emerald-600 font-medium text-sm rounded-xl hover:bg-emerald-100 transition">
                  {r.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-4">Prêt à changer des vies ?</h2>
          <p className="text-emerald-100 text-lg mb-10">Rejoignez la communauté Solivo et faites partie de la révolution solidaire.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription" className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition shadow-lg">
              Créer mon compte gratuitement
            </Link>
            <Link href="/carte" className="px-8 py-4 bg-emerald-700 text-white font-bold rounded-2xl hover:bg-emerald-800 transition">
              Explorer la carte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
