"use client";

import { motion } from "motion/react";

import { formatBRL } from "@/lib/products";
import { FREE_REST_CENTS, FREE_SUDESTE_CENTS } from "@/lib/shipping";

/**
 * Free shipping is regional — R$ 150 in the Sudeste, R$ 250 elsewhere — but
 * the region is not known until a CEP is typed on the next step, and this
 * belongs on the first one.
 *
 * So it shows both. Assuming the lower threshold would promise free shipping
 * the customer may not get; assuming the higher one would contradict the
 * site's own FAQ. One track running to R$ 250 with a mark at R$ 150 is true
 * before the CEP is known, and it is what the FAQ already commits to: "O
 * carrinho avisa quanto falta antes de você fechar."
 */
const TICK_AT = `${(FREE_SUDESTE_CENTS / FREE_REST_CENTS) * 100}%`;

function message(subtotalCents: number): string {
  if (subtotalCents >= FREE_REST_CENTS) {
    return "Frete grátis para todo o Brasil.";
  }
  if (subtotalCents >= FREE_SUDESTE_CENTS) {
    return `Frete grátis no Sudeste. Faltam ${formatBRL(FREE_REST_CENTS - subtotalCents)} para o resto do país.`;
  }
  return `Faltam ${formatBRL(FREE_SUDESTE_CENTS - subtotalCents)} para frete grátis no Sudeste — ${formatBRL(FREE_REST_CENTS - subtotalCents)} para o resto do país.`;
}

export function FreeShippingMeter({ subtotalCents }: { subtotalCents: number }) {
  const progress = Math.min(1, subtotalCents / FREE_REST_CENTS);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
        {/* scaleX rather than width: it stays off the layout path, and there
            is nothing inside the bar to be distorted by the scale. */}
        <motion.div
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          style={{ transformOrigin: "left" }}
          className="h-full rounded-full bg-limao"
        />
        <span
          aria-hidden="true"
          style={{ left: TICK_AT }}
          className="absolute inset-y-0 w-px bg-ink-raised"
        />
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-chalk-faint">{message(subtotalCents)}</p>
    </div>
  );
}
