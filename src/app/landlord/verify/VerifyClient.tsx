"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  IdCard,
  Phone as PhoneIcon,
  Mail,
  Lock,
  X,
  Info,
} from "lucide-react";

const HOMEIQ_GREEN = "#1A6E4E";

/* ------------------------------- Types & utils ------------------------------ */
type Status = "not_started" | "pending" | "verified";

function statusTone(status: Status): { label: string; className: string } {
  switch (status) {
    case "verified":
      return { label: "Verified", className: "bg-emerald-100 text-emerald-800" };
    case "pending":
      return { label: "Pending review", className: "bg-amber-100 text-amber-800" };
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
      <div className="text-sm text-gray-500">Step 1 of 7</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Verify your identity</h1>
      <p className="mt-2 text-gray-600">
        For a safe community, we verify every landlord’s identity. It takes 2–3 minutes.
      </p>
      <div className="mt-4">
        <Progress value={14} className="h-2" />
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
          <p>Your documents are encrypted and never shared publicly.</p>
        </div>
        <Button variant="outline" className="mt-5 w-full">Contact support</Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Dropzone -------------------------------- */
function Dropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [isOver, setIsOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const files = Array.from(e.dataTransfer.files).slice(0, 2);
    if (files.length) onFiles(files);
  };
  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 2) : [];
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      className={`flex h-36 w-full items-center justify-center rounded-xl border-2 border-dashed text-center transition ${
        isOver ? "border-emerald-500 bg-emerald-50" : "border-gray-300"
      }`}
      aria-label="Upload ID"
    >
      <div className="px-6 text-sm text-gray-600">
        <div className="font-medium">Drag & drop your ID (front & back) or click to upload</div>
        <div className="mt-1 text-xs text-gray-500">JPG/PNG/PDF, max 10MB</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={onSelect}
      />
    </div>
  );
}

/* -------------------------------- OTP Input ------------------------------- */
function OtpInput({
  length = 6,
  onComplete,
  ariaId,
}: {
  length?: number;
  onComplete: (code: string) => void;
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
          ref={(el: HTMLInputElement | null) => { inputs.current[i] = el; }}
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
  // ID state
  const [idFiles, setIdFiles] = React.useState<File[]>([]);
  const [idStatus, setIdStatus] = React.useState<Status>("not_started");

  // Phone state
  const [phone, setPhone] = React.useState<string>("");
  const [phoneStatus, setPhoneStatus] = React.useState<Status>(initialPhoneVerified ? "verified" : "not_started");
  const [otpSent, setOtpSent] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0);
  const [otpMessage, setOtpMessage] = React.useState<string>("");

  // Email state
  const [email, setEmail] = React.useState<string>(initialEmail);
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [emailStatus, setEmailStatus] = React.useState<Status>(initialEmailVerified ? "verified" : "not_started");
  const [emailToast, setEmailToast] = React.useState<string>("");

  const allVerified = idStatus === "verified" && phoneStatus === "verified" && emailStatus === "verified";

  // resend timer
  React.useEffect(() => {
    if (!otpSent || resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [otpSent, resendIn]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between">
        <SectionHeader />
        <a href="#help" className="hidden md:inline text-sm text-emerald-700 hover:underline mt-1">Need help?</a>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column: 2 cols */}
        <div className="md:col-span-2 space-y-5">
          {/* Government ID */}
          <Card className="rounded-2xl shadow-sm border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2" style={{ backgroundColor: "#eaf5f0", color: HOMEIQ_GREEN }}>
                    <IdCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">Government ID</h3>
                      <Badge className={`rounded-full ${statusTone(idStatus).className}`}>
                        {statusTone(idStatus).label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Upload front and back of your ID. We’ll review it shortly.
                    </p>
                  </div>
                </div>
                <a href="#acceptable-id" className="text-xs text-gray-500 hover:underline inline-flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> What’s an acceptable ID?
                </a>
              </div>

              <div className="mt-4">
                <Dropzone
                  onFiles={(files) => {
                    setIdFiles(files);
                    setIdStatus("pending");
                  }}
                />
                {idFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {idFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                        <span className="truncate max-w-[75%]">{f.name}</span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                          onClick={() => setIdFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="h-4 w-4" /> Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    style={{ backgroundColor: HOMEIQ_GREEN }}
                    onClick={() => (idFiles.length ? setIdStatus("pending") : null)}
                    disabled={idFiles.length === 0}
                  >
                    Upload
                  </Button>
                  {/* Dev helper to simulate approval */}
                  <Button variant="outline" onClick={() => setIdStatus("verified")}>
                    Mark as verified (dev)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    placeholder="e.g., +1 204-555-1234"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    disabled={phoneStatus === "verified"}
                  />
                  <Button
                    style={{ backgroundColor: HOMEIQ_GREEN }}
                    onClick={() => {
                      setOtpMessage("");
                      if (!phone.trim()) {
                        setOtpMessage("Enter a valid phone number.");
                        return;
                      }
                      setOtpSent(true);
                      setResendIn(30);
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
                      onComplete={(code) => {
                        if (code === "000000") {
                          setOtpMessage("That code looks like a test code. Try the one we sent.");
                        } else {
                          setPhoneStatus("verified");
                          setOtpMessage("Phone verified successfully.");
                        }
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div aria-live="polite">{otpMessage}</div>
                      <button
                        type="button"
                        className="underline disabled:opacity-50"
                        onClick={() => {
                          if (resendIn === 0) {
                            setResendIn(30);
                            setOtpMessage("We sent a new code.");
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
                  <Button
                    style={{ backgroundColor: HOMEIQ_GREEN }}
                    onClick={() => {
                      setEmailToast("Verification link sent. Check your inbox and spam folder.");
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
            onClick={() => {
              // TODO: wire to server action
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
