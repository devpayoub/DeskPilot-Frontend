"use client";

import { type ComponentProps, useState } from "react";

import { cn } from "cn";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type"> & {
  /**
   * Show the text. Leave it unset and the field keeps its own state, which is what
   * a sign-in or reset form wants.
   *
   * The members dialogs set it, because they have a reason to reveal the field from
   * outside the input: "Generate" has just produced a credential to hand over, and
   * dots on the thing you are reading out to someone are theatre, not security.
   */
  reveal?: boolean;
  onRevealChange?: (reveal: boolean) => void;
};

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
export function PasswordField({
  className,
  disabled,
  reveal: controlled,
  onRevealChange,
  ...props
}: PasswordFieldProps) {
  const [internal, setInternal] = useState(false);
  const reveal = controlled ?? internal;

  const toggle = () => {
    const next = !reveal;
    // While a parent is driving, its state is the only truth — keeping a local copy
    // in step too would just give the two a chance to disagree.
    if (controlled === undefined) setInternal(next);
    onRevealChange?.(next);
  };

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
        onClick={toggle}
      >
        {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </Button>
    </div>
  );
}
