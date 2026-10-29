"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon, RefreshCwIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPost } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { Department, OrganizationMember, Role } from "@/lib/api/types";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/auth/capabilities";
import { generatePassword } from "@/lib/passwords";

const NO_DEPARTMENT = "none";

type Issued = { email: string; role: Role; password: string };

/**
 * Add a member with a password they can sign in with straight away.
 *
 * No invitation link: the administrator sets (or generates) the password here and
 * hands it over. That is the normal helpdesk arrangement — the same desk already
 * resets passwords as a tool — and it removes the step where an invited person
 * cannot get in until they redeem a link.
 *
 * The password is shown once, because only a hash is stored. It is deliberately
 * still in the form field rather than a separate panel: an administrator often
 * needs to read it out, and hiding what you are about to hand over is not
 * security, it is theatre.
 */
export function AddMember({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("REQUESTER");
  const [departmentId, setDepartmentId] = useState(NO_DEPARTMENT);
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<Issued | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setRole("REQUESTER");
    setDepartmentId(NO_DEPARTMENT);
    setPassword("");
    setReveal(true);
    setError("");
    setIssued(null);
    setCopied(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await apiPost<OrganizationMember>("org/members", {
        email: email.trim(),
        role,
        department_id: departmentId === NO_DEPARTMENT ? null : Number(departmentId),
        // Empty means "let the server generate one" — never a blank password.
        password: password.trim() || null,
      });
      setIssued({
        email: created.email,
        role: created.role,
        password: created.initial_password ?? "",
      });
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlusIcon className="size-4" />
          Add member
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {issued ? (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Member added</DialogTitle>
              <DialogDescription>
                {issued.email} can sign in now as {ROLE_LABELS[issued.role]} with this password.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="issued-password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="issued-password"
                  readOnly
                  value={issued.password}
                  className="font-mono"
                  onFocus={(event) => event.currentTarget.select()}
                />
                <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy password">
                  {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Shown once — only a hash is stored. If it is lost, set a new one from the member's row.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Add a member</DialogTitle>
              <DialogDescription>
                They sign in with this email and password. The role applies to this account only.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="off"
                autoFocus
                required
                disabled={busy}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(next) => setRole(next as Role)} disabled={busy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ROLE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId} disabled={busy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="member-password">Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setPassword(generatePassword());
                    setReveal(true);
                  }}
                  disabled={busy}
                >
                  <RefreshCwIcon className="size-3" />
                  Generate
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="member-password"
                  type={reveal ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Leave empty to generate one"
                  autoComplete="new-password"
                  className="font-mono"
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setReveal((value) => !value)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  disabled={busy}
                >
                  {reveal ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                At least 8 characters, and not a common one. Left empty, the server generates a strong password.
              </p>
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || email.trim().length === 0}>
                {busy ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
                Add member
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
