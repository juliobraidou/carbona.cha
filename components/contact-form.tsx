"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";

import { EMPTY_STATE, sendContactMessage } from "@/app/contato/actions";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/products";

/* The field surface itself is `.field` in globals.css — shared with the
   checkout form, and 16px on mobile so iOS Safari does not zoom on focus. */

export function ContactForm() {
  const [state, formAction] = useActionState(sendContactMessage, EMPTY_STATE);
  const [subject, setSubject] = useState<ContactSubject>(CONTACT_SUBJECTS[0]);
  const id = useId();

  const errors = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8"
    >
      <input type="hidden" name="subject" value={subject} />

      <fieldset>
        <legend className="text-[11px] font-semibold tracking-[0.14em] text-chalk-faint">
          SOBRE OQUE É?
        </legend>

        {/* Segmented control — the selected pill is a shared element that
            slides, so the choice reads as one control rather than three.

            A column below `sm`: the three labels need ~455px and only had 279
            on a phone, so they wrapped onto three rows and the shared pill
            slid diagonally between them. Stacked, the slide is vertical and
            reads as one control moving. */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {CONTACT_SUBJECTS.map((option) => {
            const active = option === subject;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(option)}
                aria-pressed={active}
                className={`relative rounded-full px-5 py-3 text-[15px] font-medium transition-colors duration-160 ${
                  active ? "text-ink" : "text-chalk-faint hover:text-chalk-dim"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="subject-pill"
                    className="absolute inset-0 rounded-full bg-chalk"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full border border-white/[0.09]" />
                )}
                <span className="relative">{option}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field
          id={`${id}-name`}
          name="name"
          label="Nome"
          placeholder="Como te chamamos"
          autoComplete="name"
          error={errors.name}
        />
        <Field
          id={`${id}-email`}
          name="email"
          type="email"
          label="Email"
          placeholder="voce@email.com"
          autoComplete="email"
          error={errors.email}
        />
      </div>

      <div className="mt-5">
        <Field
          id={`${id}-order`}
          name="order"
          label="Números do pedido"
          placeholder="#0000 — opcional, mas acelera a resposta"
        />
      </div>

      <div className="mt-5">
        <label htmlFor={`${id}-message`} className="block text-sm text-chalk-dim">
          Mensagem
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          placeholder="Conte o que aconteceu"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          className="field mt-2 resize-y"
        />
        {errors.message ? (
          <p id={`${id}-message-error`} className="mt-2 text-xs text-morango-bright">
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-5">
        <SubmitButton />
        <p
          aria-live="polite"
          className={`text-sm ${
            state.status === "error"
              ? "text-morango-bright"
              : state.status === "success"
                ? "text-limao"
                : "text-chalk-faint"
          }`}
        >
          {state.message === "" ? "Resposta em até 1 dia util." : state.message}
        </p>
      </div>
    </form>
  );
}

function SubmitButton() {
  /* useFormStatus must live in a child of the form to read its pending state. */
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-surface rounded-2xl px-8 py-3.5 text-[15px] font-medium"
    >
      {pending ? "Enviando…" : "Enviar Mensagem"}
    </button>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-chalk-dim">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
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
