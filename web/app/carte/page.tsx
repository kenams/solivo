"use client";
import dynamic from "next/dynamic";

const CarteClient = dynamic(
  () => import("@/components/map/CarteClient").then(m => ({ default: m.CarteClient })),
  { ssr: false }
);

export default function CartePage() {
  return <CarteClient />;
}
