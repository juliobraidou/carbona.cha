import Link from "next/link";

import { FLAVORS } from "@/lib/flavors";

/* Static — hoisted so it is never rebuilt on a render. */
const COLUMNS = [
  {
    title: "PRODUTOS",
    links: [
      ...FLAVORS.map((f) => ({ label: f.name, href: `/shop#${f.id}` })),
      { label: "Packs", href: "/shop#packs" },
    ],
  },
  {
    title: "SOBRE",
    links: [
      { label: "Como fazemos", href: "/shop#dentro" },
      { label: "Duvidas", href: "/shop#duvidas" },
    ],
  },
  {
    title: "AJUDA",
    links: [
      { label: "Contato", href: "/contato" },
      { label: "Privacidade", href: "/privacidade" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-hairline bg-ink">
      <div className="mx-auto max-w-[1600px] px-6 pb-8 pt-20 sm:px-10 sm:pt-28">
        {/* Two columns from `sm`: stacked all the way to `lg` the footer ran
            about 1100px tall on a phone, which is longer than most of the
            pages above it. */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-10">
          <div className="max-w-xs">
            <p className="font-display text-5xl font-medium tracking-tight text-chalk sm:text-6xl">
              Carbona
            </p>
            <p className="mt-5 text-sm leading-relaxed text-chalk-faint">
              Chá preto gaseificado. Três sabores, nenhum atalho.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold tracking-[0.14em] text-chalk-faint">
                {column.title}
              </h2>
              {/* Padding on the link rather than gap on the list: as plain
                  text the tap target was ~23px tall with 12px between rows,
                  which is a mis-tap waiting to happen. The row spacing is
                  unchanged — it just moved inside the target. */}
              <ul className="mt-4 space-y-0.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block py-2.5 text-[15px] text-chalk-dim transition-colors duration-160 hover:text-chalk"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-ink-hairline pt-6 sm:mt-20">
          <p className="text-xs text-chalk-faint">
            © {new Date().getFullYear()} Carbona Bebidas Ltda · CNPJ 00.000.000/001-00
          </p>
        </div>
      </div>
    </footer>
  );
}
