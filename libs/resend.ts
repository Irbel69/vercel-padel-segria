import config from "@/config";

// Dynamic Resend client construction to support different package export shapes
let _resendClient: any = null;
async function makeResendClient() {
  if (_resendClient) return _resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set (Resend client unavailable)");
  }

  // Dynamic import to avoid import-time failures and support different export shapes
  const pkg = await import("resend");
  const ResendCtor = pkg.default ?? pkg.Resend ?? pkg;

  try {
    _resendClient = new (ResendCtor as any)(key);
  } catch (e1) {
    try {
      _resendClient = new (ResendCtor as any)({ apiKey: key });
    } catch (e2) {
      console.error("Could not instantiate Resend client. Export/constructor shape unexpected.", e2);
      throw e2;
    }
  }

  return _resendClient;
}

/** Generic sendEmail: simple, template-agnostic sender.
 * Use this for any email where caller provides subject/text/html.
 */
export type SendEmailParams = {
  to: string | string[];
  subject?: string;
  // plain text fallback
  text?: string;
  // HTML content (either pre-rendered html or htmlTemplate)
  html?: string;
  htmlTemplate?: string;
  // Additional metadata (optional)
  replyTo?: string | string[];
};

export const sendEmail = async (params: SendEmailParams) => {
  const resend = await makeResendClient();

  const siteDomain = config.domainName || "padelsegria.com";
  const from = config.resend.fromAdmin || `Padel Segria <noreply@${siteDomain}>`;

  const subject = params.subject || `Notificació — ${siteDomain}`;
  const text = params.text || "";
  const html = params.html || params.htmlTemplate;

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject,
      text,
      ...(html && { html }),
      ...(params.replyTo && { replyTo: params.replyTo }),
    });
    return result;
  } catch (err: any) {
    console.error("Error sending email via Resend:", err);
    throw err;
  }
};

// --- Convenience wrapper for cancellation emails ---
export type CancellationEmailParams = {
  to: string | string[];
  recipientName?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  eventUrl?: string;
  supportEmail?: string;
  // If present, the template will state that this recipient's partner (name) cancelled
  canceledByName?: string;
  replyTo?: string | string[];
  // Optional overrides
  subject?: string;
  text?: string;
  htmlTemplate?: string;
};

export async function sendCancellationEmail(params: CancellationEmailParams) {
  const siteDomain = config.domainName || "padelsegria.com";
  const supportEmail = params.supportEmail || config.resend.supportEmail || `support@${siteDomain}`;
  const subject = params.subject ?? `Cancel·lació d'inscripció — ${params.eventName || "Esdeveniment"}`;

  const eventName = params.eventName || "Esdeveniment";
  const eventDate = params.eventDate || "Data per confirmar";
  const eventLocation = params.eventLocation || "Lloc per confirmar";
  const eventUrl = params.eventUrl || `https://${siteDomain}/dashboard/tournaments`;
  const recipientName = params.recipientName || "";
  const canceledByName = params.canceledByName || null;

  const introHtml = canceledByName
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#e0e0e0;">Hola <strong>${recipientName}</strong>, la teva parella <strong>${canceledByName}</strong> ha cancel·lat la inscripció a l'esdeveniment.</p>`
    : `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:#e0e0e0;">Hola <strong>${recipientName}</strong>, confirmem que la teva inscripció a l'esdeveniment ha estat cancel·lada correctament.</p>`;

  const html = params.htmlTemplate || `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cancel·lació d'inscripció</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" 
               style="max-width:600px;background:#111111;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px;background:#000;">
              <!-- Prominent brand text (yellow, large) -->
              <div style="display:block;margin-bottom:10px;font-size:28px;line-height:34px;color:#ffff00;font-weight:800;letter-spacing:0.5px;">
                Padel Segria
              </div>
              <h1 style="margin:0;font-size:22px;line-height:28px;color:#ffff00;">Cancel·lació d'inscripció</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px;">
              ${introHtml}

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" 
                     style="margin:16px 0;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;">
                <tr>
                  <td style="padding:16px;font-size:14px;line-height:22px;color:#cccccc;">
                    <div><strong>Esdeveniment:</strong> ${eventName}</div>
                    <div><strong>Data:</strong> ${eventDate}</div>
                    <div><strong>Lloc:</strong> ${eventLocation}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:#aaaaaa;">
                Si vols tornar a inscriure't, fes-ho a través de la nostra web.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin:0 0 20px;">
                <a href="${eventUrl}" target="_blank"
                   style="display:inline-block;padding:14px 26px;background:#ffff00;color:#000;font-weight:700;
                          text-decoration:none;border-radius:8px;font-size:15px;">
                  Tornar a inscriure'm
                </a>
              </div>

              <p style="margin:0;font-size:12px;line-height:18px;color:#666;">
                Si tens qualsevol dubte, escriu-nos a 
                <a href="mailto:${supportEmail}" style="color:#ffff00;text-decoration:none;">${supportEmail}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px;background:#000;font-size:12px;line-height:18px;color:#555;">
              © ${new Date().getFullYear()} Padel Segria · Missatge automàtic
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = params.text || `La teva inscripció a ${eventName} (${eventDate}) ha estat cancel·lada.`;

  return sendEmail({
    to: params.to,
    subject,
    text,
    html,
    replyTo: params.replyTo,
  });
}
