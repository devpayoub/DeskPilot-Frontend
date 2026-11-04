"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { DISPLAY_NAME_MAX_LENGTH, type ProfileValues, profileSchema } from "@/lib/validation/auth";

/**
 * The one name a person chooses for themselves.
 *
 * Nothing else on this account is editable here, and that is the API's rule rather
 * than this form's: `PATCH /auth/me/` refuses any field but `display_name` and names
 * the one it refused. Sending the whole profile would therefore get an answer worth
 * showing — which is why the submit below forwards `{ display_name }` and the
 * message on failure comes from the server, not from a copy of its rules here.
 */
export function ProfileForm({ displayName }: { displayName: string }) {
  const router = useRouter();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: displayName },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;
  const error = errors.display_name;
  const value = form.watch("display_name");
  const unchanged = value.trim() === displayName.trim();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ display_name: values.display_name.trim() }),
      });

      if (!response.ok) {
        throw await ApiError.fromResponse(response);
      }

      // The server's answer is what the header and the sidebar will show, so the
      // page re-reads it instead of painting the typed string over the state.
      form.reset({ display_name: values.display_name.trim() });
      router.refresh();
    } catch (caught) {
      form.setError("display_name", { message: errorMessage(caught) });
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field className="gap-1.5" data-invalid={error !== undefined}>
        <FieldLabel htmlFor="profile-display-name">Display name</FieldLabel>
        <Input
          id="profile-display-name"
          {...form.register("display_name")}
          placeholder="Aïcha Benali"
          autoComplete="name"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          aria-invalid={error !== undefined}
          disabled={isSubmitting}
        />
        {error ? <FieldError errors={[error]} /> : null}
        <FieldDescription>
          What your colleagues see in a ticket and what the sidebar footer shows when there is no workspace to name.
        </FieldDescription>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={unchanged || isSubmitting}>
          {isSubmitting ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
        {!unchanged ? null : (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <CheckIcon className="size-3.5" />
            Up to date
          </span>
        )}
      </div>
    </form>
  );
}
