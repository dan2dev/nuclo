import type { DataLoader, PageProps, RouteContext } from "nuclo-router";
import { applyLocale, loadLocale, localePath, t, type Locale } from "../i18n/index.ts";
import { s } from "../styles.ts";
import {
  HomeHeroSection,
  PipelineSection,
  PhilosophySection,
  FeaturesSection,
  BenchmarkSection,
  CTASection,
} from "./home/components.ts";

// The locale's text, fetched before the page is built. null (an unknown locale) is the site's 404.
export const load: DataLoader<Locale | null> = (ctx) => loadLocale(ctx.params);

export function HomePage(_ctx: RouteContext, { data }: PageProps<Locale | null>) {
  applyLocale(data);
  // No such locale: the server answered 404; the page says so in the default language.
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
