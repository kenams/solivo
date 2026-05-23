import Link from "next/link";

const steps = [
  { icon: "📍", step: "01", title: "Inscription gratuite", desc: "Créez votre compte en 30 secondes. Aucun abonnement, aucune carte bancaire." },
  { icon: "🗺️", step: "02", title: "Explorez la carte", desc: "Voyez les maraudes, les besoins signalés et les invendus disponibles près de vous." },
  { icon: "🤝", step: "03", title: "Agissez", desc: "Rejoignez une maraude, signalez un besoin, faites un don ou partagez vos invendus." },
  { icon: "📊", step: "04", title: "Mesurez l'impact", desc: "Suivez en temps réel l'utilisation des dons et les résultats des maraudes." },
];

const roles = [
  {
    icon: "👤", title: "Bénévoles",
    desc: "Rejoignez des maraudes, gagnez des badges, progressez dans le classement.",
    cta: "Je veux aider", href: "/inscription?role=volunteer",
    gradient: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-200",
    tag: "🏅 Gamification incluse",
  },
  {
    icon: "🏥", title: "Associations",
    desc: "Gérez vos bénévoles, organisez vos maraudes et publiez vos comptes de manière transparente.",
    cta: "Mon association", href: "/associations/creer",
    gradient: "from-blue-500/10 to-cyan-500/5", border: "border-blue-200",
    tag: "💳 Stripe Connect",
  },
  {
    icon: "🛒", title: "Commerces",
    desc: "Donnez vos invendus, réduisez le gaspillage, générez un impact RSE mesurable.",
    cta: "Devenir partenaire", href: "/partenaires/commerce",
    gradient: "from-orange-500/10 to-amber-500/5", border: "border-orange-200",
    tag: "♻️ Impact RSE",
  },
  {
    icon: "💼", title: "Entreprises",
    desc: "Financez des actions solidaires locales et communiquez votre engagement social.",
    cta: "Programme RSE", href: "/partenaires/commerce",
    gradient: "from-purple-500/10 to-pink-500/5", border: "border-purple-200",
    tag: "📊 Rapport mensuel",
  },
];

export function HowItWorks() {
  return (
    <>
      {/* Comment ça marche */}
      <section className="py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-3 py-1 bg-white text-emerald-600 text-sm font-semibold rounded-full border border-emerald-100 mb-4 shadow-sm">
              Simple et efficace
            </span>
            <h2 className="text-5xl font-black text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-gray-500 text-lg">Aussi simple que possible. Aussi efficace que nécessaire.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent hidden md:block" />

            {steps.map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-4xl mx-auto">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-black text-gray-800 mb-2 text-lg">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pour qui ? */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full mb-4">
              Pour tout le monde
            </span>
            <h2 className="text-5xl font-black text-gray-900 mb-4">Votre rôle dans l&apos;écosystème</h2>
            <p className="text-gray-500 text-lg">Chacun a son rôle. Chacun a son impact.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => (
              <div key={i}
                className={`relative p-6 rounded-3xl bg-gradient-to-br ${r.gradient} border ${r.border} group card-hover overflow-hidden`}>
                <div className="text-4xl mb-4">{r.icon}</div>
                <span className="inline-block text-xs font-semibold px-2 py-0.5 bg-white/60 rounded-full text-gray-600 mb-3">{r.tag}</span>
                <h3 className="font-black text-gray-900 text-lg mb-2">{r.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">{r.desc}</p>
                <Link href={r.href}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  {r.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative py-28 bg-[#060f1e] overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px]" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/25 text-emerald-400 text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Rejoignez la communauté
          </div>
          <h2 className="text-5xl font-black text-white mb-4 leading-tight">
            Prêt à <span className="gradient-text">changer des vies</span> ?
          </h2>
          <p className="text-white/50 text-lg mb-12">
            Rejoignez la communauté Solivo et faites partie de la révolution solidaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription"
              className="btn-primary px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(52,211,153,0.3)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] hover:-translate-y-1 transition-all duration-300">
              Créer mon compte — Gratuit
            </Link>
            <Link href="/carte"
              className="px-8 py-4 glass border border-white/10 text-white font-bold text-lg rounded-2xl hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
              Explorer la carte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
