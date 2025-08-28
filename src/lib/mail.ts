import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await mailer.sendMail({
    from: process.env.MAIL_FROM ?? "HOMEIQ <no-reply@homeiq.app>",
    to,
    subject: "Verify your HOMEIQ account",
    html: `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial;">
        <h2>Verify your email</h2>
        <p>Thanks for signing up for HOMEIQ. Please verify your email to finish creating your account.</p>
        <p><a href="${verifyUrl}" style="background:#2E8B57;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;display:inline-block;">Verify email</a></p>
        <p>If the button doesn't work, paste this link into your browser:</p>
        <p>${verifyUrl}</p>
      </div>
    `,
  });
}
