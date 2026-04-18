import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense>
        <StatsBar />
      </Suspense>
      <FeaturesGrid />
      <Suspense>
        <CategoryGrid />
      </Suspense>
    </>
  );
}
