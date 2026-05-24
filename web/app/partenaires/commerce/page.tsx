"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MapPin, CheckCircle } from "lucide-react";

const AVANTAGES = [
  { emoji: "♻️", title: "Zéro gaspillage", desc: "Vos invendus nourrissent des personnes dans le besoin plutôt que de finir à la poubelle." },
  { emoji: "💚", title: "Impact RSE mesurable", desc: "Rapport mensuel : kg sauvés, repas offerts, CO₂ évité. Parfait pour votre communication." },
  { emoji: "📣", title: "Visibilité locale", desc: "Votre établissement affiché sur la carte Solivo avec badge 'Partenaire solidaire'." },
  { emoji: "💶", title: "Commission ultra-basse", desc: "1,50€ par collecte confirmée. Rien si personne ne collecte. Moins cher que la poubelle." },
  { emoji: "⚡", title: "Simple et rapide", desc: "Publiez un invenu en 30 secondes. Une association vient chercher. C'est tout." },
  { emoji: "🏅", title: "Certificat d'impact", desc: "Recevez chaque mois votre certificat de contribution solidaire à partager sur vos réseaux." },
];

const FAQ = [
  { q: "Combien ça coûte exactement ?", a: "1,50€ par collecte confirmée. Si personne ne collecte votre invenu, vous ne payez rien. Pas d'abonnement obligatoire." },
  { q: "Qui vient chercher la nourriture ?", a: "Des associations locales partenaires (Restos du Cœur, Secours Populaire, associations de maraudes...). Vous validez chaque demande avant qu'ils ne viennent." },
  { q: "Je dois être disponible quand ils viennent ?", a: "Vous définissez vos créneaux de collecte. L'association s'adapte à vos horaires." },
  { q: "Que faire si la nourriture n'est pas collectée à temps ?", a: "Vous pouvez annuler à tout moment. L'invenu est automatiquement retiré à expiration." },
  { q: "Est-ce que je suis responsable légalement ?", a: "Non. La loi française (loi Garot) protège les donateurs de bonne foi. Et Solivo fournit un contrat de cession gratuite." },
];

