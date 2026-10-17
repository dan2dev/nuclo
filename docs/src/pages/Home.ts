import type { DataLoader, PageProps, RouteContext } from "nuclo-router";
import { applyLocale, loadLocale, localeOf, localePath, t, type Locale } from "../i18n/index.ts";
import { s } from "../styles.ts";
import {
  HomeHeroSection,
  PipelineSection,
  PhilosophySection,
  FeaturesSection,
  BenchmarkSection,
  CTASection,
} from "./home/components.ts";

// Fetch the locale before building. Unknown locales and unmatched paths return the site's 404.
export const load: DataLoader<Locale | null> = async (ctx) => {
  const locale = await loadLocale(ctx.params);
  return ctx.pattern === "*" || ctx.pattern.endsWith("/*") ? null : locale;
};

export function HomePage(ctx: RouteContext, { data }: PageProps<Locale | null>) {
  applyLocale(localeOf(ctx.params));
  // Keep a missing page in the URL's language when that locale exists.
  if (data === null) {
    return div(s.container, { id: "not-found", style: { padding: "80px 0" } },
      h1(s.sectionTitle, t.app.notFound),
      p(s.sectionSub, t.app.notFoundHint),
      p(a({ href: localePath("/") }, t.app.goHome)),
    );
  }
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
