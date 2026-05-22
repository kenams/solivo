import { Metadata } from "next";
import { MapView } from "@/components/map/MapView";

export const metadata: Metadata = {
  title: "Carte — Solivo",
  description: "Explorez les maraudes, signalements et commerces solidaires près de vous.",
};

export default function CartePage() {
  return (
    <div className="pt-16 h-screen flex flex-col">
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="font-bold text-gray-800">🗺️ Carte interactive</h1>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">🚶 Maraudes</span>
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full">⚠️ Besoins</span>
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">🛒 Invendus</span>
        </div>
      </div>
      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  );
}
