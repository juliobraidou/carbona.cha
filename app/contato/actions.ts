"use server";

import { CONTACT_SUBJECTS } from "@/lib/products";

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
  /** Field name → error, so the form can mark the offending input. */
  fieldErrors?: Record<string, string>;
}

export const EMPTY_STATE: ContactFormState = { status: "idle", message: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function sendContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const subject = String(formData.get("subject") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const order = String(formData.get("order") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2) fieldErrors.name = "Diz como te chamamos.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Esse e-mail não parece certo.";
  if (message.length < 10) fieldErrors.message = "Conta um pouco mais do que aconteceu.";
  if (!CONTACT_SUBJECTS.includes(subject as (typeof CONTACT_SUBJECTS)[number])) {
    fieldErrors.subject = "Escolhe um assunto.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Faltou alguma coisa aí embaixo.",
      fieldErrors,
    };
  }

  // ------------------------------------------------------------------
  // TODO: connect a real destination. This action is validated and typed
  // but does not deliver anything yet — drop in Resend / SendGrid / a CRM
  // webhook here, and add rate limiting before it goes live, since the
  // endpoint is public and unauthenticated by design.
  // ------------------------------------------------------------------
  console.info("[contato] nova mensagem", { subject, name, email, order });

  return {
    status: "success",
    message: "Mensagem recebida. Respondemos em até 1 dia util.",
  };
}
