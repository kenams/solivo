"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function StatsSection() {
  const [stats, setStats] = useState({ maraudes: 0, beneficiaries: 0, donations: 0, volunteers: 0 });

  useEffect(() => {
    api.get("/donations/stats").then(data => {
      setStats({
        maraudes: parseInt(data.total_maraudes) || 0,
        beneficiaries: parseInt(data.total_beneficiaries) || 0,
        donations: Math.round((data.donations_total_cents || 0) / 100),
        volunteers: 0,
      });
    }).catch(() => {});
  }, []);

  const items = [
    { value: stats.maraudes || "–", label: "Maraudes organisées", emoji: "🚶" },
    { value: stats.beneficiaries || "–", label: "Personnes aidées", emoji: "❤️" },
    { value: stats.donations ? `${stats.donations}€` : "–", label: "Dons collectés", emoji: "💙" },
    { value: "100%", label: "Transparence", emoji: "🔍" },
  ];

  return (
    <section className="bg-emerald-600 py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
          {items.map(i => (
            <div key={i.label}>
              <div className="text-4xl mb-2">{i.emoji}</div>
              <div className="text-4xl font-black mb-1">{i.value}</div>
              <div className="text-emerald-100 text-sm">{i.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
