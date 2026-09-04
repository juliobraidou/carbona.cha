/**
 * The three flavours are the spine of the whole site: they drive the hero
 * carousel, the shop grid, the packs rail and the footer links. Everything
 * reads from here so a new flavour is a one-object change.
 */

export type FlavorId = "limao" | "pessego" | "morango";

import ASSET_SIZES from "@/lib/asset-sizes.json";

export interface AssetSize {
  width: number;
  height: number;
}

/**
 * Intrinsic size of a piece of artwork, so next/image can reserve the right
 * space. The numbers come from scripts/prepare-assets.mjs rather than being
 * typed by hand — the cans in particular are cropped to one shared bounding
 * box (an independent crop per flavour would make the hero jump on every
 * switch), and that box changes whenever the artwork is replaced.
 */
/**
 * Whether prepare-assets.mjs has produced this artwork. Lets optional art
 * (the pack shots) be wired up before the files land, without a 404.
 */
export function hasAsset(path: string): boolean {
  return path in (ASSET_SIZES as Record<string, AssetSize>);
}

export function sizeOf(path: string): AssetSize {
  const size = (ASSET_SIZES as Record<string, AssetSize>)[path];
  if (!size) {
    throw new Error(`No recorded size for "${path}". Run: node scripts/prepare-assets.mjs`);
  }
  return size;
}

export interface Flavor {
  id: FlavorId;
  /** "Limão" — used on its own in nav/footer lists. */
  name: string;
  /** "Carbona Limão" — used as the product title. */
  productName: string;
  /** The line printed at the top of the can. */
  canLabel: string;
  /** Accent used for dots, glows and the bright label text. */
  accent: string;
  accentBright: string;
  /** Hero background gradient, dark at the top and saturated at the bottom. */
  gradient: { from: string; via: string; to: string };
  /** Transparent PNG of the can. */
  image: string;
  /** Transparent PNG of the fruit, used as hero garnish. */
  fruit: string;
  /**
   * Fine-tunes the corner garnish, as a multiplier on the shared hero
   * height. Sizing all three to one height gets them close, but not equal:
   * each fruit fills its own frame differently — the peach carries a leaf
   * and a stem, the lime is a flat slice, the berry runs edge to edge — so
   * the same box still leaves them at different visual weights.
   */
  heroFruitScale: number;
  /** Short line under the hero wordmark. */
  tagline: string;
}

export const FLAVORS: readonly Flavor[] = [
  {
    id: "limao",
    name: "Limão",
    productName: "Carbona Limão",
    canLabel: "CARBONA LIMÃO",
    accent: "#8ed600",
    accentBright: "#c4f000",
    gradient: { from: "#0a1502", via: "#2f6a0a", to: "#8ed600" },
    image: "/cans/limao.png",
    fruit: "/fruits/limao.png",
    heroFruitScale: 1,
    tagline: "Chá preto gaseificado com limão",
  },
  {
    id: "pessego",
    name: "Pêssego",
    productName: "Carbona Pêssego",
    canLabel: "CARBONA PÊSSEGO",
    accent: "#f5871f",
    accentBright: "#ffa54a",
    gradient: { from: "#150800", via: "#8a3d06", to: "#f5871f" },
    image: "/cans/pessego.png",
    fruit: "/fruits/pessego.png",
    heroFruitScale: 1,
    tagline: "Chá preto gaseificado com pêssego",
  },
  {
    id: "morango",
    name: "Morango",
    productName: "Carbona Morango",
    canLabel: "CARBONA MORANGO",
    accent: "#e4002b",
    accentBright: "#ff2d55",
    gradient: { from: "#120004", via: "#7a0a1c", to: "#e4002b" },
    image: "/cans/morango.png",
    fruit: "/fruits/morango.png",
    /* Back to parity: the earlier 0.9 was compensating for dead space around
       the berry in the old export, and the current source is already cropped
       tight, so keeping it would have shrunk the fruit twice. */
    heroFruitScale: 1,
    tagline: "Chá preto gaseificado com morango",
  },
] as const;

/** O(1) lookup — the carousel and the shop cards both resolve by id. */
const BY_ID = new Map<FlavorId, Flavor>(FLAVORS.map((f) => [f.id, f]));

export function getFlavor(id: FlavorId): Flavor {
  const flavor = BY_ID.get(id);
  if (!flavor) throw new Error(`Unknown flavor: ${id}`);
  return flavor;
}
