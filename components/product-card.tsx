import { AddToCartButton } from "@/components/add-to-cart-button";
import { CanStack } from "@/components/can-stack";
import { formatBRL, type Product } from "@/lib/products";

/**
 * Single-can card. Server-rendered — only the "Adicionar" button ships JS.
 * The flavour glow behind the can is what separates the three cards at a
 * glance, so it is driven by the flavour accent rather than a fixed colour.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { flavor } = product;

  return (
    <article
      id={flavor.id}
      className="group flex h-full scroll-mt-32 flex-col overflow-hidden rounded-[20px] border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-transparent p-5 transition-colors duration-320 hover:border-white/15"
    >
      <div className="flex items-start justify-between">
        {product.badge ? (
          <span className="text-[11px] font-semibold tracking-[0.12em] text-chalk-faint">
            {product.badge}
          </span>
        ) : (
          <span />
        )}
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: flavor.accent }}
        />
      </div>

      {/* Block layout with a definite height: inside a `grid place-items-center`
          the image is never stretched, so `h-full` falls back to the
          intrinsic size and overflows the card.

          The ratio lets the can grow with the card on wide screens; the
          `min-h` floor is what a card is at today's widths, so nothing
          changes below ~500px of card. */}
      <div className="relative aspect-[4/3] min-h-64 py-4 sm:min-h-72">
        {/* Ambient glow — sits behind the can and swells slightly on hover. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-90 opacity-70 transition-transform duration-560 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-100"
          style={{
            background: `radial-gradient(closest-side, ${flavor.accent}4d, transparent 72%)`,
          }}
        />
        <div className="relative h-full transition-transform duration-560 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5">
          <CanStack cans={product.cans} image={product.packImage} priority={priority} />
        </div>
      </div>

      <h3 className="text-[17px] font-medium leading-snug text-chalk">
        {product.title}
        <span className="block text-chalk-dim">{product.subtitle}</span>
      </h3>

      <p className="mt-2 text-sm text-chalk-faint">
        {formatBRL(product.priceCents)}
        {product.discountLabel ? (
          <span className="ml-2 font-medium text-chalk-dim">— {product.discountLabel}</span>
        ) : null}
      </p>

      <div className="mt-auto pt-5">
        <AddToCartButton productId={product.id} />
      </div>
    </article>
  );
}
