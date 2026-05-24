import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Carte — Solivo",
  description: "Explorez les maraudes, signalements et commerces solidaires près de vous.",
};

const CarteClient = dynamic(
  () => import("@/components/map/CarteClient").then(m => ({ default: m.CarteClient })),
  {
    ssr: false,
    loading: () => (
      <div className="pt-16 h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-white/30 text-sm animate-pulse">Chargement de la carte…</div>
      </div>
    ),
  }
);

export default function CartePage() {
  return <CarteClient />;
}
