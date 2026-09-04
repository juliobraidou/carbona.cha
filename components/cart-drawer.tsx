"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { useCartOpen, useCartUIActions } from "@/components/cart-ui-provider";

const SIGNATURE = [0.16, 1, 0.3, 1] as const;
/* --ease-exit from globals.css. Exits are faster than entrances: the user has
   already decided, and making them wait for the confirmation is just latency. */
const EXIT = [0.3, 0, 1, 1] as const;

/**
 * The panel carries the whole catalogue, asset-sizes.json and the checkout
 * form. This component sits in the root layout, so without the split all of
 * that would ship on the home page's first load to power a drawer that has
 * never been opened. It only ever mounts client-side, from a user gesture.
 */
const CartPanel = dynamic(() => import("@/components/cart-panel").then((m) => m.CartPanel));

function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const root = document.documentElement;
    /* Measured before the class lands. Afterwards the scrollbar is gone and
       this difference is always zero. */
    const gutter = window.innerWidth - root.clientWidth;
    root.style.setProperty("--scrollbar-gutter", `${gutter}px`);
    root.classList.add("cart-open");

    return () => {
      root.classList.remove("cart-open");
      root.style.removeProperty("--scrollbar-gutter");
    };
  }, [locked]);
}

/**
 * A native <dialog> driven by showModal(), rather than a hand-rolled overlay.
 * That one decision covers four things this codebase would otherwise have to
 * grow from scratch: the focus trap, returning focus to the cart button on
 * close, Escape, and painting above the z-50 header — a modal dialog renders
 * in the top layer, so z-index does not enter into it.
 *
 * It also makes `role="dialog"` and `aria-modal` redundant; the browser
 * conveys both, and the ARIA practices guide advises against adding
 * `aria-modal` here. Only the label is ours to supply.
 */
export function CartDrawer() {
  const open = useCartOpen();
  const { closeCart } = useCartUIActions();
  const dialogRef = useRef<HTMLDialogElement>(null);

  /* True from the moment it opens until the exit animation has finished, which
     is a little longer than `open` itself. The scroll lock has to follow this
     rather than `open`: releasing it the instant the state flips brings the
     scrollbar back mid-fade, and the page behind the still-visible scrim jumps
     15px — the exact shift the gutter compensation exists to prevent. */
  const [rendered, setRendered] = useState(false);

  useScrollLock(rendered);

  useEffect(() => {
    if (open) setRendered(true);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    // showModal() on an already-open dialog throws InvalidStateError.
    if (!dialog.open) dialog.showModal();
  }, [open]);

  /* close() drops the dialog out of the top layer immediately, which would cut
     the exit animation off mid-flight. So closing runs the other way round:
     the state flips, AnimatePresence plays the exit, and only then does the
     dialog actually close. It stays modal for those ~200ms, which is correct —
     the page behind it is not interactive yet. */
  const onExitComplete = useCallback(() => {
    dialogRef.current?.close();
    setRendered(false);
  }, []);

  const onCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      // Without this, Escape closes instantly and skips the exit entirely.
      event.preventDefault();
      closeCart();
    },
    [closeCart],
  );

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      aria-labelledby="cart-title"
      /* The UA centres a modal dialog and caps it at 90% of the viewport, and
         its ::backdrop is a pseudo-element that Motion cannot animate. So the
         dialog is reset to a full-viewport transparent frame, and the scrim
         inside it is a real element that can. */
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-chalk backdrop:bg-transparent"
    >
      <MotionConfig reducedMotion="user">
        {/* Both children sit directly under AnimatePresence. Wrapping them in
            a plain <div> would leave AnimatePresence with a non-motion child,
            which it removes immediately — the exit never plays and
            onExitComplete fires on the same tick, closing the dialog mid-slide. */}
        <AnimatePresence onExitComplete={onExitComplete}>
          {open ? (
            <motion.button
              key="scrim"
              type="button"
              onClick={closeCart}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: EXIT } }}
              transition={{ duration: 0.32, ease: SIGNATURE }}
              /* A real button, so clicking away is reachable from a keyboard
                 and announced, rather than a div only a mouse can find. */
              className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
            >
              <span className="sr-only">Fechar o carrinho</span>
            </motion.button>
          ) : null}

          {open ? (
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%", transition: { duration: 0.2, ease: EXIT } }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-ink-hairline bg-ink-raised shadow-[-24px_0_60px_rgba(0,0,0,0.5)]"
            >
              <CartPanel />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </MotionConfig>
    </dialog>
  );
}
