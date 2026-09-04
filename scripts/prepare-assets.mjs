/**
 * Turns the artwork in assets/ into the web-ready files in public/, and
 * records the resulting sizes in lib/asset-sizes.json.
 *
 *   node scripts/prepare-assets.mjs && rm -rf .next/cache/images
 *
 * Drop new artwork in assets/{cans,fruits,packs}/<flavour>.png and re-run.
 * assets/ is the source of truth and is never written to; public/ is
 * generated and safe to delete. Reading and writing the same file would
 * make the run destructive — each pass would trim the previous pass's
 * output a little further and the art would creep smaller over time.
 *
 * What it fixes in a raw export:
 *
 * 1. A white backdrop, when the exporter cannot write transparency (it is a
 *    paid feature in several, Canva included). See lib/white-key.mjs.
 * 2. A faint ambient shadow at ~7% alpha covering the ENTIRE frame, out to
 *    the edges. Over a coloured background that reads as a grey rectangle
 *    around the product, and no amount of cropping removes it — the alpha
 *    channel has to be floored.
 * 3. Dead space: ~28% of the height below the can is empty, so `h-[64vh]`
 *    renders a can barely half that tall, floating above nothing.
 * 4. Weight: the exports run ~2.7 MB each.
 *
 * Each group is cropped to the UNION of its bounding boxes rather than
 * trimmed per file: an independent trim gives each flavour a slightly
 * different framing, and then the hero carousel jumps on every switch and
 * the shop cards sit off each other's baseline.
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { keyOutWhite, looksFlattenedOnWhite } from "./lib/white-key.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Rescales the alpha channel so everything below `floor` becomes fully
 * transparent and the rest stretches back out to 0-255. This is what kills
 * the ambient-shadow rectangle while leaving the product's own soft edge.
 */
async function floorAlpha(buffer, floor) {
  const scale = 255 / (255 - floor);
  const [rgb, alpha] = await Promise.all([
    sharp(buffer).removeAlpha().toBuffer(),
    sharp(buffer)
      .ensureAlpha()
      .extractChannel(3)
      .linear(scale, -floor * scale)
      .toBuffer(),
  ]);
  return sharp(rgb).joinChannel(alpha).png().toBuffer();
}

