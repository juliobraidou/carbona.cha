import { SiteFooter } from "@/components/site-footer";

/**
 * Wraps a content page in its main landmark and the site footer.
 *
 * The footer lives here rather than in the root layout because the home page
 * is a single full-viewport frame with no footer — and it cannot be a route
 * group layout either, since a footer rendered inside `<main>` stops being
 * exposed as a `contentinfo` landmark. Keeping both elements together here
 * means every content page gets the pair, and `<footer>` stays a sibling of
 * `<main>` directly under `<body>`.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main id="conteudo">{children}</main>
      <SiteFooter />
    </>
  );
}
