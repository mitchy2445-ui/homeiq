"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Phone as PhoneIcon, Mail, Lock } from "lucide-react";

const HOMEIQ_GREEN = "#1A6E4E";

/* ------------------------------- Types & utils ------------------------------ */
type Status = "not_started" | "pending" | "verified";

function statusTone(status: Status): { label: string; className: string } {
  switch (status) {
    case "verified":
      return { label: "Verified", className: "bg-emerald-100 text-emerald-800" };
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-800" };
    default:
      return { label: "Not started", className: "bg-gray-100 text-gray-700" };
  }
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const first = user.slice(0, 2);
  const last = user.slice(-1);
  return `${first}${"*".repeat(Math.max(1, user.length - 3))}${last}@${domain}`;
}

/* -------------------------------- Subcomponents ----------------------------- */
function SectionHeader() {
  return (
    <div className="mb-6">
      <div className="text-sm text-gray-500">Step 1 of 6</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Verify your identity</h1>
      <p className="mt-2 text-gray-600">
        For a safe community, we verify every landlord’s contact details. It takes 1–2 minutes.
      </p>
      <div className="mt-4">
        <Progress value={16} className="h-2" />
      </div>
    </div>
  );
}

function TrustPanel() {
  return (
    <Card className="sticky top-20 rounded-2xl shadow-sm border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2" style={{ backgroundColor: "#eaf5f0", color: HOMEIQ_GREEN }}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="font-medium">Why verification matters</div>
        </div>
        <ul className="mt-4 list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>Builds trust with renters</li>
          <li>Prevents fraud and fake listings</li>
          <li>Leads to faster, more confident bookings</li>
        </ul>
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Your contact info is private and never shared publicly.</p>
        </div>
        <Button variant="outline" className="mt-5 w-full">Contact support</Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- OTP Input ------------------------------- */
function OtpInput({
  length = 6,
  onComplete,
  ariaId,
}: {
  length?: number;
  onComplete: (code: string) => void | Promise<void>;
  ariaId: string;
}) {
  const [values, setValues] = React.useState<string[]>(Array.from({ length }, () => ""));
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[i] = val;
    setValues(next);
    if (val && i < length - 1) inputs.current[i + 1]?.focus();
    const code = next.join("");
    if (code.length === length) onComplete(code);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    const next = text.split("");
    setValues((prev) => prev.map((_, idx) => next[idx] || ""));
    if (text.length === length) onComplete(text);
    e.preventDefault();
  };

  return (
    <div className="flex items-center gap-2" aria-labelledby={ariaId}>
      {values.map((v, i) => (
        <Input
          key={i}
          value={v}
          inputMode="numeric"
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          className="h-11 w-11 text-center"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(i, e)}
          onPaste={onPaste}
          ref={(el: HTMLInputElement | null) => {
            inputs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Main Client UI ---------------------------- */
export default function VerifyClient({
  initialEmail,
  initialPhoneVerified,
  initialEmailVerified,
}: {
  initialEmail: string;
  initialPhoneVerified: boolean;
  initialEmailVerified: boolean;
}) {
  const router = useRouter();

  // Phone
  const [phone, setPhone] = React.useState<string>("");
  const [phoneStatus, setPhoneStatus] = React.useState<Status>(initialPhoneVerified ? "verified" : "not_started");
  const [otpSent, setOtpSent] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0);
  const [otpMessage, setOtpMessage] = React.useState<string>("");

  // Email
  const [email, setEmail] = React.useState<string>(initialEmail);
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [emailStatus, setEmailStatus] = React.useState<Status>(initialEmailVerified ? "verified" : "not_started");
  const [emailToast, setEmailToast] = React.useState<string>("");

  const allVerified = phoneStatus === "verified" && emailStatus === "verified";

  // resend timer
  React.useEffect(() => {
    if (!otpSent || resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [otpSent, resendIn]);

  async function handleContinue() {
    try {
      const resp = await fetch("/api/verify/complete", { method: "POST" });
      const parsed: unknown = await resp.json().catch(() => ({}));
      const obj = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
      const ok = obj.ok === true || obj.ok === "true";
      const next = typeof obj.next === "string" ? obj.next : "/landlord/new/basics";
      if (resp.ok && ok) {
        router.push(next);
      } else {
        const error = typeof obj.error === "string" ? obj.error : "Please complete phone and email verification.";
        alert(error);
      }
    } catch {
      alert("Unable to continue right now.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between">
        <SectionHeader />
        <a href="#help" className="hidden md:inline text-sm text-emerald-700 hover:underline mt-1">
          Need help?
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-2 space-y-5">
          {/* Phone verification */}
          <Card className="rounded-2xl shadow-sm border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2" style={{ backgroundColor: "#eaf5f0", color: HOMEIQ_GREEN }}>
                    <PhoneIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">Phone verification</h3>
                      <Badge className={`rounded-full ${statusTone(phoneStatus).className}`}>
                        {statusTone(phoneStatus).label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Add a phone number and verify by SMS code.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <label className="text-sm text-gray-700" htmlFor="phone">
                  Phone
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    id="phone"
                    inputMode="tel"
                    placeholder="e.g., +1 2045551234"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    disabled={phoneStatus === "verified"}
                  />
                  <Button
                    style={{ backgroundColor: HOMEIQ_GREEN }}
                    onClick={async () => {
                      setOtpMessage("");
                      if (!phone.trim()) {
                        setOtpMessage("Enter a valid phone number.");
                        return;
                      }
                      try {
                        const resp = await fetch("/api/verify/phone/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phone }),
                        });
                        const parsed: unknown = await resp.json().catch(() => ({}));
                        const obj = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
                        const serverError = typeof obj.error === "string" ? obj.error : undefined;

                        if (resp.ok) {
                          setOtpSent(true);
                          setResendIn(30);
                          setOtpMessage("Code sent via SMS.");
                        } else {
                          setOtpMessage(serverError || "Failed to send code.");
                        }
                      } catch {
                        setOtpMessage("Unexpected error sending code.");
                      }
                    }}
                    disabled={phoneStatus === "verified"}
                  >
                    Send code
                  </Button>
                </div>
                {otpSent && phoneStatus !== "verified" && (
                  <div className="mt-2 space-y-2">
                    <div id="otp-label" className="text-sm text-gray-700">
                      Enter code
                    </div>
                    <OtpInput
                      ariaId="otp-label"
                      onComplete={async (code) => {
                        try {
                          const resp = await fetch("/api/verify/phone/confirm", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone, code }),
                          });
                          const parsed: unknown = await resp.json().catch(() => ({}));
                          const obj = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
                          const serverError = typeof obj.error === "string" ? obj.error : undefined;

                          if (resp.ok) {
                            setPhoneStatus("verified");
                            setOtpMessage("Phone verified successfully.");
                          } else {
                            setOtpMessage(serverError || "Incorrect code.");
                          }
                        } catch {
                          setOtpMessage("Verification request failed.");
                        }
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div aria-live="polite">{otpMessage}</div>
                      <button
                        type="button"
                        className="underline disabled:opacity-50"
                        onClick={async () => {
                          if (resendIn === 0) {
                            try {
                              const resp = await fetch("/api/verify/phone/send", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ phone }),
                              });
                              if (resp.ok) {
                                setResendIn(30);
                                setOtpMessage("We sent a new code.");
                              }
                            } catch {
                              setOtpMessage("Could not resend code.");
                            }
                          }
                        }}
                        disabled={resendIn > 0}
                      >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email verification */}
          <Card className="rounded-2xl shadow-sm border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2" style={{ backgroundColor: "#eaf5f0", color: HOMEIQ_GREEN }}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">Email verification</h3>
                      <Badge className={`rounded-full ${statusTone(emailStatus).className}`}>
                        {statusTone(emailStatus).label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">We’ll send a verification link to your email.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {!editingEmail ? (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{maskEmail(email)}</span>
                    <button className="ml-2 text-gray-500 underline" onClick={() => setEditingEmail(true)}>
                      Change email
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
                    <Button variant="outline" onClick={() => setEditingEmail(false)}>
                      Save
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {/* Dev-only: we’ll wire Resend + JWT next */}
                  <Button
  style={{ backgroundColor: HOMEIQ_GREEN }}
  onClick={async () => {
    try {
      const resp = await fetch("/api/verify/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const parsed: unknown = await resp.json().catch(() => ({}));
      const obj = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
      const serverError = typeof obj.error === "string" ? obj.error : undefined;

      if (resp.ok) {
        setEmailToast("Verification link sent. Check your inbox and spam folder.");
      } else {
        setEmailToast(serverError || "Could not send verification email.");
      }
    } catch {
      setEmailToast("Unexpected error sending email.");
    }
  }}
  disabled={emailStatus === "verified"}
>
  Send link
</Button>

                  <Button variant="outline" onClick={() => setEmailStatus("verified")}>
                    I clicked the link (dev)
                  </Button>
                </div>

                <div className="text-xs text-gray-500" aria-live="polite">
                  {emailToast}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="md:col-span-1">
          <TrustPanel />
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-0.5" />
            <span>I consent to the verification of my identity for hosting on HOMEIQ.</span>
          </label>
          <Button
            className="rounded-full px-6"
            style={{ backgroundColor: HOMEIQ_GREEN }}
            disabled={!allVerified}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
