import {
  HomeHeroSection,
  PipelineSection,
  PhilosophySection,
  FeaturesSection,
  BenchmarkSection,
  CTASection,
} from "./home/components.ts";

export function HomePage() {
  return div(
    { id: "home-page" },
    HomeHeroSection(),
    PipelineSection(),
    PhilosophySection(),
    FeaturesSection(),
    BenchmarkSection(),
    CTASection(),
  );
}
