// src/lib/mail.ts
import "server-only";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { setDefaultResultOrder } from "dns";

try { setDefaultResultOrder("ipv4first"); } catch {}

const cfg = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  secure: process.env.SMTP_SECURE === "true", // true=465, false=587
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.MAIL_FROM || "HOMEIQ <no-reply@homeiq.local>",
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (cfg.host && cfg.port && cfg.user && cfg.pass) {
    const opts: SMTPTransport.Options = {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      requireTLS: cfg.port === 587,        // STARTTLS path
      tls: { servername: "smtp.gmail.com" }
    };
    const t = nodemailer.createTransport(opts);
    await t.verify(); // throws with the real reason if SMTP fails
    transporterPromise = Promise.resolve(t);
    return transporterPromise;
  }

  // dev fallback: Ethereal
  const test = await nodemailer.createTestAccount();
  const t = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
  transporterPromise = Promise.resolve(t);
  return transporterPromise;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: cfg.from,
    to,
    subject: "Verify your HOMEIQ email",
    text: `Confirm your email: ${verifyUrl}\n\n(Link expires in 30 minutes.)`,
    html: `<p>Confirm your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Link expires in 30 minutes.</p>`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log("[mail] Ethereal preview:", preview);
}
