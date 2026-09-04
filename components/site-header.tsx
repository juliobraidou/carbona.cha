"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { useCartCount } from "@/components/cart-provider";
import { useCartUIActions } from "@/components/cart-ui-provider";
import { CartIcon } from "@/components/icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/contato", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const count = useCartCount();
  const { openCart } = useCartUIActions();

  return (
    // data-scroll-lock-pad: globals.css pulls `right` in by the scrollbar
    // width while the drawer is open. See the note there — a fixed header
    // measures against a containing block that widens when the scrollbar goes.
    <header data-scroll-lock-pad className="fixed inset-x-0 top-0 z-50">
      {/* Scrim: the bar is fixed and transparent, so without this the page
          content scrolls straight through the logo. It blends into the dark
          top of the hero gradient and into the near-black inner pages.

          The height tracks the header's own: 144px at base, 168px in the
          640–767px band where the bar takes its `sm` size but the mobile nav
          row is still showing, and back to 144px once that row is hidden. A
          flat 144px left the nav pill sitting on raw page content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-ink via-ink/85 to-transparent sm:h-44 md:h-36"
      />

      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight text-chalk sm:text-[28px]"
        >
          Carbona
        </Link>

        <nav
          aria-label="Principal"
          className="absolute left-1/2 hidden -translate-x-1/2 rounded-[28px] bg-black/75 p-1.5 backdrop-blur-xl md:block"
        >
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="relative block rounded-[22px] px-5 py-2.5 text-[15px] font-medium text-chalk-dim transition-colors duration-160 hover:text-chalk aria-[current=page]:text-chalk"
                  >
                    {/* The pill is a shared element: it slides between items
                        instead of cross-fading, so the nav reads as one object
                        moving rather than three lights blinking. */}
                    {active ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-[22px] bg-white/14"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Still a <Link>, not a <button>: with JavaScript unavailable this
            keeps working and lands on the shop, which is the same principle
            the `.js` gate in globals.css applies to the scroll reveals.
            `aria-haspopup` is static, so the header stays subscribed to the
            drawer's actions only and never re-renders when it opens. */}
        <Link
          href="/shop"
          aria-haspopup="dialog"
          onClick={(event) => {
            event.preventDefault();
            openCart();
          }}
          /* Warms the drawer's lazy chunk so the slide-in is not waiting on a
             network round trip. Repeat calls hit the module cache. */
          onPointerEnter={() => void import("@/components/cart-panel")}
          className="relative grid size-12 place-items-center rounded-full bg-white/12 text-chalk backdrop-blur-xl transition-[background-color,transform] duration-160 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 active:scale-95 sm:size-14"
        >
          <span className="sr-only">
            Carrinho{count > 0 ? `, ${count} ${count === 1 ? "item" : "itens"}` : ", vazio"}
          </span>
          <CartIcon className="size-5 sm:size-[22px]" />

          <AnimatePresence>
            {count > 0 ? (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                /* Overshoot on entry — a small "pop" that confirms the add. */
                transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-limao px-1.5 text-[11px] font-bold leading-5 text-black"
              >
                {count}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Link>
      </div>

      {/* Mobile nav — the desktop pill would collide with the logo below md. */}
      <nav
        aria-label="Principal"
        className="mx-auto flex w-fit gap-1 rounded-[24px] bg-black/75 p-1.5 backdrop-blur-xl md:hidden"
      >
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              /* py-3, not py-2: at py-2 the row was 36px tall, under the 44px
                 minimum for a touch target. */
              className="relative rounded-[20px] px-4 py-3 text-sm font-medium text-chalk-dim aria-[current=page]:text-chalk"
            >
              {active ? (
                <motion.span
                  layoutId="nav-pill-mobile"
                  className="absolute inset-0 -z-10 rounded-[20px] bg-white/14"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
