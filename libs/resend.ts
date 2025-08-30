import { Resend } from "resend";
import config from "@/config";

// Lazily initialize the Resend client so importing this module during
// build (e.g. on Vercel) doesn't throw when the env var is only provided
// at runtime or as a Vercel secret. This defers the error until the
// function is actually used at request/runtime.
let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set (Resend client unavailable)");
  }
  _resend = new Resend(key);
  return _resend;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | string[];
}) => {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: config.resend.fromAdmin,
    to,
    subject,
    text,
    html,
    ...(replyTo && { replyTo }),
  });

  if (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }

  return data;
};
