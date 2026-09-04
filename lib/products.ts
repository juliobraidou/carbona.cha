import { FLAVORS, hasAsset, type Flavor, type FlavorId } from "@/lib/flavors";

/**
 * A real three-can pack shot, if one has been prepared. Without it the card
 * falls back to composing three single cans in CSS — fine, but the back cans
 * are just scaled copies of the front one, so a real shot always wins.
 */
function packArt(id: string): string | undefined {
  const path = `/packs/${id}.png`;
  return hasAsset(path) ? path : undefined;
}

/** Prices are stored in centavos so nothing ever touches float arithmetic. */
export interface Product {
  id: string;
  title: string;
  subtitle: string;
  priceCents: number;
  /** Drives the card's accent dot and glow. */
  flavor: Flavor;
  /** One can for a single, three for a pack — the card composes the artwork. */
  cans: readonly Flavor[];
  /** A prepared pack shot, used in place of composing `cans` when present. */
  packImage?: string;
  badge?: string;
  /** e.g. "15%OFF" — rendered next to the price on pack cards. */
  discountLabel?: string;
}

const SINGLE_PRICE_CENTS = 1190;
const PACK_PRICE_CENTS = 12050;

export const SINGLES: readonly Product[] = FLAVORS.map((flavor, index) => ({
  id: `single-${flavor.id}`,
  title: flavor.productName,
  subtitle: "350ml",
  priceCents: SINGLE_PRICE_CENTS,
  flavor,
  cans: [flavor],
  badge: index === 0 ? "DESTAQUE" : undefined,
}));

/** Left, middle, right — the mixed pack and the kit both show all three. */
const ALL_THREE = [FLAVORS[2], FLAVORS[0], FLAVORS[1]] as const;

export const PACKS: readonly Product[] = [
  ...FLAVORS.map((flavor) => ({
    id: `pack-${flavor.id}`,
    title: `Pack ${flavor.name} — 12 latas`,
    subtitle: "12 × 350ml",
    priceCents: PACK_PRICE_CENTS,
    flavor,
    cans: [flavor, flavor, flavor],
    packImage: packArt(flavor.id),
    discountLabel: "15%OFF",
  })),
  {
    id: "pack-misto",
    title: "Pack Misto — 12 latas",
    subtitle: "4 de cada sabor",
    priceCents: PACK_PRICE_CENTS,
    flavor: FLAVORS[0],
    cans: ALL_THREE,
    packImage: packArt("misto"),
    discountLabel: "15%OFF",
  },
];

export const TASTING_KIT = {
  eyebrow: "PRIMEIRA VEZ",
  title: "Kit Degustação\nos três sabores",
  description:
    "Seis latas, duas de cada. A forma mais barata de descobrir de qual lado você fica antes de fechar um pack de doze.",
  priceCents: 6490,
  perCanLabel: "R$ 10,82 por lata",
  cans: ALL_THREE,
  packImage: packArt("misto"),
  cta: "Adicionar ao Carrinho",
} as const;

/** "OQUE TEM DENTRO?" — icon is picked by name in the section component. */
export const INGREDIENT_FACTS = [
  {
    icon: "tea" as const,
    title: "Chá preto de verdade",
    body: "Infusão de folhas, não aroma. É de onde vem o amargo seco que segura a fruta.",
  },
  {
    icon: "no-sugar" as const,
    title: "Zero açúcar adicionado",
    body: "O dulçor vem da própria fruta. 12 kcal por lata.",
  },
  {
    icon: "bolt" as const,
    title: "Cafeína natural",
    body: "40 mg por lata, o mesmo de meia xícara de café. Energia sem o pico.",
  },
];

/**
 * Only the first answer is visible in the Figma file — the other three were
 * collapsed, so their copy is written in the same voice and should be
 * reviewed before launch.
 */
export const FAQ = [
  {
    q: "Qual o prazo de entrega?",
    a: "São Paulo capital e região metropolitana em 2 dias úteis. Demais capitais entre 3 e 6 dias. Interior pode levar até 9. O prazo exato aparece no carrinho depois do CEP.",
  },
  {
    q: "Quando o frete é gratis?",
    a: "Acima de R$ 150 o frete sai de graça para todo o Sudeste, e acima de R$ 250 para o resto do país. O carrinho avisa quanto falta antes de você fechar.",
  },
  {
    q: "Como funciona a compra?",
    a: "Escolhe as latas, paga por Pix ou cartão em até 3× sem juros, e recebe o código de rastreio por e-mail assim que o pedido sai daqui. Sem assinatura e sem fidelidade.",
  },
  {
    q: "E se chegar amassado ou vazando?",
    a: "Manda uma foto no WhatsApp em até 7 dias e a gente reenvia ou devolve o dinheiro. Você não precisa despachar a caixa de volta.",
  },
];

export const CONTACT_CHANNELS = [
  { label: "EMAIL", value: "contato@carbona.com.br", href: "mailto:contato@carbona.com.br" },
  { label: "WHATSAPP", value: "(19) 90000-0000", href: "https://wa.me/5519900000000" },
  { label: "INSTAGRAM", value: "@carbona", href: "https://instagram.com/carbona" },
];

export const CONTACT_SUBJECTS = ["Meu pedido", "Quero vender Carbona", "Outro assunto"] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Hoisted formatter — building an Intl instance per card is measurable on a grid. */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

export type { Flavor, FlavorId };
