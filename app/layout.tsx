import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Outfit } from "next/font/google";

import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import "@/app/globals.css";

/* Fonts are resolved once at module scope, never per request. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

/* The hero wordmark is set in a heavily expanded grotesque — Archivo's `wdth`
   axis goes to 125, which is what makes "CARBONA" span the full viewport
   the way it does in the Figma file. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://carbona.com.br"),
  title: {
    default: "Carbona — Chá preto gaseificado",
    template: "%s · Carbona",
  },
  description:
    "Chá preto gaseificado em três sabores: limão, pêssego e morango. Zero açúcar adicionado, cafeína natural, 350ml.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Carbona",
    title: "Carbona — Chá preto gaseificado",
    description: "Três sabores, nenhum atalho. Zero açúcar adicionado.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the inline script below adds a `js` class
    // before React hydrates, so this className differs from the server output.
    <html
      lang="pt-BR"
      className={`${inter.variable} ${outfit.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint, so the scroll-reveal hidden state only
            ever applies when JavaScript is actually available. Without it a
            failed bundle would leave every section at opacity 0. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js")`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-ink text-chalk antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-chalk focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        {/* The provider is the only client boundary in the shell — `children`
            stays a server-rendered subtree passed straight through it.

            `<main>` and the footer are supplied per page (via PageShell)
            rather than here: the home page is a single full-viewport frame
            with no footer, and a footer nested inside `<main>` would lose
            its `contentinfo` landmark. */}
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
