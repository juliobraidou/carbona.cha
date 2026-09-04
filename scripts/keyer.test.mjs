/**
 * Checks the white-backdrop keyer against ground truth.
 *
 *   node scripts/keyer.test.mjs
 *
 * Builds a stand-in for an export with no transparency support: takes a can
 * that is already cut out, hardens its edge (a real product export has a
 * crisp silhouette, not the soft ramp our own pipeline leaves behind), drops
 * it onto white, then keys the backdrop back out and compares.
 *
 * The last number is the one that matters. A plain colour key punches holes
 * through the white "CARBONA" lettering and the lid highlights, because they
 * are the same white as the backdrop; the flood fill should not.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { keyOutWhite, looksFlattenedOnWhite } from "./lib/white-key.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "public/cans/limao.png");

const raw = async (buf) => {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, ...info };
};

const source = await raw(await readFile(SOURCE));
const { width, height, channels } = source;
const n = width * height;

/* Ground truth: the same artwork with a hard silhouette. */
const truth = Buffer.from(source.data);
for (let i = 0; i < n; i += 1) {
  truth[i * channels + 3] = source.data[i * channels + 3] > 127 ? 255 : 0;
}
const truthPng = await sharp(truth, { raw: { width, height, channels } }).png().toBuffer();

const flattened = await sharp(truthPng).flatten({ background: "#ffffff" }).png().toBuffer();

const detectsFlat = await looksFlattenedOnWhite(flattened);
const skipsCutOut = !(await looksFlattenedOnWhite(truthPng));
console.log(`detects the flattened copy:      ${detectsFlat}`);
console.log(`leaves the cut-out copy alone:   ${skipsCutOut}`);

const recovered = await raw(await keyOutWhite(flattened));

let intersection = 0;
let union = 0;
let eaten = 0;
let leftover = 0;
for (let i = 0; i < n; i += 1) {
  const inTruth = truth[i * channels + 3] > 127;
  const inRecovered = recovered.data[i * channels + 3] > 127;
  if (inTruth && inRecovered) intersection += 1;
  if (inTruth || inRecovered) union += 1;
  if (inTruth && !inRecovered) eaten += 1;
  if (!inTruth && inRecovered) leftover += 1;
}
const iou = intersection / union;

console.log(`\nsilhouette agreement (IoU):      ${(iou * 100).toFixed(2)}%`);
console.log(`trimmed off the edge:            ${((eaten / n) * 100).toFixed(3)}% of frame`);
console.log(`backdrop left behind:            ${((leftover / n) * 100).toFixed(3)}% of frame`);

/* Only judge pixels that are genuinely deep inside the ground-truth
   silhouette — the lettering and highlights the flood fill must never reach.
   Pixels right at the rim are meant to go partly transparent, so measuring
   those would just be testing the feather. */
const INTERIOR_MARGIN = 8;
const depth = new Int16Array(n).fill(-1);
let wave = [];
for (let i = 0; i < n; i += 1) {
  if (truth[i * channels + 3] <= 127) {
    depth[i] = 0;
    wave.push(i);
  }
}
for (let d = 1; d <= INTERIOR_MARGIN && wave.length; d += 1) {
  const next = [];
  for (const i of wave) {
    const x = i % width;
    const step = (j) => {
      if (depth[j] === -1) {
        depth[j] = d;
        next.push(j);
      }
    };
    if (x > 0) step(i - 1);
    if (x < width - 1) step(i + 1);
    if (i >= width) step(i - width);
    if (i < n - width) step(i + width);
  }
  wave = next;
}

let holes = 0;
for (let i = 0; i < n; i += 1) {
  if (depth[i] !== -1) continue; // within INTERIOR_MARGIN of the outside
  if (recovered.data[i * channels + 3] < 127) holes += 1;
}
console.log(`holes punched inside the can:    ${holes} px`);

const ok = detectsFlat && skipsCutOut && iou > 0.99 && holes === 0;
console.log(`\n${ok ? "PASS" : "FAIL"}`);
process.exit(ok ? 0 : 1);
