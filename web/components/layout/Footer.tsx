import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#040b16] text-white/40 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-base shadow-lg">🤝</div>
              <span className="text-xl font-black text-white">Solivo</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              Solidarité locale, impact mondial. La plateforme collaborative de maraudes et d&apos;entraide sociale.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Plateforme active</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white/80 font-bold text-sm mb-4 uppercase tracking-wider">Plateforme</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/carte", label: "Carte interactive" },
                { href: "/maraudes", label: "Maraudes" },
                { href: "/invendus", label: "Invendus" },
                { href: "/don", label: "Faire un don" },
                { href: "/transparence", label: "Transparence" },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-bold text-sm mb-4 uppercase tracking-wider">Rejoindre</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/inscription", label: "Créer un compte" },
                { href: "/associations/creer", label: "Mon association" },
                { href: "/partenaires/commerce", label: "Devenir partenaire" },
                { href: "/commerces", label: "Commerces partenaires" },
                { href: "/leaderboard", label: "Classement" },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-bold text-sm mb-4 uppercase tracking-wider">Légal</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/mentions-legales", label: "Mentions légales" },
                { href: "/confidentialite", label: "Confidentialité" },
                { href: "/cgu", label: "CGU" },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Solivo — Ensemble, on change le quartier.</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">⚡</span>
              Propulsé par Stripe Connect
            </span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>🔒 RGPD compliant</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <a href="https://kah-digital.ch/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors group">
            <span className="text-white/25 text-xs">Made by</span>
            <span className="text-white/60 text-xs font-bold tracking-wide group-hover:text-white/80 transition-colors">KAH Digital</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
