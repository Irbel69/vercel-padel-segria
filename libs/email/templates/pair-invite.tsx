export function renderPairInviteEmail({
  eventTitle,
  acceptUrl,
}: {
  eventTitle: string;
  acceptUrl: string;
}) {
  const subject = `Has estat convidat/da a ${eventTitle}`;
  const text = `T'han convidat a participar a ${eventTitle}. Accepta la invitació: ${acceptUrl}`;
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
    <h2>Invitació per parella</h2>
    <p>T'han convidat a participar a <strong>${eventTitle}</strong>.</p>
    <p>
      <a href="${acceptUrl}" style="display:inline-block; padding:10px 16px; background:#16a34a; color:#000; text-decoration:none; border-radius:6px;">Accepta la invitació</a>
    </p>
    <p>Si no pots veure el botó, copia aquest enllaç al navegador: <br />
      <a href="${acceptUrl}">${acceptUrl}</a>
    </p>
    <p style="color:#666; font-size:12px;">Aquesta invitació caduca automàticament.</p>
  </div>`;
  return { subject, text, html };
}
