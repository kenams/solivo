import Link from "next/link";
import { HeroSection } from "@/components/layout/HeroSection";
import { StatsSection } from "@/components/layout/StatsSection";
import { HowItWorks } from "@/components/layout/HowItWorks";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <Footer />
    </>
  );
}
