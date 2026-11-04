"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { type ChangePasswordValues, changePasswordSchema, PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

/**
 * Change the password from inside the account.
 *
 * The consequence is stated before it happens, because it is not the one most
 * people expect: this ends every sign-in on the account, including the one on the
 * laptop in the next room. It does not end *this* one — the API mints a replacement
 * pair and the route that calls it stores that pair in the session cookies, so the
 * tab that asked stays open while the others are evicted.
 *
 * All three fields are revealable. A wrong current password is a 401 that says
 * "that is not your current password", and a mistyped new one is a strength
 * refusal — neither is worth receiving twice because a character could not be seen.
 */
export function ChangePasswordForm({ onChanged }: { onChanged: () => void }) {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [endedSessions, setEndedSessions] = useState<number | null>(null);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", password: "", confirm_password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setFormError("");
    setEndedSessions(null);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ current_password: values.current_password, password: values.password }),
      });

      if (!response.ok) {
        const error = await ApiError.fromResponse(response);
        if (error.code === "invalid_credentials") {
          // Belongs on the field it is about, not in a banner: the new password is
          // already typed and correct, and a form-wide message invites starting over.
          form.setError("current_password", { message: errorMessage(error) });
          return;
        }
        if (error.code === "weak_password" || error.code === "password_unchanged") {
          form.setError("password", { message: errorMessage(error) });
          return;
        }
        setFormError(error.status === 429 ? errorMessage(error) : error.message);
        return;
      }

      const done = (await response.json()) as { revoked_sessions: number };
      form.reset();
      setEndedSessions(done.revoked_sessions);
      onChanged();
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          control={form.control}
          name="current_password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="change-current">Current password</FieldLabel>
              <PasswordField
                {...field}
                id="change-current"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                disabled={pending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="change-new">New password</FieldLabel>
              <PasswordField
                {...field}
                id="change-new"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                disabled={pending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <FieldDescription>
                At least {PASSWORD_MIN_LENGTH} characters, not a common one, and not like your name or address.
              </FieldDescription>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="confirm_password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="change-confirm">Confirm new password</FieldLabel>
              <PasswordField
                {...field}
                id="change-confirm"
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

      <p className="text-muted-foreground text-xs">
        Changing it ends every other sign-in on this account. This tab keeps working: it is handed a new session at the
        same moment the old ones are refused.
      </p>

      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

      {endedSessions !== null ? (
        <p className="text-sm">
          Password changed. {endedSessions} sign-in{endedSessions === 1 ? "" : "s"} ended.
        </p>
      ) : null}

      <Button type="submit" size="sm" className="w-fit" disabled={pending}>
        {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}
