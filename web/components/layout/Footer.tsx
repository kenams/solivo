import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-black text-white mb-2">🤝 Solivo</div>
            <p className="text-sm leading-relaxed">Solidarité locale, impact mondial. La plateforme collaborative de maraudes et d'entraide sociale.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Plateforme</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/carte" className="hover:text-white transition">Carte interactive</Link></li>
              <li><Link href="/maraudes" className="hover:text-white transition">Maraudes</Link></li>
              <li><Link href="/signalement" className="hover:text-white transition">Signalement</Link></li>
              <li><Link href="/don" className="hover:text-white transition">Faire un don</Link></li>
              <li><Link href="/transparence" className="hover:text-white transition">Transparence</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Communauté</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/associations" className="hover:text-white transition">Associations</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition">Classement</Link></li>
              <li><Link href="/inscription" className="hover:text-white transition">Rejoindre</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition">Confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition">CGU</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          © {new Date().getFullYear()} Solivo — Ensemble, on change le quartier.
        </div>
      </div>
    </footer>
  );
}
