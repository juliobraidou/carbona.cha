"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { useCartCount } from "@/components/cart-provider";
import { CartIcon } from "@/components/icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/contato", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const count = useCartCount();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Scrim: the bar is fixed and transparent, so without this the page
          content scrolls straight through the logo. It blends into the dark
          top of the hero gradient and into the near-black inner pages. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-ink via-ink/85 to-transparent"
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

        <Link
          href="/shop"
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
              className="relative rounded-[20px] px-4 py-2 text-sm font-medium text-chalk-dim aria-[current=page]:text-chalk"
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
