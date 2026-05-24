import { HeroSection } from "@/components/layout/HeroSection";
import { StatsSection } from "@/components/layout/StatsSection";
import { HowItWorks } from "@/components/layout/HowItWorks";
import { HomeDashboard } from "@/components/layout/HomeDashboard";

export default function Home() {
  return (
    <>
      <HomeDashboard />
      <HeroSection />
      <StatsSection />
      <HowItWorks />
    </>
  );
}
