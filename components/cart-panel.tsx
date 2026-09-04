"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { EMPTY_CHECKOUT_STATE, placeOrder, type CheckoutOrder } from "@/app/checkout/actions";
import { CHECKOUT_FORM_ID, CartCheckoutForm } from "@/components/cart-checkout-form";
import { CartLineItem } from "@/components/cart-line-item";
import { useCartActions, useCartItems } from "@/components/cart-provider";
import { useCartUIActions } from "@/components/cart-ui-provider";
import { FreeShippingMeter } from "@/components/free-shipping-meter";
import { ArrowLeftIcon, CartIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { findCartProduct, formatBRL, type CartProduct } from "@/lib/products";

const SIGNATURE = [0.16, 1, 0.3, 1] as const;

const TITLES: Record<number, string> = {
  1: "Seu carrinho",
  2: "Entrega e pagamento",
  3: "Pedido confirmado",
};

const ICON_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-chalk-dim transition-colors duration-160 hover:bg-white/10 hover:text-chalk";

interface ResolvedLine {
  product: CartProduct;
  quantity: number;
}

/**
 * Step state lives here, and this component only mounts while the drawer is
 * open — so unmounting *is* the reset, and there is nothing to keep in sync.
 *
 * That is also the reason the reset is on mount rather than on close: resetting
 * on close would snap the confirmation back to the cart list during the 200ms
 * exit animation, which is very visible. Reopening lands on step 1 with the
 * cart intact and the address blank, which is the right trade — the cart is the
 * customer's data and persists, a half-typed address is not worth keeping, and
 * persisting it would mean a stale order number outliving the order too.
 */
export function CartPanel() {
  const items = useCartItems();
  const { remove, clear } = useCartActions();
  const { closeCart } = useCartUIActions();

  const [state, formAction, isPending] = useActionState(placeOrder, EMPTY_CHECKOUT_STATE);
  const [[localStep, direction], setStep] = useState<[1 | 2, number]>([1, 1]);

  const { lines, subtotalCents, unknownKey } = useMemo(() => {
    const lines: ResolvedLine[] = [];
    const unknown: string[] = [];
    let cents = 0;

    for (const [id, quantity] of Object.entries(items)) {
      const product = findCartProduct(id);
      if (!product) {
        unknown.push(id);
        continue;
      }
      lines.push({ product, quantity });
      cents += product.priceCents * quantity;
    }

    return { lines, subtotalCents: cents, unknownKey: unknown.join(",") };
  }, [items]);

  /* The provider deliberately does not know the catalogue — teaching it would
     drag lib/products.ts into the root layout's bundle on every route. So the
     pruning of ids that no longer exist happens here, the first time the
     drawer opens, where the catalogue is already loaded. */
  useEffect(() => {
    if (!unknownKey) return;
    for (const id of unknownKey.split(",")) remove(id);
  }, [unknownKey, remove]);

  useEffect(() => {
    if (state.status === "success") clear();
  }, [state.status, clear]);

  const count = lines.reduce((total, line) => total + line.quantity, 0);

  /* Step 3 is not something anyone sets — it *is* "the action returned an
     order", so it is derived rather than bridged across with an effect.
     Order matters: `state.order` is tested first because a successful order
     empties the cart, and the empty-cart correction would otherwise bounce the
     confirmation straight back to step 1. */
  const step = state.order ? 3 : count === 0 ? 1 : localStep;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* On a step change the previous step's controls are gone. Without this the
     browser leaves focus on a detached button and drops the user at the top of
     the dialog. Focusing the title on the first pass also gives the dialog a
     sensible initial focus, instead of the first row's "−". */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, [step]);

  return (
    <>
      <div className="flex items-center gap-2 border-b border-ink-hairline px-4 py-4 sm:px-6">
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep([1, -1])}
            aria-label="Voltar para o carrinho"
            className={ICON_BUTTON}
          >
            <ArrowLeftIcon className="size-5" />
          </button>
        ) : null}

        <h2
          id="cart-title"
          ref={titleRef}
          tabIndex={-1}
          className="flex-1 text-lg font-semibold tracking-tight outline-none"
        >
          {TITLES[step]}
        </h2>

        {step === 2 ? (
          <span aria-hidden="true" className="text-xs tabular-nums text-chalk-faint">
            2 / 3
          </span>
        ) : null}

        <button type="button" onClick={closeCart} aria-label="Fechar o carrinho" className={ICON_BUTTON}>
          <CloseIcon className="size-5" />
        </button>
      </div>

      {/* `relative` because popLayout takes the outgoing step out of flow — it
          needs this box to position against. */}
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
            transition={{ duration: 0.32, ease: SIGNATURE }}
          >
            {step === 3 && state.order ? (
              <StepDone order={state.order} />
            ) : step === 2 ? (
              <CartCheckoutForm
                lines={lines.map((line) => ({ id: line.product.id, quantity: line.quantity }))}
                subtotalCents={subtotalCents}
                state={state}
                formAction={formAction}
              />
            ) : (
              <StepItems lines={lines} subtotalCents={subtotalCents} onClose={closeCart} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-ink-hairline px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        {step === 1 && count > 0 ? (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-chalk-faint">Subtotal</span>
              <span className="text-lg font-semibold tabular-nums">{formatBRL(subtotalCents)}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep([2, 1])}
              className="btn-surface w-full rounded-2xl px-5 py-3.5 text-sm font-medium"
            >
              Ir para entrega e pagamento
            </button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {state.status === "error" ? (
              <p aria-live="polite" className="mb-3 text-sm text-morango-bright">
                {state.message}
              </p>
            ) : null}
            {/* Outside the <form>, associated by id. `isPending` comes from
                useActionState rather than useFormStatus, which would require
                this button to be a descendant of the form. */}
            <button
              type="submit"
              form={CHECKOUT_FORM_ID}
              disabled={isPending}
              className="btn-surface w-full rounded-2xl px-5 py-3.5 text-sm font-medium"
            >
              {isPending ? "Confirmando…" : "Confirmar pedido"}
            </button>
          </>
        ) : null}

        {step === 3 ? (
          <button
            type="button"
            onClick={closeCart}
            className="btn-surface w-full rounded-2xl px-5 py-3.5 text-sm font-medium"
          >
            Continuar comprando
          </button>
        ) : null}

        {step === 1 && count === 0 ? (
          <Link
            href="/shop"
            onClick={closeCart}
            className="btn-surface block w-full rounded-2xl px-5 py-3.5 text-center text-sm font-medium"
          >
            Ver os sabores
          </Link>
        ) : null}
      </div>
    </>
  );
}

