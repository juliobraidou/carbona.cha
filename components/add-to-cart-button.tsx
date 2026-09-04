"use client";

import { useCallback, useRef, useState } from "react";

import { useCartActions } from "@/components/cart-provider";

/**
 * Confirms the add in place rather than firing a toast: the label swaps to
 * "Adicionado" for a beat, then returns. Nothing moves on the page, so a
 * fast click-through never fights an animation.
 */
export function AddToCartButton({
  productId,
  label = "Adicionar",
  className = "",
}: {
  productId: string;
  label?: string;
  className?: string;
}) {
  const { add } = useCartActions();
  const [added, setAdded] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onClick = useCallback(() => {
    add(productId);
    setAdded(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setAdded(false), 1400);
  }, [add, productId]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-surface relative w-full overflow-hidden rounded-2xl px-5 py-3.5 text-sm font-medium ${className}`}
    >
      <span aria-live="polite">{added ? "Adicionado ✓" : label}</span>
    </button>
  );
}
