"use client";

import { type ComponentProps, useState } from "react";

import { cn } from "cn";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type">;

/**
 * A password input with a reveal toggle, in the shape the members dialog already
 * used for generated passwords.
 *
 * Every one of these forms asks for a secret the person cannot see while typing,
 * and the failure is silent: they submit, the server calls it weak or the confirm
 * field calls it a mismatch, and they cannot tell which character went wrong. The
 * toggle is what makes a confirm field worth having.
 *
 * The button is `type="button"` on purpose — these inputs live inside forms whose
 * submit button is the next thing in the tab order.
 */
export function PasswordField({ className, disabled, ...props }: PasswordFieldProps) {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="flex gap-2">
      <Input
        {...props}
        type={reveal ? "text" : "password"}
        disabled={disabled}
        className={cn("font-mono", className)}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        aria-label={reveal ? "Hide password" : "Show password"}
        aria-pressed={reveal}
        onClick={() => setReveal((value) => !value)}
      >
        {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </Button>
    </div>
  );
}
