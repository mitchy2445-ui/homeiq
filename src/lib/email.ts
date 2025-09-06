// src/lib/email.ts
import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendNewMessageEmail(to: string, preview: string, convoId: string) {
  await resend.emails.send({
    from: "HOMEIQ <noreply@yourdomain.com>",
    to,
    subject: "New message on HOMEIQ",
    text: `${preview}\n\nOpen: ${process.env.APP_URL}/messages/${convoId}`,
  });
}
