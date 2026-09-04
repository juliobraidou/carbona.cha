/**
 * Shipping thresholds, delivery estimates and instalment maths.
 *
 * A plain module, imported by both the cart UI and the checkout Server Action,
 * so a threshold can never drift between what the meter promises and what the
 * order actually charges.
 *
 * Every number here is stated in `lib/products.ts` FAQ copy. If one changes,
 * the answer has to change with it.
 */

import { digitsOnly } from "@/lib/validation";

/** "Acima de R$ 150 o frete sai de graça para todo o Sudeste…" */
export const FREE_SUDESTE_CENTS = 15000;
/** "…e acima de R$ 250 para o resto do país." */
export const FREE_REST_CENTS = 25000;

const FLAT_SUDESTE_CENTS = 1990;
const FLAT_REST_CENTS = 2990;

/**
 * CEP prefixes 01–39 are exactly SP, RJ, ES and MG — the whole Sudeste. Bahia
 * starts at 40. So the region test is one comparison rather than a table of
 * states, and it stays correct because the ranges are allocated geographically
 * and contiguously.
 */
function isSudeste(cepDigits: string): boolean {
  return Number(cepDigits.slice(0, 2)) <= 39;
}

/**
 * Without a CEP we cannot know the region, so this answers pessimistically —
 * the caller that has no CEP yet should show *both* tiers rather than lean on
 * this number alone. See `<FreeShippingMeter>`.
 */
export function freeShippingThresholdCents(cep: string): number {
  const digits = digitsOnly(cep);
  if (digits.length !== 8) return FREE_REST_CENTS;
  return isSudeste(digits) ? FREE_SUDESTE_CENTS : FREE_REST_CENTS;
}

export function shippingCostCents(subtotalCents: number, cep: string): number {
  const digits = digitsOnly(cep);
  if (digits.length !== 8) return FLAT_REST_CENTS;
  const sudeste = isSudeste(digits);
  if (subtotalCents >= (sudeste ? FREE_SUDESTE_CENTS : FREE_REST_CENTS)) return 0;
  return sudeste ? FLAT_SUDESTE_CENTS : FLAT_REST_CENTS;
}

/**
 * Three-digit CEP prefixes that open each state capital's range. Coarse on
 * purpose: this is an estimate shown next to the word "estimativa", not a
 * carrier quote, and the alternative is shipping a few hundred lines of
 * postcode table for a demo checkout.
 */
const CAPITAL_PREFIXES: readonly (readonly [number, number])[] = [
  [200, 231], // Rio de Janeiro
  [290, 291], // Vitória
  [300, 319], // Belo Horizonte
  [400, 419], // Salvador
  [490, 491], // Aracaju
  [500, 526], // Recife
  [570, 572], // Maceió
  [580, 582], // João Pessoa
  [590, 592], // Natal
  [600, 619], // Fortaleza
  [640, 641], // Teresina
  [650, 652], // São Luís
  [660, 663], // Belém
  [688, 689], // Macapá
  [690, 692], // Manaus
  [693, 693], // Boa Vista
  [699, 699], // Rio Branco
  [700, 727], // Brasília
  [740, 746], // Goiânia
  [768, 769], // Porto Velho
  [774, 774], // Palmas
  [780, 780], // Cuiabá
  [790, 790], // Campo Grande
  [800, 829], // Curitiba
  [880, 880], // Florianópolis
  [900, 916], // Porto Alegre
];

/**
 * Mirrors the first FAQ answer: "São Paulo capital e região metropolitana em
 * 2 dias úteis. Demais capitais entre 3 e 6 dias. Interior pode levar até 9."
 * Returns `undefined` until the CEP is complete, so the caller can hold the
 * line rather than print a guess.
 */
export function deliveryEstimate(cep: string): string | undefined {
  const digits = digitsOnly(cep);
  if (digits.length !== 8) return undefined;

  /* 01000–09999 is São Paulo capital plus the metropolitan region. */
  const prefix = Number(digits.slice(0, 3));
  if (prefix < 100) return "2 dias úteis";

  const capital = CAPITAL_PREFIXES.some(([from, to]) => prefix >= from && prefix <= to);
  return capital ? "3 a 6 dias úteis" : "até 9 dias úteis";
}

/** "…paga por Pix ou cartão em até 3× sem juros." */
export const MAX_INSTALLMENTS = 3;

export interface Installment {
  count: number;
  /** What each of the later instalments costs. */
  perCents: number;
  /**
   * The first one absorbs the rounding remainder. Printing `perCents` alone
   * for a total that does not divide evenly would advertise a plan whose
   * instalments do not add up to the total.
   */
  firstCents: number;
}

export function splitInstallments(totalCents: number, count: number): Installment {
  const safeCount = Math.min(MAX_INSTALLMENTS, Math.max(1, Math.trunc(count)));
  const perCents = Math.floor(totalCents / safeCount);
  const firstCents = perCents + (totalCents - perCents * safeCount);
  return { count: safeCount, perCents, firstCents };
}
