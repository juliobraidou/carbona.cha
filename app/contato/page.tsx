import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";
import { ArrowUpRightIcon } from "@/components/icons";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";
import { CONTACT_CHANNELS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Carbona sobre um pedido, uma proposta de revenda ou qualquer dúvida sobre a bebida.",
};

export default function ContatoPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 sm:px-10 sm:pt-44">
        <Reveal>
          <h1 className="section-title text-5xl sm:text-7xl">Contato</h1>
          <p className="mt-3 text-lg text-chalk-faint">
            Respondemos de segunda a sexta, das 9h às 18h
          </p>
        </Reveal>

        <div className="mt-16 grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={0.07}>
            <h2 className="max-w-xl text-3xl font-bold leading-[1.16] tracking-tight sm:text-[40px]">
              Problema no pedido, proposta de revenda ou só uma dúvida sobre a bebida.
            </h2>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-chalk-faint">
              Escolha o assunto no formulário ao lado, ou fale direto por um dos canais
              abaixo. Antes disso, vale conferir as dúvidas frequentes — a maioria já está
              respondida lá.
            </p>

            <ul className="mt-12 max-w-xl border-t border-ink-hairline">
              {CONTACT_CHANNELS.map((channel) => (
                <li key={channel.label} className="border-b border-ink-hairline">
                  <a
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group flex items-center justify-between gap-6 py-6"
                  >
                    <span>
                      <span className="block text-xs font-semibold tracking-[0.12em] text-chalk-faint">
                        {channel.label}
                      </span>
                      <span className="mt-1.5 block text-lg text-chalk">{channel.value}</span>
                    </span>
                    {/* The arrow leans out on hover — a small "this leaves the
                        page" cue that costs nothing to read. */}
                    <ArrowUpRightIcon className="size-5 shrink-0 text-chalk-dim transition-transform duration-160 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chalk" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.14}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </PageShell>
  );
}
