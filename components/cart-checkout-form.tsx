"use client";

import { useState } from "react";
import { motion } from "motion/react";

import type { CheckoutState } from "@/app/checkout/actions";
import { formatBRL } from "@/lib/products";
import {
  MAX_INSTALLMENTS,
  deliveryEstimate,
  shippingCostCents,
  splitInstallments,
} from "@/lib/shipping";
import { formatCep, isValidCep } from "@/lib/validation";

/** The id the panel's footer button points at with its `form` attribute. */
export const CHECKOUT_FORM_ID = "cart-checkout";

export interface CartLine {
  id: string;
  quantity: number;
}

const PAYMENTS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
] as const;

export function CartCheckoutForm({
  lines,
  subtotalCents,
  state,
  formAction,
}: {
  lines: readonly CartLine[];
  subtotalCents: number;
  state: CheckoutState;
  formAction: (formData: FormData) => void;
}) {
  const [cep, setCep] = useState("");
  const [payment, setPayment] = useState<"pix" | "cartao">("pix");
  const [installments, setInstallments] = useState(1);

  const errors = state.fieldErrors ?? {};

  /* Held back until the CEP is complete rather than shown as a guess — the
     region decides both the shipping cost and the estimate, and a number that
     changes under the user as they type reads as a glitch. */
  const resolved = isValidCep(cep);
  const shippingCents = resolved ? shippingCostCents(subtotalCents, cep) : undefined;
  const totalCents = subtotalCents + (shippingCents ?? 0);
  const eta = deliveryEstimate(cep);

  return (
    <form id={CHECKOUT_FORM_ID} action={formAction} className="pb-2">
      {/* The cart is client-only state, so it rides along as one hidden input
          per line. The server re-prices from the catalogue and ignores what it
          does not recognise — these values are a reference, not a quote. */}
      {lines.map((line) => (
        <input key={line.id} type="hidden" name="item" value={`${line.id}:${line.quantity}`} />
      ))}
      <input type="hidden" name="payment" value={payment} />
      {payment === "cartao" ? (
        <input type="hidden" name="installments" value={installments} />
      ) : null}

      <div className="grid gap-4">
        <Field id="co-name" name="name" label="Nome" placeholder="Como te chamamos" autoComplete="name" error={errors.name} />
        <Field id="co-email" name="email" type="email" label="Email" placeholder="voce@email.com" autoComplete="email" error={errors.email} />

        <Field
          id="co-cep"
          name="cep"
          label="CEP"
          placeholder="00000-000"
          autoComplete="postal-code"
          inputMode="numeric"
          value={cep}
          onChange={(event) => setCep(formatCep(event.target.value))}
          error={errors.cep}
        />

        <div className="grid grid-cols-[1fr_5rem] gap-4">
          <Field id="co-address" name="address" label="Endereço" placeholder="Rua, avenida…" autoComplete="street-address" error={errors.address} />
          <Field id="co-number" name="number" label="Número" placeholder="000" error={errors.number} />
        </div>
      </div>

      {/* Shipping lands next to the field that determines it, which is also
          the FAQ's promise: "O prazo exato aparece no carrinho depois do CEP." */}
      <dl className="mt-6 space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 text-sm">
        <Row term="Subtotal" value={formatBRL(subtotalCents)} />
        <Row
          term="Frete"
          value={
            shippingCents === undefined
              ? "informe o CEP"
              : shippingCents === 0
                ? "Grátis"
                : formatBRL(shippingCents)
          }
          muted={shippingCents === undefined}
        />
        {eta ? <Row term="Entrega estimada" value={eta} muted /> : null}
        <div className="border-t border-ink-hairline pt-2">
          <Row term="Total" value={resolved ? formatBRL(totalCents) : formatBRL(subtotalCents)} strong />
        </div>
      </dl>

      <fieldset className="mt-6">
        <legend className="text-[11px] font-semibold tracking-[0.14em] text-chalk-faint">
          COMO VOCÊ PAGA?
        </legend>

        <div className="mt-3 flex gap-2.5">
          {PAYMENTS.map((option) => {
            const active = option.value === payment;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPayment(option.value)}
                aria-pressed={active}
                className={`relative flex-1 rounded-full px-5 py-3 text-[15px] font-medium transition-colors duration-160 ${
                  active ? "text-ink" : "text-chalk-faint hover:text-chalk-dim"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="payment-pill"
                    className="absolute inset-0 rounded-full bg-chalk"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full border border-white/[0.09]" />
                )}
                <span className="relative">{option.label}</span>
              </button>
            );
          })}
        </div>

        {errors.payment ? (
          <p className="mt-2 text-xs text-morango-bright">{errors.payment}</p>
        ) : null}

        {payment === "cartao" ? (
          <div className="mt-4">
            <label htmlFor="co-installments" className="block text-sm text-chalk-dim">
              Parcelas
            </label>
            <select
              id="co-installments"
              value={installments}
              onChange={(event) => setInstallments(Number(event.target.value))}
              className="field mt-2"
            >
              {Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).map((count) => {
                const { perCents, firstCents } = splitInstallments(totalCents, count);
                return (
                  <option key={count} value={count}>
                    {count === 1
                      ? `À vista — ${formatBRL(totalCents)}`
                      : firstCents === perCents
                        ? `${count}× de ${formatBRL(perCents)} sem juros`
                        : `${count}× sem juros — 1ª de ${formatBRL(firstCents)}`}
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-chalk-faint">
            O código copia-e-cola chega por e-mail assim que o pedido é confirmado.
          </p>
        )}
      </fieldset>
    </form>
  );
}

function Row({
  term,
  value,
  muted,
  strong,
}: {
  term: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-chalk" : "text-chalk-faint"}>{term}</dt>
      <dd
        className={`tabular-nums ${
          strong ? "text-base font-semibold text-chalk" : muted ? "text-chalk-faint" : "text-chalk-dim"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  value,
  onChange,
  error,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric";
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm text-chalk-dim">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field mt-2"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-morango-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}
