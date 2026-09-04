/**
 * White-backdrop removal for product artwork.
 *
 * Split out from prepare-assets.mjs so it can be exercised on its own by
 * scripts/keyer.test.mjs. An `import.meta` main-module guard was the other
 * option and it is not reliable: some shells launch node with no argv[1],
 * which silently turns the pipeline into a no-op.
 */
import sharp from "sharp";

/** Anything at least this bright in all three channels counts as backdrop. */
const WHITE_CUTOFF = 236;

/**
 * How far the soft matte reaches inward from the backdrop, in pixels. Kept
 * tight on purpose: a real export blends over 1-2px, and a wide band starts
 * eating genuine highlights — the lid's chrome rim went speckled at 10.
 */
const BAND = 3;

/** Inside the band, a pixel this dark or darker is treated as fully covered. */
const SOFT_FLOOR = 205;

function isNearWhite(data, channels, i) {
  const o = i * channels;
  return (
    data[o] >= WHITE_CUTOFF && data[o + 1] >= WHITE_CUTOFF && data[o + 2] >= WHITE_CUTOFF
  );
}

/**
 * True when the artwork has no usable transparency and sits on a white
 * backdrop — what you get from an exporter without transparent-PNG support
 * (it is a paid feature in several of them, Canva included).
 */
export async function looksFlattenedOnWhite(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const n = width * height;

  let transparent = 0;
  for (let i = 0; i < n; i += 1) if (data[i * channels + 3] < 250) transparent += 1;

  const corners = [0, width - 1, (height - 1) * width, n - 1];
  const cornersWhite = corners.every((i) => isNearWhite(data, channels, i));

  return cornersWhite && transparent / n < 0.02;
}

/**
 * Removes a white backdrop by flood-filling inward from the border.
 *
 * A plain colour key would punch holes through the white "CARBONA" lettering
 * and the lid's highlights — they are the same white as the backdrop. Only
 * pixels *connected to the edge* are background, which leaves anything
 * enclosed by the can untouched.
 */
export async function keyOutWhite(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const n = width * height;

  const bg = new Uint8Array(n);
  const stack = [];
  const seed = (i) => {
    if (!bg[i] && isNearWhite(data, channels, i)) {
      bg[i] = 1;
      stack.push(i);
    }
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (i >= width) seed(i - width);
    if (i < n - width) seed(i + width);
  }

  /* Walk a few pixels inward from the backdrop. Only this band gets a soft
     matte — past it the subject is opaque no matter how light it is, which
     is what keeps the white lettering and the lid highlights safe. */
  const distance = new Int16Array(n).fill(-1);
  let frontier = [];
  for (let i = 0; i < n; i += 1) {
    if (bg[i]) {
      distance[i] = 0;
      frontier.push(i);
    }
  }
  for (let d = 1; d <= BAND && frontier.length; d += 1) {
    const next = [];
    for (const i of frontier) {
      const x = i % width;
      const step = (j) => {
        if (distance[j] === -1) {
          distance[j] = d;
          next.push(j);
        }
      };
      if (x > 0) step(i - 1);
      if (x < width - 1) step(i + 1);
      if (i >= width) step(i - width);
      if (i < n - width) step(i + width);
    }
    frontier = next;
  }

  /* Inside the band a pixel is a mix of subject and backdrop. How far it
     sits from white gives its coverage; a binary cut here would either keep
     a bright fringe or bite into the rim. Having the coverage also lets the
     white be un-mixed back out of the colour, so the edge does not glow
     when the can is composited onto a dark gradient. */
  const span = 255 - SOFT_FLOOR;
  for (let i = 0; i < n; i += 1) {
    const o = i * channels;
    if (bg[i]) {
      data[o + 3] = 0;
      continue;
    }
    if (distance[i] === -1) {
      data[o + 3] = 255;
      continue;
    }

    const darkest = Math.min(data[o], data[o + 1], data[o + 2]);
    const coverage = Math.max(0, Math.min(1, (255 - darkest) / span));
    data[o + 3] = Math.round(coverage * 255);

    if (coverage > 0.01 && coverage < 1) {
      for (let c = 0; c < 3; c += 1) {
        const unmixed = (data[o + c] - (1 - coverage) * 255) / coverage;
        data[o + c] = Math.max(0, Math.min(255, Math.round(unmixed)));
      }
    }
  }

  return sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}
