"use client";

import Image from "next/image";

import { useCartActions } from "@/components/cart-provider";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { sizeOf } from "@/lib/flavors";
import { formatBRL, type CartProduct } from "@/lib/products";

const STEP_BUTTON =
  "grid size-11 place-items-center rounded-full text-chalk-dim transition-colors duration-160 hover:text-chalk disabled:opacity-35 disabled:hover:text-chalk-dim";

export function CartLineItem({
  product,
  quantity,
}: {
  product: CartProduct;
  quantity: number;
}) {
  const { setQuantity } = useCartActions();

  return (
    <li className="flex items-start gap-4 border-b border-ink-hairline py-5 last:border-b-0">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
        {product.image ? (
          /* `product.image` was checked against asset-sizes.json when the
             catalogue was built, so sizeOf cannot throw here. */
          <Image
            src={product.image}
            alt=""
            width={sizeOf(product.image).width}
            height={sizeOf(product.image).height}
            sizes="64px"
            className="h-full w-auto object-contain p-1.5"
          />
        ) : (
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: product.flavor.accent }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-snug text-chalk">{product.title}</p>
        <p className="mt-0.5 text-xs text-chalk-faint">{product.subtitle}</p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-full border border-white/[0.09]">
            <button
              type="button"
              onClick={() => setQuantity(product.id, quantity - 1)}
              /* At one, the step down is a removal — so the label says so
                 rather than leaving a screen reader to infer it. */
              aria-label={
                quantity === 1 ? `Remover ${product.title}` : `Menos um ${product.title}`
              }
              className={STEP_BUTTON}
            >
              <MinusIcon className="size-4" />
            </button>
            <span aria-hidden="true" className="w-6 text-center text-sm tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(product.id, quantity + 1)}
              aria-label={`Mais um ${product.title}`}
              className={STEP_BUTTON}
            >
              <PlusIcon className="size-4" />
            </button>
          </div>

          <p className="text-[15px] font-medium tabular-nums text-chalk">
            <span className="sr-only">{quantity} unidades, </span>
            {formatBRL(product.priceCents * quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}
