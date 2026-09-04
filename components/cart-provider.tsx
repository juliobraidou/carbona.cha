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

/** A ceiling, so a hand-edited entry cannot produce an absurd subtotal. */
const MAX_QUANTITY = 99;

export type CartState = Record<string, number>;

interface CartActions {
  add: (productId: string, quantity?: number) => void;
  /** Zero removes the line. */
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

/**
 * Three contexts rather than one, on purpose:
 *
 *   actions — identity never changes, so the "Adicionar" buttons never
 *             re-render at all
 *   items   — the map; only the cart panel subscribes
 *   count   — a number; only the header badge subscribes
 *
 * The extra layers cost nothing because `children` arrives as a prop from the
 * root layout: its element reference is stable across a provider render, so
 * React bails out on the entire server-rendered subtree when `items` changes.
 * That is the invariant the whole split rests on, and it breaks silently if
 * this provider is ever moved to wrap JSX it creates itself.
 */
const CartActionsContext = createContext<CartActions | null>(null);
const CartItemsContext = createContext<CartState>({});
const CartCountContext = createContext<number>(0);

function readStoredCart(): CartState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    /* Every value is checked rather than cast. An unchecked cast was harmless
       while the cart was only ever counted, but the panel multiplies quantity
       by price — a single corrupt entry there turns the whole subtotal into
       "R$ NaN".

       Ids that no longer exist in the catalogue are deliberately NOT dropped
       here: that would mean importing lib/products.ts, and with it the whole
       catalogue and asset-sizes.json, into the root layout's client bundle on
       every route. The cart panel already has the catalogue loaded and prunes
       them when it opens. Until then the badge can over-count — which only
       happens at all if a shipped product id is later deleted. */
    const clean: CartState = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value !== "number") continue;
      if (!Number.isInteger(value) || value < 1 || value > MAX_QUANTITY) continue;
      clean[id] = value;
    }
    return clean;
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

/** Returns the same object when there is nothing to delete, so no re-render. */
function without(state: CartState, productId: string): CartState {
  if (!(productId in state)) return state;
  const next = { ...state };
  delete next[productId];
  return next;
}

function countItems(state: CartState): number {
  let total = 0;
  for (const key in state) total += state[key];
  return total;
}

export function CartProvider({ children }: { children: ReactNode }) {
  /* Starts empty on both server and client so the first client render matches
     the server HTML exactly — the stored cart arrives after hydration, which
     avoids a mismatch warning and a flash of the wrong badge count. */
  const [items, setItems] = useState<CartState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  /* Writing to storage is an effect, not a line inside the setState updater.
     An updater has to be pure — React may call it more than once.

     The guard has to be render state, not a ref. Refs survive the unmount
     StrictMode simulates, so a "skip the first run" ref would see `false` on
     the second pass with `items` still empty, and wipe a real cart on every
     mount in development. This closure captured `hydrated === false` on the
     mount commit, so however many times React re-runs the effect, it cannot
     write over a cart it has not read yet. The first real write happens on
     the commit after hydration and stores exactly what was just read. */
  useEffect(() => {
    if (!hydrated) return;
    persist(items);
  }, [hydrated, items]);

  const add = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => ({
      ...prev,
      [productId]: Math.min(MAX_QUANTITY, (prev[productId] ?? 0) + quantity),
    }));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const next = Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(quantity)));
      /* Zero deletes the key rather than storing a 0, which would render as a
         phantom row and keep counting as a product in the cart. */
      return next === 0 ? without(prev, productId) : { ...prev, [productId]: next };
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => without(prev, productId));
  }, []);

  const clear = useCallback(() => setItems({}), []);

  const actions = useMemo<CartActions>(
    () => ({ add, setQuantity, remove, clear }),
    [add, setQuantity, remove, clear],
  );
  const count = useMemo(() => countItems(items), [items]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartItemsContext.Provider value={items}>
        <CartCountContext.Provider value={count}>{children}</CartCountContext.Provider>
      </CartItemsContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCartCount(): number {
  return useContext(CartCountContext);
}

export function useCartItems(): CartState {
  return useContext(CartItemsContext);
}

export function useCartActions(): CartActions {
  const actions = useContext(CartActionsContext);
  if (!actions) throw new Error("useCartActions must be used inside <CartProvider>");
  return actions;
}
