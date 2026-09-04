"use server";

/**
 * There is deliberately no `page.tsx` beside this file — a directory without
 * one creates no route. Checkout lives inside the cart drawer; this is only
 * where its Server Action lives, mirroring app/contato/actions.ts.
 */

import { findCartProduct, formatBRL } from "@/lib/products";
import { deliveryEstimate, shippingCostCents, splitInstallments } from "@/lib/shipping";
import { EMAIL_RE, isValidCep } from "@/lib/validation";

/**
 * Everything the confirmation screen renders. It has to be self-contained:
 * a successful order clears the cart, so by the time this is on screen there
 * are no items left to read a total from.
 */
export interface CheckoutOrder {
  number: string;
  itemCount: number;
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
  etaLabel: string;
  paymentLabel: string;
  email: string;
}

export interface CheckoutState {
  status: "idle" | "success" | "error";
  message: string;
  /** Field name → error, so the form can mark the offending input. */
  fieldErrors?: Record<string, string>;
  /** Present only on success. Its presence *is* "we are on step 3". */
  order?: CheckoutOrder;
}

export const EMPTY_CHECKOUT_STATE: CheckoutState = { status: "idle", message: "" };

const MAX_QUANTITY = 99;

/**
 * The cart is client-only state, so the form carries it as one hidden input
 * per line (`name="item"`, value `id:quantity`) rather than a JSON blob —
 * there is no parse failure to handle, and a malformed line just drops.
 */
function readLines(formData: FormData): { subtotalCents: number; itemCount: number } {
  let subtotalCents = 0;
  let itemCount = 0;

  for (const raw of formData.getAll("item")) {
    const [id, rawQuantity] = String(raw).split(":");
    const product = findCartProduct(id);
    const quantity = Number(rawQuantity);

    /* An id the catalogue does not know is skipped rather than rejected: the
       cart is restored from localStorage and may name a product that has been
       retired since. */
    if (!product) continue;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) continue;

    /* Priced from the catalogue, never from the request. There is no money
       moving here, but a checkout that trusts a client-supplied price is the
       wrong shape to leave lying around for someone to build on. */
    subtotalCents += product.priceCents * quantity;
    itemCount += quantity;
  }

  return { subtotalCents, itemCount };
}

function describePayment(method: string, installments: number, totalCents: number): string {
  if (method === "pix") return "Pix";

  const { count, perCents, firstCents } = splitInstallments(totalCents, installments);
  if (count === 1) return `Cartão à vista — ${formatBRL(totalCents)}`;
  if (firstCents === perCents) {
    return `Cartão em ${count}× de ${formatBRL(perCents)} sem juros`;
  }
  /* The remainder rides on the first instalment. Printing only `perCents`
     would advertise a plan whose instalments do not add up to the total. */
  return `Cartão em ${count}× sem juros — primeira de ${formatBRL(firstCents)}, depois ${formatBRL(perCents)}`;
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const cep = String(formData.get("cep") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  const payment = String(formData.get("payment") ?? "");
  const installments = Number(formData.get("installments") ?? 1);

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2) fieldErrors.name = "Diz como te chamamos.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Esse e-mail não parece certo.";
  if (!isValidCep(cep)) fieldErrors.cep = "CEP tem 8 números.";
  if (address.length < 4) fieldErrors.address = "Falta a rua.";
  if (number.length < 1) fieldErrors.number = "Falta o número.";
  if (payment !== "pix" && payment !== "cartao") fieldErrors.payment = "Escolhe como pagar.";

  const { subtotalCents, itemCount } = readLines(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Faltou alguma coisa aí em cima.", fieldErrors };
  }

  /* Not a field error — there is no field to point at. The panel guards
     against reaching step 2 with an empty cart, so this only fires if the
     cart was emptied in another tab mid-checkout. */
  if (itemCount === 0) {
    return { status: "error", message: "Seu carrinho está vazio." };
  }

  const shippingCents = shippingCostCents(subtotalCents, cep);
  const totalCents = subtotalCents + shippingCents;

  // ------------------------------------------------------------------
  // TODO: this is a stub. It validates, re-prices and formats, but nothing
  // is charged and no order is stored. A real one needs a payment provider,
  // rate limiting (this endpoint is public and unauthenticated by design),
  // and an idempotency key so a double submit cannot create two orders.
  // ------------------------------------------------------------------
  console.info("[checkout] pedido simulado", { name, email, cep, itemCount, totalCents });

  return {
    status: "success",
    message: "Pedido confirmado.",
    order: {
      /* Generated here rather than in the component: a value produced during
         render would differ between the server and client HTML, and would
         change again on every re-render. */
      number: `CB-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`,
      itemCount,
      subtotalLabel: formatBRL(subtotalCents),
      shippingLabel: shippingCents === 0 ? "Grátis" : formatBRL(shippingCents),
      totalLabel: formatBRL(totalCents),
      etaLabel: deliveryEstimate(cep) ?? "a combinar",
      paymentLabel: describePayment(payment, installments, totalCents),
      email,
    },
  };
}
