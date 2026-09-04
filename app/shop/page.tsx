import type { Metadata } from "next";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CanStack } from "@/components/can-stack";
import { FaqAccordion } from "@/components/faq-accordion";
import { FactIcon } from "@/components/icons";
import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import {
  INGREDIENT_FACTS,
  PACKS,
  SINGLES,
  TASTING_KIT,
  formatBRL,
} from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Latas avulsas, packs de 12 e o kit degustação com os três sabores da Carbona.",
};

export default function ShopPage() {
  return (
    <PageShell>
      {/* pt clears the fixed header: 144px at base, 168px in the 640–767px
          band where the mobile nav row is still showing. The old pt-36 was
          exactly the base header height, so the h1 started at its very edge. */}
      <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-40 sm:px-10 sm:pt-48">
        {/* ---------------------------------------------------------- SHOP */}
        <section aria-labelledby="shop-title">
          <Reveal>
            <h1 id="shop-title" className="section-title text-5xl sm:text-6xl">
              Shop
            </h1>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SINGLES.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.07} className="h-full">
                {/* The first can is above the fold on most screens. */}
                <ProductCard product={product} priority={index === 0} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------- PACKS */}
        <section aria-labelledby="packs-title" className="mt-24 scroll-mt-40 sm:scroll-mt-48" id="packs">
          <Reveal>
            <h2 id="packs-title" className="section-title text-5xl sm:text-6xl">
              Packs
            </h2>
          </Reveal>

          <div className="mt-8 border-t border-ink-hairline pt-8">
            {/* Edge-to-edge rail: four cards never fit a 12-column grid without
                squeezing the cans, so they scroll and snap instead. */}
            <ul className="rail -mx-6 flex gap-5 overflow-x-auto px-6 pb-2 sm:-mx-10 sm:px-10">
              {PACKS.map((pack, index) => (
                <li key={pack.id} className="w-[280px] shrink-0 sm:w-[320px]">
                  <Reveal delay={index * 0.06} className="h-full">
                    <ProductCard product={pack} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------- KIT DEGUSTAÇÃO */}
        <Reveal className="mt-20">
          <section
            aria-labelledby="kit-title"
            className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-ink-raised"
          >
            {/* Three overlapping glows, one per flavour — matches the artwork. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(40% 60% at 18% 55%, #e4002b33, transparent 70%), radial-gradient(40% 60% at 32% 50%, #8ed6003d, transparent 70%), radial-gradient(40% 60% at 46% 55%, #f5871f33, transparent 70%)",
              }}
            />

            {/* p-6 at base: with the page's own px-6, p-8 left a 263px text
                column on a 375px screen — the tightest measure on the site. */}
            <div className="relative grid items-center gap-10 p-6 sm:p-8 lg:grid-cols-2 lg:gap-6 lg:p-12">
              <div className="relative h-64 sm:h-80">
                <CanStack cans={TASTING_KIT.cans} image={TASTING_KIT.packImage} />
              </div>

              <div className="max-w-md">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-chalk-faint">
                  {TASTING_KIT.eyebrow}
                </p>
                <h2
                  id="kit-title"
                  className="mt-4 whitespace-pre-line text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl"
                >
                  {TASTING_KIT.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-chalk-faint">
                  {TASTING_KIT.description}
                </p>

                <p className="mt-7 flex items-baseline gap-3">
                  <span className="text-2xl font-bold tracking-tight sm:text-[28px]">
                    {formatBRL(TASTING_KIT.priceCents)}
                  </span>
                  <span className="text-xs text-chalk-faint">{TASTING_KIT.perCanLabel}</span>
                </p>

                <div className="mt-6 max-w-[280px]">
                  <AddToCartButton productId={TASTING_KIT.id} label={TASTING_KIT.cta} />
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ------------------------------------------------ O QUE TEM DENTRO */}
        <section aria-labelledby="dentro-title" className="mt-24 scroll-mt-40 sm:scroll-mt-48" id="dentro">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="dentro-title" className="section-title text-4xl sm:text-5xl">
                Oque tem dentro?
              </h2>
              <p className="text-xs text-chalk-faint">350 ml · sem conservantes</p>
            </div>
          </Reveal>

          {/* Two columns at `sm`, three only at `lg`: jumping straight to three
              put ~187px columns on a 640px screen. */}
          <ul className="mt-8 grid gap-10 border-t border-ink-hairline pt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {INGREDIENT_FACTS.map((fact, index) => (
              <li key={fact.title}>
                <Reveal delay={index * 0.07}>
                  <FactIcon name={fact.icon} className="size-6 text-chalk" />
                  <h3 className="mt-5 text-[15px] font-semibold text-chalk">{fact.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-chalk-faint">
                    {fact.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------- DUVIDAS */}
        <section aria-labelledby="duvidas-title" className="mt-24 scroll-mt-40 sm:scroll-mt-48" id="duvidas">
          <Reveal>
            <h2 id="duvidas-title" className="section-title text-4xl sm:text-5xl">
              Duvidas
            </h2>
          </Reveal>
          <div className="mt-8">
            <FaqAccordion />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