function StepItems({
  lines,
  subtotalCents,
  onClose,
}: {
  lines: readonly ResolvedLine[];
  subtotalCents: number;
  onClose: () => void;
}) {
  if (lines.length === 0) {
    return (
      <div className="py-10 text-center">
        <CartIcon className="mx-auto size-8 text-chalk-faint" />
        <p className="mt-4 text-[15px] font-medium text-chalk">Ainda não tem nada aqui.</p>
        <p className="mx-auto mt-2 max-w-[26ch] text-sm leading-relaxed text-chalk-faint">
          Três sabores, 350ml cada. Zero açúcar adicionado.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul>
        {lines.map((line) => (
          <CartLineItem key={line.product.id} product={line.product} quantity={line.quantity} />
        ))}
      </ul>
      <div className="mt-5">
        <FreeShippingMeter subtotalCents={subtotalCents} />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 text-xs text-chalk-faint underline-offset-4 transition-colors duration-160 hover:text-chalk-dim hover:underline"
      >
        Continuar comprando
      </button>
    </>
  );
}

function StepDone({ order }: { order: CheckoutOrder }) {
  return (
    <div className="py-6">
      <div className="grid size-12 place-items-center rounded-full bg-limao text-black">
        <CheckIcon className="size-6" />
      </div>

      <p className="mt-5 text-2xl font-bold tracking-tight">{order.number}</p>
      <p className="mt-2 text-sm leading-relaxed text-chalk-faint">
        Guardamos o número. O código de rastreio vai para <strong className="text-chalk-dim">{order.email}</strong> assim
        que o pedido sair daqui.
      </p>

      {/* Everything here comes from the action's payload, never from the cart —
          the cart was emptied the moment this screen appeared. */}
      <dl className="mt-6 space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 text-sm">
        <Summary term="Itens" value={`${order.itemCount}`} />
        <Summary term="Subtotal" value={order.subtotalLabel} />
        <Summary term="Frete" value={order.shippingLabel} />
        <Summary term="Entrega estimada" value={order.etaLabel} />
        <Summary term="Pagamento" value={order.paymentLabel} />
        <div className="border-t border-ink-hairline pt-2">
          <Summary term="Total" value={order.totalLabel} strong />
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-chalk-faint">
        Esta loja é uma demonstração — nenhum pagamento foi processado e nenhum pedido foi criado.
      </p>
    </div>
  );
}

function Summary({ term, value, strong }: { term: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-chalk" : "text-chalk-faint"}>{term}</dt>
      <dd className={`tabular-nums ${strong ? "text-base font-semibold text-chalk" : "text-chalk-dim"}`}>
        {value}
      </dd>
    </div>
  );
}