/** Bounding box of every pixel with any remaining opacity. */
async function alphaBounds(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    const row = y * width * channels;
    for (let x = 0; x < width; x += 1) {
      if (data[row + x * channels + 3] < 4) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error("image is fully transparent after flooring alpha");
  return { minX, minY, maxX, maxY, width, height };
}

function union(boxes) {
  return boxes.reduce((acc, b) => ({
    minX: Math.min(acc.minX, b.minX),
    minY: Math.min(acc.minY, b.minY),
    maxX: Math.max(acc.maxX, b.maxX),
    maxY: Math.max(acc.maxY, b.maxY),
    width: acc.width,
    height: acc.height,
  }));
}

function toExtract(box, pad = 4) {
  const left = Math.max(0, box.minX - pad);
  const top = Math.max(0, box.minY - pad);
  return {
    left,
    top,
    width: Math.min(box.width - left, box.maxX - left + 1 + pad),
    height: Math.min(box.height - top, box.maxY - top + 1 + pad),
  };
}

/** Collected for lib/asset-sizes.json so nothing is hand-synced. */
const manifest = {};

async function process(group, names, { targetHeight, shared, alphaFloor, optional = false }) {
  const present = await Promise.all(
    names.map(async (name) => {
      const from = join(ROOT, "assets", group, `${name}.png`);
      return (await stat(from).catch(() => null)) ? name : null;
    }),
  );
  const files = present.filter((name) => name !== null);

  if (files.length === 0) {
    if (optional) {
      console.log(`${group}/`.padEnd(28) + `skipped — no art in assets/${group}/`);
      return;
    }
    throw new Error(`no artwork found in assets/${group}/ (expected ${names.join(", ")})`);
  }
  if (files.length !== names.length) {
    console.log(`${group}/`.padEnd(28) + `${names.length - files.length} missing, skipped`);
  }

  const raw = await Promise.all(
    files.map((name) => readFile(join(ROOT, "assets", group, `${name}.png`))),
  );

  /* Accept artwork either way: already cut out, or still sitting on the
     white backdrop an exporter left behind. */
  const keyed = await Promise.all(
    raw.map(async (buffer, i) => {
      if (!(await looksFlattenedOnWhite(buffer))) return buffer;
      console.log(`${group}/${files[i]}`.padEnd(28) + "opaque on white — keying the backdrop out");
      return keyOutWhite(buffer);
    }),
  );

  const cleaned = await Promise.all(keyed.map((b) => floorAlpha(b, alphaFloor)));
  const boxes = await Promise.all(cleaned.map(alphaBounds));
  const crops = shared ? files.map(() => toExtract(union(boxes))) : boxes.map((b) => toExtract(b));

  await mkdir(join(ROOT, "public", group), { recursive: true });

  for (let i = 0; i < files.length; i += 1) {
    const out = await sharp(cleaned[i])
      .extract(crops[i])
      .resize({ height: targetHeight, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const meta = await sharp(out).metadata();
    const href = `/${group}/${files[i]}.png`;
    await writeFile(join(ROOT, "public", group, `${files[i]}.png`), out);

    manifest[href] = { width: meta.width, height: meta.height };
    console.log(
      `${href.padEnd(28)}${meta.width}x${meta.height}`.padEnd(42) +
        `${(out.length / 1024).toFixed(0)} KB`,
    );
  }
}

/**
 * Full-bleed textures: never trimmed or cropped, they stretch over the whole
 * hero. What they need instead is an alpha gain. The droplet texture peaks at
 * alpha 41 out of 255 — 97% of it sits below 26 — so at its authored strength
 * it is simply invisible over the gradient. Amplifying it in the file beats
 * stacking copies in CSS, which is what turned big water drops into fine
 * speckle: the smaller copies read as noise, not as drops.
 */
async function prepareTexture(name, { gain = 1, width } = {}) {
  const from = join(ROOT, "assets/textures", `${name}.png`);
  if (!(await stat(from).catch(() => null))) {
    console.log(`textures/${name}`.padEnd(28) + "skipped — not in assets/textures/");
    return;
  }

  const buffer = await readFile(from);
  const [rgb, alpha] = await Promise.all([
    sharp(buffer).removeAlpha().toBuffer(),
    sharp(buffer).ensureAlpha().extractChannel(3).linear(gain, 0).toBuffer(),
  ]);

  /* Join and resize have to be separate passes: sharp expects a joined
     channel to match the dimensions *after* any resize in the same pipeline,
     so doing both at once silently keeps the original height and squashes
     the texture (3738x3738 came out 2000x3738). */
  const joined = await sharp(rgb).joinChannel(alpha).png().toBuffer();
  let pipeline = sharp(joined);
  if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
  const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  const meta = await sharp(out).metadata();

  await mkdir(join(ROOT, "public/textures"), { recursive: true });
  await writeFile(join(ROOT, "public/textures", `${name}.png`), out);

  manifest[`/textures/${name}.png`] = { width: meta.width, height: meta.height };
  console.log(
    `/textures/${name}.png`.padEnd(28) +
      `${meta.width}x${meta.height}`.padEnd(14) +
      `${(out.length / 1024).toFixed(0)} KB`,
  );
}

const FLAVOURS = ["limao", "pessego", "morango"];

async function main() {
  await process("cans", FLAVOURS, { targetHeight: 1300, shared: true, alphaFloor: 70 });

  /* Fruit is garnish, each shape its own — no shared crop. */
  await process("fruits", FLAVOURS, { targetHeight: 900, shared: false, alphaFloor: 45 });

  /* Optional: real three-can pack shots. Drop them in and the shop cards use
     them instead of the CSS composition in components/can-stack.tsx, which
     can only scale and overlap copies of the same front-facing can — the
     back cans in a real shot are turned and lit as their own objects. */
  await process("packs", [...FLAVOURS, "misto"], {
    targetHeight: 1100,
    shared: true,
    alphaFloor: 70,
    optional: true,
  });

  /* Stretched over the hero, so no crop — just enough gain to be seen. The
     fog already carries its own top-to-bottom ramp and needs none. */
  await prepareTexture("drops", { gain: 6, width: 2000 });
  await prepareTexture("fog");

  /* next/image needs the intrinsic size to reserve space. Writing it out here
     keeps it correct automatically instead of asking someone to remember to
     update the numbers in lib/flavors.ts every time the artwork changes. */
  await writeFile(
    join(ROOT, "lib/asset-sizes.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
  console.log("\nwrote lib/asset-sizes.json");
}

await main();
