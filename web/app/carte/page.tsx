import { Metadata } from "next";
import { CarteClient } from "@/components/map/CarteClient";

export const metadata: Metadata = {
  title: "Carte — Solivo",
  description: "Explorez les maraudes, signalements et commerces solidaires près de vous.",
};

export default function CartePage() {
  return <CarteClient />;
}
