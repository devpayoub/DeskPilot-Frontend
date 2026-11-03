"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { type ForgotPasswordValues, forgotPasswordSchema } from "@/lib/validation/auth";

/** Seconds between link requests — the API's `password_forgot` rate is 5/min. */
const RESEND_COOLDOWN = 60;

/**
 * Step one of a password reset: say which address, get a link.
 *
 * The confirmation is deliberately worded so it is true for an account that does
 * not exist. Anything more specific — "we've emailed priya@…" — turns this form
 * into a directory of who uses DeskPilot, which is exactly what somebody with a
 * breach list is looking for.
 */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = form.handleSubmit(async (values) => {
    let response: Response;
    try {
      response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
    } catch {
      form.setError("email", { message: "Could not reach the server. Please try again." });
      return;
    }

    if (!response.ok) {
      const error = await ApiError.fromResponse(response);
      if (error.status === 429) {
        form.setError("email", { message: errorMessage(error) });
      } else {
        form.setError("email", { message: error.message });
      }
      return;
    }

    setSent(true);
    setCooldown(RESEND_COOLDOWN);
  });

  const startOver = () => {
    setSent(false);
    setCooldown(0);
    form.setValue("email", "");
    form.clearErrors();
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 rounded-lg border p-4">
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="text-sm">If that address has an account, a reset link is on its way.</p>
            <p className="text-muted-foreground text-xs">
              The link works once and expires in 30 minutes. Check spam if nothing arrives.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" onClick={startOver} disabled={cooldown > 0}>
            {cooldown > 0 ? `Send another link in ${cooldown}s` : "Send again"}
          </Button>
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
              <Input
                {...field}
                id="forgot-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                aria-invalid={fieldState.invalid}
                disabled={form.formState.isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <FieldDescription>The address on your DeskPilot account.</FieldDescription>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <LoaderCircleIcon className="size-4" /> : null}
        {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
