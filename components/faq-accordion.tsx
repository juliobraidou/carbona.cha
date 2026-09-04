"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { FAQ } from "@/lib/products";

/**
 * Single-open accordion. The Figma file shows the first question expanded,
 * so that is the initial state rather than everything collapsed.
 */
export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="border-t border-ink-hairline">
      {FAQ.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={item.q} className="border-b border-ink-hairline">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="text-[15px] font-medium text-chalk sm:text-base">
                  {item.q}
                </span>
                <PlusMinus open={open} />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-7 pr-10 text-sm leading-relaxed text-chalk-faint">
                    {item.a}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** The vertical bar rotates away, so "+" becomes "−" in one continuous move. */
function PlusMinus({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative grid size-5 shrink-0 place-items-center">
      <span className="absolute h-px w-4 bg-chalk-dim" />
      <motion.span
        className="absolute h-4 w-px bg-chalk-dim"
        initial={false}
        animate={{ rotate: open ? 90 : 0, opacity: open ? 0 : 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}