export default function PartenaireCommercePage() {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"landing" | "register" | "onboarding">("landing");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [commerceForm, setCommerceForm] = useState({ name: "", type: "restaurant", address: "", city: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      try {
        await login(authForm.email, authForm.password);
      } catch {
        await register(authForm.name, authForm.email, authForm.password, "commerce");
      }
      setStep("onboarding");
    } catch { toast.error("Erreur de connexion"); }
    finally { setLoading(false); }
  }

  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (!coords) return toast.error("Géolocalisez votre établissement");
    setLoading(true);
    try {
      await api.post("/marketplace/onboarding/commerce", { ...commerceForm, ...coords });
      toast.success("Bienvenue dans le réseau Solivo ! 🎉");
      router.push("/dashboard/commerce");
    } catch { toast.error("Erreur lors de la création"); }
    finally { setLoading(false); }
  }

  function geolocate() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocating(false);
    }, () => { setLocating(false); toast.error("Géolocalisation refusée"); });
  }

  if (step === "landing") return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-green-800 via-emerald-700 to-teal-600 text-white py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            🤝 Réseau Solivo — Partenaires Solidaires
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Vos invendus<br/>nourrissent<br/><span className="text-emerald-300">des familles.</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connectez vos surplus alimentaires aux associations de maraudes qui en ont besoin.
            <strong className="text-white"> 1,50€ par collecte.</strong> Rien de plus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setStep(user ? "onboarding" : "register")}
              className="px-8 py-4 bg-white text-emerald-700 font-black rounded-2xl hover:bg-emerald-50 transition shadow-xl">
              Rejoindre le réseau gratuitement
            </button>
            <Link href="#comment" className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl hover:bg-white/20 transition border border-white/20">
              Comment ça marche ?
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-6">Inscription en 2 minutes · Aucun engagement · 1ère collecte offerte</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: "1,50€", l: "par collecte confirmée" },
              { n: "0€", l: "si personne ne collecte" },
              { n: "100%", l: "des collectes traçables" },
              { n: "48h", l: "pour rejoindre le réseau" },
            ].map(s => (
              <div key={s.l}>
                <div className="text-3xl font-black text-emerald-600 mb-1">{s.n}</div>
                <div className="text-sm text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="py-20 bg-gray-50 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">En 4 étapes</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "1", emoji: "📝", t: "Inscrivez-vous", d: "Créez votre compte commerce en 2 minutes." },
              { n: "2", emoji: "🍞", t: "Publiez vos invendus", d: "30 secondes pour lister vos surplus du jour." },
              { n: "3", emoji: "🤝", t: "Une association collecte", d: "Vous validez la demande. Ils viennent chercher." },
              { n: "4", emoji: "📊", t: "Votre impact mesuré", d: "Kg sauvés, repas offerts, CO₂ évité. Tout compté." },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-black text-lg mx-auto mb-4">{s.n}</div>
                <div className="text-3xl mb-3">{s.emoji}</div>
                <h3 className="font-bold text-gray-800 mb-1">{s.t}</h3>
                <p className="text-sm text-gray-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">Pourquoi rejoindre Solivo ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {AVANTAGES.map(a => (
              <div key={a.title} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-3xl mb-3">{a.emoji}</div>
                <h3 className="font-bold text-gray-800 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarification */}
      <section className="py-20 px-6 bg-emerald-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-4">Tarification simple et honnête</h2>
          <p className="text-gray-500 mb-10">Vous ne payez que si une collecte est confirmée.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-4xl font-black text-gray-900 mb-1">Gratuit</div>
              <div className="text-gray-500 text-sm mb-6">Pour commencer</div>
              <ul className="space-y-3 text-left text-sm text-gray-600 mb-6">
                {["Inscription gratuite", "Publications illimitées", "1,50€ par collecte confirmée", "Impact report mensuel", "Badge Partenaire Solidaire"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <button onClick={() => setStep(user ? "onboarding" : "register")}
                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">
                Commencer maintenant
              </button>
            </div>
            <div className="bg-emerald-700 rounded-2xl p-8 text-white">
              <div className="text-4xl font-black mb-1">Pro</div>
              <div className="text-emerald-200 text-sm mb-1">29€/mois</div>
              <div className="text-xs text-emerald-300 mb-6">ou 249€/an (économisez 100€)</div>
              <ul className="space-y-3 text-left text-sm text-emerald-100 mb-6">
                {["Commission réduite à 0,90€/collecte", "Tableau de bord RSE avancé", "Certificat d'impact annuel", "Logo affiché sur la carte", "Priorité dans les recherches", "Support prioritaire"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-300 shrink-0" />{f}</li>
                ))}
              </ul>
              <button className="w-full py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition">
                Bientôt disponible
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-10">Questions fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map(f => (
              <div key={f.q} className="p-5 bg-gray-50 rounded-2xl">
                <h3 className="font-bold text-gray-800 mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 bg-emerald-600 text-white text-center">
        <h2 className="text-4xl font-black mb-4">Prêt à rejoindre le réseau ?</h2>
        <p className="text-emerald-100 text-lg mb-8">Des centaines d'associations attendent vos invendus.</p>
        <button onClick={() => setStep(user ? "onboarding" : "register")}
          className="px-10 py-4 bg-white text-emerald-700 font-black rounded-2xl hover:bg-emerald-50 transition shadow-xl text-lg">
          Rejoindre Solivo — Gratuit
        </button>
      </section>
    </div>
  );

  if (step === "register") return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍞</div>
          <h1 className="text-2xl font-black text-gray-900">Créer mon compte commerce</h1>
          <p className="text-gray-500 text-sm mt-1">Déjà un compte ? Connectez-vous avec votre email.</p>
        </div>
        <form onSubmit={handleAuth} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
          <input required placeholder="Votre nom / Prénom du responsable" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <input type="email" required placeholder="Email professionnel" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <input type="password" required placeholder="Mot de passe (8 caractères min.)" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition disabled:opacity-60">
            {loading ? "..." : "Continuer →"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📍</div>
          <h1 className="text-2xl font-black text-gray-900">Votre établissement</h1>
          <p className="text-gray-500 text-sm">Dernière étape — 1 minute chrono</p>
        </div>
        <form onSubmit={handleOnboarding} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
          <input required placeholder="Nom de l'établissement *" value={commerceForm.name} onChange={e => setCommerceForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <select value={commerceForm.type} onChange={e => setCommerceForm(f => ({ ...f, type: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700">
            <option value="restaurant">🍽️ Restaurant</option>
            <option value="bakery">🥖 Boulangerie / Pâtisserie</option>
            <option value="supermarket">🛒 Supermarché / Épicerie</option>
            <option value="other">🏪 Autre commerce alimentaire</option>
          </select>
          <input placeholder="Adresse complète *" value={commerceForm.address} onChange={e => setCommerceForm(f => ({ ...f, address: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Ville *" value={commerceForm.city} onChange={e => setCommerceForm(f => ({ ...f, city: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <input placeholder="Téléphone" value={commerceForm.phone} onChange={e => setCommerceForm(f => ({ ...f, phone: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <button type="button" onClick={geolocate} disabled={locating}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-medium transition ${coords ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-300 text-gray-500 hover:border-emerald-300"}`}>
            <MapPin size={16} />
            {locating ? "Détection..." : coords ? "✓ Position enregistrée" : "📍 Géolocaliser mon établissement *"}
          </button>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition disabled:opacity-60 text-lg">
            {loading ? "Création..." : "🚀 Rejoindre le réseau Solivo"}
          </button>
          <p className="text-center text-xs text-gray-400">En vous inscrivant, vous acceptez les <Link href="/cgu" className="text-emerald-500">conditions d'utilisation</Link> et la commission de 1,50€/collecte.</p>
        </form>
      </div>
    </div>
  );
}
