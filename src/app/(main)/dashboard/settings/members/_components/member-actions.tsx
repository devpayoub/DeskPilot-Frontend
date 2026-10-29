"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { CheckIcon, CopyIcon, LoaderCircleIcon, PencilIcon, RefreshCwIcon, UserMinusIcon } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { apiDelete, apiPatch, apiPost } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { Department, OrganizationMember, Role } from "@/lib/api/types";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/auth/capabilities";
import { generatePassword } from "@/lib/passwords";

const NO_DEPARTMENT = "none";

/**
 * Change one person's role, department or access.
 *
 * Two refusals are expected rather than exceptional, and both come back with a
 * message worth showing verbatim: an account cannot lose its last administrator,
 * and the owner cannot be switched off. The API decides; this only reports.
 */
export function MemberActions({ member, departments }: { member: OrganizationMember; departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(member.role);
  const [departmentId, setDepartmentId] = useState(member.department_id ? String(member.department_id) : NO_DEPARTMENT);
  const [isActive, setIsActive] = useState(member.is_active);
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState("");

  // Password reset. Separate from the save button on purpose: it is a different
  // decision with a different consequence (the old password stops working now).
  const [passwordInput, setPasswordInput] = useState("");
  const [issuedPassword, setIssuedPassword] = useState("");
  const [busyPassword, setBusyPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetPassword = async () => {
    setBusyPassword(true);
    setError("");
    try {
      const result = await apiPost<{ password: string }>(`org/members/${member.id}/password`, {
        password: passwordInput.trim() || null,
      });
      setIssuedPassword(result.password);
      setPasswordInput("");
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyPassword(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(issuedPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("save");
    setError("");
    try {
      await apiPatch(`org/members/${member.id}`, {
        role,
        department_id: departmentId === NO_DEPARTMENT ? null : Number(departmentId),
        is_active: isActive,
      });
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const removeAccess = async () => {
    setBusy("remove");
    setError("");
    try {
      await apiDelete(`org/members/${member.id}`);
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError("");
          // A password shown once should not still be on screen the next time
          // this dialog is opened.
          setPasswordInput("");
          setIssuedPassword("");
          setCopied(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <PencilIcon className="size-3.5" />
          Manage
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{member.full_name}</DialogTitle>
            <DialogDescription>{member.email}</DialogDescription>
          </DialogHeader>

          {member.status === "invited" ? (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
              This invitation has not been accepted yet. They cannot sign in until they set a password.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(next) => setRole(next as Role)} disabled={busy !== null}>
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
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={busy !== null}>
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

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="member-active">Access enabled</Label>
              <span className="text-muted-foreground text-xs">
                {member.is_owner
                  ? "The owner of the account cannot be switched off."
                  : "Turning this off ends their access without deleting their history."}
              </span>
            </div>
            <Switch
              id="member-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={busy !== null || member.is_owner}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="member-new-password">Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setPasswordInput(generatePassword())}
                disabled={busy !== null || busyPassword}
              >
                <RefreshCwIcon className="size-3" />
                Generate
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                id="member-new-password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="Leave empty to generate one"
                autoComplete="new-password"
                className="font-mono"
                disabled={busy !== null || busyPassword}
              />
              <Button type="button" variant="outline" onClick={resetPassword} disabled={busy !== null || busyPassword}>
                {busyPassword ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
                Set
              </Button>
            </div>

            {issuedPassword ? (
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={issuedPassword}
                    className="font-mono"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label="Copy password">
                    {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Shown once. Hand it over now — it cannot be read back later.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Replaces their password immediately. Use this when someone is locked out.
              </p>
            )}
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={removeAccess}
              disabled={busy !== null || member.is_owner}
            >
              {busy === "remove" ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <UserMinusIcon className="size-4" />
              )}
              Remove access
            </Button>
            <Button type="submit" disabled={busy !== null}>
              {busy === "save" ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
