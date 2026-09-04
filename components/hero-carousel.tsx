"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { FLAVORS, sizeOf } from "@/lib/flavors";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";

/* Signature easing for the site: fast out, long gentle landing. */
const SIGNATURE = [0.16, 1, 0.3, 1] as const;

/* The idle drift on the can and the garnish is CSS — see `.can-drift` and
   `.garnish-drift` in globals.css. Motion owns the flavour swap only. */

function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

export function HeroCarousel() {
  /* Direction is stored next to the index so the exit animation knows which
     way the previous can should leave — without it the swap reads as a
     flicker instead of a rotation. */
  const [[index, direction], setState] = useState<[number, number]>([0, 1]);

  const flavor = FLAVORS[index];

  const paginate = useCallback((delta: number) => {
    setState(([current]) => [wrap(current + delta, FLAVORS.length), delta]);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        paginate(1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        paginate(-1);
      }
    },
    [paginate],
  );

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Sabores Carbona"
      onKeyDown={onKeyDown}
      className="relative isolate min-h-dvh overflow-hidden"
    >
      {/* ---- 1. Flavour gradient, crossfaded ---- */}
      {FLAVORS.map((f, i) => (
        <motion.div
          key={f.id}
          aria-hidden="true"
          initial={false}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 0.56, ease: SIGNATURE }}
          /* Bled past the section on both edges rather than `inset-0`. The
             layer measures a full 900px against a 900px section but paints
             32px high, so the body's near-black shows as a strip along the
             bottom; nothing in the ancestor chain carries a transform to
             explain it. The section clips overflow, so the bleed is free. */
          className="absolute inset-x-0 -top-12 -bottom-12 -z-50"
          style={{
            background: `linear-gradient(to bottom, ${f.gradient.from} 0%, ${f.gradient.from} 10%, ${f.gradient.via} 44%, ${f.gradient.to} 78%, ${f.gradient.to} 100%)`,
          }}
        />
      ))}

      {/* The mist along the bottom edge is a real photographic layer, but a
          quiet one: the bottom of the frame is lit by the gradient, and this
          only adds atmosphere over it. Stretched rather than covered — the
          texture's own alpha ramp (nothing at the top, 71% at the bottom) is
          the whole point, and `cover` crops away everything above the dense
          part, which lands as a white cloud with a visible top edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-40 h-[55%] bg-[url(/textures/fog.png)] bg-[length:100%_100%] opacity-45 mix-blend-screen"
      />

      {/* ---- 2. The giant wordmark, behind everything but the gradient ---- */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={flavor.id}
          aria-hidden="true"
          initial={{ opacity: 0, y: direction > 0 ? 40 : -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction > 0 ? -40 : 40 }}
          /* Lands 80ms after the can starts — follow-through, so the two
             layers read as connected rather than simultaneous. */
          transition={{ duration: 0.5, ease: SIGNATURE, delay: 0.08 }}
          className="pointer-events-none absolute left-1/2 top-[41%] -z-30 w-full -translate-x-1/2 -translate-y-1/2 select-none text-center text-[7.8vw] text-chalk"
        >
          {/* The horizontal stretch lives on the span so it cannot collide
              with the transform Motion animates on the paragraph. */}
          <span className="wordmark">Carbona</span>
        </motion.p>
      </AnimatePresence>

      {/* ---- 3. Water on the glass — sits over the gradient AND the
           wordmark, which is what makes the whole frame read as one photo. */}
      {/* One pass at one scale. Stacking copies at 62% and 38% was how this
          used to get enough density, but the smaller copies read as fine
          speckle rather than water — the drops have to stay big. The texture
          is amplified in the file instead (see prepare-assets.mjs). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-12 -bottom-12 -z-20 bg-[url(/textures/drops.png)] bg-cover bg-center mix-blend-screen"
      />

      {/* ---- 4. The big garnish, cropped by the bottom-left corner ----
           The drift sits on this wrapper and the flavour swap on the child.
           Both animate `y`, and on a single element the one declared second
           simply overwrites the first. */}
      <div
        aria-hidden="true"
        className="garnish-drift pointer-events-none absolute -bottom-[5vw] -left-[5vw] -z-10"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={flavor.id}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.56, ease: SIGNATURE, delay: 0.04 }}
            /* Sized by HEIGHT, not width. The three fruits have different
               proportions (843, 734 and 889 wide against the same 900 tall),
               so a shared width made the narrow ones tower: at 30vw wide the
               peach came out 36.8vw tall against the strawberry's 30.4vw.
               Driving from the height makes all three occupy the same band.

               No pixel cap either — a `max-w` would shrink the garnish to a
               third of its intended size on a large display while the can
               beside it kept scaling. */
            style={{ height: `calc(27vw * ${flavor.heroFruitScale})` }}
          >
            <Image
              src={flavor.fruit}
              alt=""
              width={sizeOf(flavor.fruit).width}
              height={sizeOf(flavor.fruit).height}
              sizes="27vw"
              className="h-full w-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---- 5. The can, with a smaller garnish tucked behind its base ---- */}
      <div className="relative flex min-h-dvh items-center justify-center">
        {/* The can is 64% of the viewport height in the Figma frame, and the
            whole composition — wordmark, garnishes — is sized off it.

            A pixel `max-h` cap breaks that relationship: it stops scaling
            while everything around it keeps going, so the can collapses to
            50% of the height on a 1440p screen and 33% on 4K. The second
            term of each `min()` is a width ceiling instead, which only
            engages on narrow viewports — where 64vh would otherwise make the
            can 70% of the screen width. */}
        {/* Same split as the garnish: the can's entrance owns `y` and
            `scale` on the child, so its idle drift has to live out here.
            Floating this wrapper carries the tucked garnish along with it,
            which keeps the two locked together instead of drifting apart. */}
        <div className="can-drift relative h-[min(52vh,105vw)] sm:h-[min(58vh,70vw)] lg:h-[min(64vh,47vw)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={flavor.id}
              initial={{ opacity: 0, y: direction > 0 ? 180 : -180, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: direction > 0 ? -180 : 180, scale: 0.88 }}
              transition={{ duration: 0.56, ease: SIGNATURE }}
              className="relative h-full"
            >
              {/* Behind the can — peeking out at the bottom-left, as in the
                  Figma frame. */}
              <Image
                src={flavor.fruit}
                alt=""
                aria-hidden="true"
                width={sizeOf(flavor.fruit).width}
                height={sizeOf(flavor.fruit).height}
                sizes="14vw"
                className="pointer-events-none absolute -left-[30%] bottom-[1%] -z-10 h-auto w-[56%] drop-shadow-[0_16px_36px_rgba(0,0,0,0.4)]"
              />

              <Image
                src={flavor.image}
                alt={`Lata de ${flavor.productName}, 350ml`}
                width={sizeOf(flavor.image).width}
                height={sizeOf(flavor.image).height}
                /* The hero can is the LCP element on the home page. */
                priority
                sizes="(max-width: 768px) 55vw, 26vw"
                className="h-full w-auto object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Live region so screen readers hear the flavour change. */}
      <p aria-live="polite" className="sr-only">
        {flavor.productName} — {flavor.tagline}
      </p>

      {/* ---- 6. Controls ---- */}
      <div className="absolute right-5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-4 sm:right-10">
        <CarouselButton label="Sabor anterior" onClick={() => paginate(-1)}>
          <ArrowUpIcon className="size-5" />
        </CarouselButton>
        <CarouselButton label="Próximo sabor" onClick={() => paginate(1)}>
          <ArrowDownIcon className="size-5" />
        </CarouselButton>
      </div>
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-12 place-items-center rounded-full border border-white/45 text-chalk/90 transition-[background-color,border-color,transform] duration-160 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/80 hover:bg-white/10 active:scale-90"
    >
      {children}
    </button>
  );
}
