"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ApiError } from "@/lib/api/errors";
import type { ApiErrorBody } from "@/lib/api/types";
import type { SessionPayload } from "@/lib/auth/session-server";
import {
  PASSWORD_MIN_LENGTH,
  SIGNUP_CODE_LENGTH,
  signupAccountSchema,
  signupCodeSchema,
  signupEmailSchema,
} from "@/lib/validation/auth";

import { PasswordField } from "./password-field";

/** Seconds between code requests — the API's `register_issue` rate is 5/min. */
const RESEND_COOLDOWN = 60;

type FieldKey = "email" | "code" | "company_name" | "password";
type Errors = Partial<Record<FieldKey, string>>;

/**
 * Sign up: prove an address, then name the account.
 *
 * One column, three steps: each input appears only after the previous answer was
 * accepted, so the page never asks for a company name from someone who cannot
 * receive the code. The API re-checks every step — this staging is what the person
 * sees, not the security boundary.
 */
export function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");

  // The single-use token step two hands back. Possessing it is what makes step
  // three possible, so it also decides which step renders.
  const [verification, setVerification] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"" | "send" | "verify" | "create">("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (sent && !verification) codeInputRef.current?.focus();
  }, [sent, verification]);

  useEffect(() => {
    if (verification) companyInputRef.current?.focus();
  }, [verification]);

  /** POST and keep the API's own refusal — its wording is the honest one. */
  async function ask(path: string, payload: Record<string, string>): Promise<Record<string, unknown> | ApiError> {
    let text = "";
    let status = 0;
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      text = await response.text();
      status = response.status;
      if (response.ok) return JSON.parse(text || "{}") as Record<string, unknown>;
    } catch {
      return new ApiError({ status: 0, code: "network_error", message: "Could not reach the server. Try again." });
    }

    let failureCode = "request_failed";
    let failureMessage = "The request could not be completed.";
    try {
      const envelope = (JSON.parse(text) as Partial<ApiErrorBody>).error;
      failureCode = envelope?.code ?? failureCode;
      failureMessage = envelope?.message ?? failureMessage;
    } catch {
      // An unparseable body keeps the fallbacks above rather than throwing here.
    }
    return new ApiError({ status, code: failureCode, message: failureMessage });
  }

  const sendCode = async () => {
    const parsed = signupEmailSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0].message });
      return;
    }

    setBusy("send");
    setErrors({});
    setFormError("");
    const result = await ask("/api/auth/register-code", { email: parsed.data.email });
    setBusy("");

    if (result instanceof ApiError) {
      setErrors({ email: result.message });
      return;
    }

    // The answer is the same whether or not the address is free, by design: a
    // signup page that distinguishes the two is an account directory.
    setSent(true);
    setCode("");
    setCooldown(RESEND_COOLDOWN);
  };

  const checkCode = async () => {
    if (busy) return;
    const parsed = signupCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setErrors({ code: parsed.error.issues[0].message });
      return;
    }

    setBusy("verify");
    setErrors({});
    setFormError("");
    const result = await ask("/api/auth/register-code-verify", { email, code: parsed.data.code });
    setBusy("");

    if (result instanceof ApiError) {
      if (result.code === "too_many_attempts") {
        // That code is dead and a new one has to be mailed, so step two goes away.
        setSent(false);
        setCode("");
        setFormError(result.message);
      } else {
        setErrors({ code: result.message });
      }
      return;
    }

    setVerification(String(result.verification ?? ""));
  };

  const startOver = () => {
    setSent(false);
    setVerification("");
    setCode("");
    setErrors({});
    setFormError("");
    setCooldown(0);
  };

  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = signupAccountSchema.safeParse({ company_name: companyName, password });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as FieldKey] = issue.message;
      setErrors(next);
      return;
    }

    setBusy("create");
    setErrors({});
    setFormError("");
    const result = await ask("/api/auth/register", {
      verification,
      company_name: parsed.data.company_name,
      password: parsed.data.password,
    });
    setBusy("");

    if (result instanceof ApiError) {
      if (result.code === "invalid_verification") {
        // The window closed while the password was being typed. Restart honestly
        // instead of letting them press Create again on a dead token.
        startOver();
        setPassword("");
      }
      setFormError(result.message);
      return;
    }

    const session = result as unknown as SessionPayload;
    if (!session.organizationId) {
      setFormError("Your account was created, but no workspace came back. Sign in instead.");
      return;
    }
    // `/dashboard`, not `/dashboard/overview`: which screen a role opens is decided
    // server-side, and this account's administrator sees a different page than a
    // requester would.
    router.replace("/dashboard");
    router.refresh();
  };

  // Which step renders is decided by what the previous one handed back.
  let step: 1 | 2 | 3 = 1;
  if (sent) step = 2;
  if (verification) step = 3;

  return (
    <form noValidate onSubmit={createAccount} className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Field className="gap-1.5" data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="register-email">Email</FieldLabel>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            readOnly={step >= 2}
            aria-invalid={Boolean(errors.email)}
            disabled={busy !== ""}
          />
          {errors.email ? <FieldError errors={[{ message: errors.email }]} /> : null}
          {step === 2 ? <FieldDescription>Sent to {email}.</FieldDescription> : null}
        </Field>

        {step >= 2 ? (
          <Field className="gap-1.5" data-invalid={Boolean(errors.code)}>
            <FieldLabel htmlFor="register-code">Verification code</FieldLabel>
            <InputOTP
              id="register-code"
              ref={codeInputRef}
              maxLength={SIGNUP_CODE_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={(value) => setCode(value)}
              onComplete={() => void checkCode()}
              disabled={busy !== "" || Boolean(verification)}
              containerClassName="justify-between"
            >
              <InputOTPGroup>
                {Array.from({ length: SIGNUP_CODE_LENGTH }, (_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: the slots are a fixed row of six; the index is their identity, not an order that changes.
                  <InputOTPSlot key={index} index={index} className="size-11" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {errors.code ? <FieldError errors={[{ message: errors.code }]} /> : null}
            {verification ? (
              <p className="flex items-center gap-1.5 text-emerald-600 text-sm dark:text-emerald-400">
                <CheckCircle2Icon className="size-4" />
                Address verified
              </p>
            ) : (
              <FieldDescription className="flex flex-wrap items-center gap-x-1">
                {cooldown > 0 ? (
                  <span>Resend in {cooldown}s.</span>
                ) : (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy !== ""}
                    className="font-medium underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Send a new code
                  </button>
                )}
                <span aria-hidden>·</span>
                <button
                  type="button"
                  onClick={startOver}
                  disabled={busy !== ""}
                  className="font-medium underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Use a different email
                </button>
              </FieldDescription>
            )}
          </Field>
        ) : null}

        {step === 3 ? (
          <>
            <Field className="gap-1.5" data-invalid={Boolean(errors.company_name)}>
              <FieldLabel htmlFor="register-company">Company name</FieldLabel>
              <Input
                id="register-company"
                ref={companyInputRef}
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Northwind IT"
                autoComplete="organization"
                aria-invalid={Boolean(errors.company_name)}
                disabled={busy !== ""}
              />
              {errors.company_name ? <FieldError errors={[{ message: errors.company_name }]} /> : null}
              <FieldDescription>This is your workspace, and you own it.</FieldDescription>
            </Field>

            <Field className="gap-1.5" data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="register-password">Password</FieldLabel>
              <PasswordField
                id="register-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                disabled={busy !== ""}
              />
              {errors.password ? <FieldError errors={[{ message: errors.password }]} /> : null}
              <FieldDescription>At least {PASSWORD_MIN_LENGTH} characters.</FieldDescription>
            </Field>
          </>
        ) : null}
      </FieldGroup>

      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

      {step === 1 ? (
        <Button type="button" className="w-full" onClick={sendCode} disabled={busy !== ""}>
          {busy === "send" ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
          Send code
        </Button>
      ) : null}

      {step === 2 ? (
        <Button
          type="button"
          className="w-full"
          onClick={checkCode}
          disabled={busy !== "" || code.length < SIGNUP_CODE_LENGTH}
        >
          {busy === "verify" ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
          Verify code
        </Button>
      ) : null}

      {step === 3 ? (
        <Button type="submit" className="w-full" disabled={busy !== ""}>
          {busy === "create" ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
          {busy === "create" ? "Creating your account…" : "Create account"}
        </Button>
      ) : null}

      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
