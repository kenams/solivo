"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { api } from "@/lib/api";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || value === 0) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <div ref={ref} className="tabular-nums">
      {display > 0 ? display.toLocaleString("fr-FR") : "–"}{suffix}
    </div>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState({ maraudes: 0, beneficiaries: 0, donations: 0 });

  useEffect(() => {
    api.get("/donations/stats").then(data => {
      setStats({
        maraudes: parseInt(data.total_maraudes) || 0,
        beneficiaries: parseInt(data.total_beneficiaries) || 0,
        donations: Math.round((data.donations_total_cents || 0) / 100),
      });
    }).catch(() => {});
  }, []);

  const items = [
    { value: stats.maraudes, suffix: "", label: "Maraudes organisées", icon: "🚶", color: "text-emerald-400" },
    { value: stats.beneficiaries, suffix: "", label: "Personnes aidées", icon: "❤️", color: "text-rose-400" },
    { value: stats.donations, suffix: "€", label: "Dons collectés", icon: "💙", color: "text-blue-400" },
    { value: 100, suffix: "%", label: "Transparence", icon: "🔍", color: "text-purple-400" },
  ];

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-40" />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-full mb-4">Impact réel</span>
          <h2 className="text-4xl font-black text-gray-900">Des chiffres qui parlent</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative group"
            >
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className={`text-4xl font-black ${item.color} mb-2`}>
                  <AnimatedNumber value={item.value} suffix={item.suffix} />
                </div>
                <div className="text-sm text-gray-500 font-medium">{item.label}</div>
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity`}
                  style={{ background: `radial-gradient(circle at center, rgba(52,211,153,0.04), transparent 70%)` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
