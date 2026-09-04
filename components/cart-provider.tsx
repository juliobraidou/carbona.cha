"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Versioned so a future shape change can be migrated instead of crashing. */
const STORAGE_KEY = "carbona.cart.v1";

interface CartActions {
  add: (productId: string, quantity?: number) => void;
  clear: () => void;
}

/**
 * Count and actions live in separate contexts on purpose: the "Adicionar"
 * buttons only ever call `add`, so they must not re-render every time the
 * badge in the header ticks up.
 */
const CartCountContext = createContext<number>(0);
const CartActionsContext = createContext<CartActions | null>(null);

type CartState = Record<string, number>;

function readStoredCart(): CartState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as CartState;
  } catch {
    // Private mode, blocked storage, or corrupt JSON — start empty.
    return {};
  }
}

function persist(state: CartState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable; the cart still works for this page view.
  }
}

function countItems(state: CartState): number {
  let total = 0;
  for (const key in state) total += state[key];
  return total;
}

export function CartProvider({ children }: { children: ReactNode }) {
  /* Starts empty on both server and client so the first client render matches
     the server HTML exactly — the stored cart is merged in after hydration,
     which avoids a mismatch warning and a flash of the wrong badge count. */
  const [items, setItems] = useState<CartState>({});

  useEffect(() => {
    const stored = readStoredCart();
    if (countItems(stored) > 0) setItems(stored);
  }, []);

  const add = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const next = { ...prev, [productId]: (prev[productId] ?? 0) + quantity };
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
    persist({});
  }, []);

  const actions = useMemo<CartActions>(() => ({ add, clear }), [add, clear]);
  const count = useMemo(() => countItems(items), [items]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartCountContext.Provider value={count}>{children}</CartCountContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCartCount(): number {
  return useContext(CartCountContext);
}

export function useCartActions(): CartActions {
  const actions = useContext(CartActionsContext);
  if (!actions) throw new Error("useCartActions must be used inside <CartProvider>");
  return actions;
}
