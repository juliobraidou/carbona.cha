"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface CartUIActions {
  openCart: () => void;
  closeCart: () => void;
}

/**
 * Whether the drawer is open, split from the actions for the same reason the
 * cart data is: the header only ever *opens* the drawer, so it subscribes to
 * the actions alone and never re-renders when the drawer toggles. That matters
 * here beyond the usual — a header render re-runs the `layoutId="nav-pill"`
 * shared-element measurement for nothing.
 *
 * This is view state, not cart data, which is why it does not live in
 * cart-provider.tsx: that file is about what persists to localStorage.
 */
const CartUIStateContext = createContext<boolean>(false);
const CartUIActionsContext = createContext<CartUIActions | null>(null);

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const actions = useMemo<CartUIActions>(
    () => ({ openCart, closeCart }),
    [openCart, closeCart],
  );

  return (
    <CartUIActionsContext.Provider value={actions}>
      <CartUIStateContext.Provider value={open}>{children}</CartUIStateContext.Provider>
    </CartUIActionsContext.Provider>
  );
}

export function useCartOpen(): boolean {
  return useContext(CartUIStateContext);
}

export function useCartUIActions(): CartUIActions {
  const actions = useContext(CartUIActionsContext);
  if (!actions) throw new Error("useCartUIActions must be used inside <CartUIProvider>");
  return actions;
}
