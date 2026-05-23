"use client";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MapPin, Heart, AlertTriangle, Users, ArrowRight, Sparkles, Zap } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const features = [
  { icon: <MapPin size={18} />, label: "Carte interactive", href: "/carte", color: "from-blue-500/20 to-cyan-500/10", border: "border-blue-500/20", text: "text-blue-300", desc: "Maraudes & besoins près de vous" },
  { icon: <AlertTriangle size={18} />, label: "Signalement", href: "/signalement", color: "from-orange-500/20 to-amber-500/10", border: "border-orange-500/20", text: "text-orange-300", desc: "Alertez discrètement" },
  { icon: <span className="text-lg leading-none">♻️</span>, label: "Invendus", href: "/invendus", color: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/20", text: "text-emerald-300", desc: "Zéro gaspillage" },
  { icon: <Heart size={18} />, label: "Transparence", href: "/transparence", color: "from-purple-500/20 to-pink-500/10", border: "border-purple-500/20", text: "text-purple-300", desc: "Chaque euro traçable" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#060f1e] overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-500/8 rounded-full blur-[100px] animate-pulse-glow delay-300" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />

      {/* Floating elements */}
      <div className="absolute top-20 left-[15%] animate-float delay-200">
        <div className="w-12 h-12 rounded-2xl glass border border-emerald-500/20 flex items-center justify-center text-xl shadow-lg">🤝</div>
      </div>
      <div className="absolute top-32 right-[18%] animate-float-slow">
        <div className="w-10 h-10 rounded-xl glass border border-purple-500/20 flex items-center justify-center text-lg">💙</div>
      </div>
      <div className="absolute bottom-32 left-[20%] animate-float delay-400">
        <div className="w-10 h-10 rounded-xl glass border border-blue-500/20 flex items-center justify-center text-lg">🗺️</div>
      </div>
      <div className="absolute bottom-40 right-[15%] animate-float delay-100">
        <div className="w-12 h-12 rounded-2xl glass border border-orange-500/20 flex items-center justify-center text-xl">♻️</div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/25 text-emerald-400 text-sm font-semibold mb-10 shadow-lg"
        >
          <Sparkles size={14} className="animate-pulse" />
          Plateforme solidaire — France & International
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tight mb-8"
        >
          Ensemble,
          <br />
          <span className="gradient-text text-glow">on change</span>
          <br />
          le quartier.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Rejoignez des milliers de bénévoles pour des maraudes, signalez des personnes dans le besoin,
          faites des dons{" "}
          <span className="text-emerald-400 font-semibold">100% transparents</span>.
          Chaque euro traçable.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <Link href="/maraudes"
            className="btn-primary inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(52,211,153,0.35)] hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] hover:-translate-y-1 transition-all duration-300">
            <Users size={20} />
            Rejoindre une maraude
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/don"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 glass border border-white/10 text-white font-bold text-lg rounded-2xl hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
            <Heart size={20} className="text-emerald-400" />
            Faire un don
          </Link>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto"
        >
          {features.map((f, i) => (
            <Link key={i} href={f.href}
              className={`group p-5 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} card-hover-dark text-left`}>
              <div className={`${f.text} mb-3`}>{f.icon}</div>
              <div className="font-bold text-white text-sm mb-1">{f.label}</div>
              <div className="text-white/40 text-xs leading-relaxed">{f.desc}</div>
              <div className={`mt-3 flex items-center gap-1 text-xs ${f.text} font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                Découvrir <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="flex items-center justify-center gap-6 mt-16"
        >
          <div className="flex -space-x-2">
            {["🧑", "👩", "🧔", "👱", "🧕"].map((e, i) => (
              <div key={i} className="w-9 h-9 rounded-full glass border-2 border-[#060f1e] flex items-center justify-center text-base">{e}</div>
            ))}
          </div>
          <div className="text-left">
            <div className="text-white font-semibold text-sm">+2 400 bénévoles</div>
            <div className="text-white/40 text-xs">rejoints cette année</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex items-center gap-2 text-emerald-400">
            <Zap size={14} />
            <span className="text-sm font-semibold">Impact en temps réel</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}
