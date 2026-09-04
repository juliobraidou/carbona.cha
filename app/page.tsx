import { HeroCarousel } from "@/components/hero-carousel";

/**
 * The home page is deliberately one full viewport and nothing else — no
 * footer, no scroll — so it renders its own main landmark instead of going
 * through PageShell like the content pages do.
 */
export default function HomePage() {
  return (
    <main id="conteudo">
      <HeroCarousel />
    </main>
  );
}
