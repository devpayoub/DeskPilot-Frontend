"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleSlash2Icon, LoaderCircleIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { PASSWORD_MIN_LENGTH, type ResetPasswordValues, resetPasswordSchema } from "@/lib/validation/auth";

import { PasswordField } from "@/components/password-field";

/**
 * Step two of a password reset: the link from the email, and a new password.
 *
 * Two fields, both revealable, because the person is typing a secret they cannot
 * check any other way — the old password is gone, so a mistyped new one would only
 * surface as "wrong password" after they had already locked themselves out a
 * second time. The API does not accept a confirmation; matching is checked here and
 * re-checked by the strength validators on the server either way.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [deadLink, setDeadLink] = useState("");
  const [formError, setFormError] = useState("");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setFormError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (!response.ok) {
        const error = await ApiError.fromResponse(response);
        if (error.code === "invalid_token") {
          // Nothing on this page can fix a spent or expired link, so the form goes
          // away rather than inviting another guess.
          setDeadLink(error.message);
          return;
        }
        if (error.code === "weak_password") {
          form.setError("password", { message: errorMessage(error) });
          return;
        }
        setFormError(error.status === 429 ? errorMessage(error) : error.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  });

  if (deadLink) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 rounded-lg border p-4">
          <CircleSlash2Icon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <p className="text-sm">This reset link no longer works.</p>
            <p className="text-muted-foreground text-xs">{deadLink}</p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/forgot-password">Ask for a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <PasswordField
                {...field}
                id="reset-password"
                autoComplete="new-password"
                placeholder="••••••••"
                autoFocus
                aria-invalid={fieldState.invalid}
                disabled={pending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <FieldDescription>At least {PASSWORD_MIN_LENGTH} characters, and not a common one.</FieldDescription>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="confirm_password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-confirm">Confirm password</FieldLabel>
              <PasswordField
                {...field}
                id="reset-confirm"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                disabled={pending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Spinner className="size-4" /> : null}
        {pending ? "Setting…" : "Set new password"}
      </Button>
    </form>
  );
}
