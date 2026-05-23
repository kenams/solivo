import { HeroSection } from "@/components/layout/HeroSection";
import { StatsSection } from "@/components/layout/StatsSection";
import { HowItWorks } from "@/components/layout/HowItWorks";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <HowItWorks />
    </>
  );
}
