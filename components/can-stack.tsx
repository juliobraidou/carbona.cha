import Image from "next/image";

import { sizeOf, type Flavor } from "@/lib/flavors";

/**
 * Renders a product's artwork: one can on its own, or three overlapped with
 * the middle one forward. Packs are composed from the real can exports
 * rather than shipping separate pack photography.
 *
 * Server component — a card's only client JS is its "Adicionar" button.
 */
export function CanStack({
  cans,
  image,
  priority = false,
}: {
  cans: readonly Flavor[];
  /** A prepared pack shot. Beats the composition below whenever it exists:
      a real shot has the back cans turned and lit as their own objects,
      while this can only scale and overlap the same front-facing can. */
  image?: string;
  priority?: boolean;
}) {
  const first = cans[0];
  const size = sizeOf(first.image);

  if (image) {
    const packSize = sizeOf(image);
    return (
      <Image
        src={image}
        alt={`Pack com latas de ${cans.map((c) => c.name).join(", ")}`}
        width={packSize.width}
        height={packSize.height}
        priority={priority}
        sizes="(max-width: 640px) 60vw, (max-width: 1024px) 34vw, 24vw"
        className="mx-auto h-full w-auto object-contain"
      />
    );
  }

  if (cans.length === 1) {
    return (
      <Image
        src={first.image}
        alt={`Lata de ${first.productName}`}
        width={size.width}
        height={size.height}
        priority={priority}
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
        className="mx-auto h-full w-auto object-contain"
      />
    );
  }

  const [left, middle, right] = cans;

  return (
    <div className="relative h-full">
      {/* Back row sits lower and smaller so the middle can reads as nearest.

          The `sizes` hints below are ladders rather than the flat 14vw/18vw
          they used to be: the card is a single column on a phone, so these
          cans render at roughly twice the share of the viewport they take on
          a desktop grid, and a flat hint had the browser fetching an image
          too small for the box it lands in. */}
      <Image
        src={left.image}
        alt=""
        aria-hidden="true"
        width={size.width}
        height={size.height}
        sizes="(max-width: 640px) 32vw, (max-width: 1024px) 20vw, 14vw"
        className="absolute bottom-0 left-[4%] h-[84%] w-auto object-contain"
      />
      <Image
        src={right.image}
        alt=""
        aria-hidden="true"
        width={size.width}
        height={size.height}
        sizes="(max-width: 640px) 32vw, (max-width: 1024px) 20vw, 14vw"
        className="absolute bottom-0 right-[4%] h-[84%] w-auto object-contain"
      />
      <Image
        src={middle.image}
        alt={`Pack com latas de ${cans.map((c) => c.name).join(", ")}`}
        width={size.width}
        height={size.height}
        sizes="(max-width: 640px) 38vw, (max-width: 1024px) 24vw, 18vw"
        className="absolute bottom-0 left-1/2 h-full w-auto -translate-x-1/2 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
}
