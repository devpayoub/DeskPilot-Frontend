"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { LoaderCircleIcon, PlusIcon } from "lucide-react";

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
import type { Department } from "@/lib/api/types";

/** Radix `Select` refuses an empty string as a value, so "no parent" needs a token. */
const NO_PARENT = "none";

/**
 * Add a department to the account.
 *
 * The permission is not decided here — the API checks that the caller is an
 * administrator *of this organisation*. This only decides whether to show the
 * button, so a drift bug can hide it but never grant it.
 */
export function DepartmentCreate({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState(NO_PARENT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setCode("");
    setParentId(NO_PARENT);
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiPost("org/departments", {
        name: name.trim(),
        code: code.trim(),
        parent_id: parentId === NO_PARENT ? null : Number(parentId),
      });
      reset();
      setOpen(false);
      // The table is server-rendered; refetch rather than pushing a row into
      // local state, so the list shows what the database actually holds.
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
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
          <PlusIcon className="size-4" />
          Add department
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add a department</DialogTitle>
            <DialogDescription>
              A group of your own staff. Members can be placed in one, and it can nest under another department.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="department-name">Name</Label>
            <Input
              id="department-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Field technicians"
              autoFocus
              required
              maxLength={120}
              disabled={busy}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="department-code">Code</Label>
              <Input
                id="department-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="FLD"
                maxLength={32}
                disabled={busy}
              />
              <p className="text-muted-foreground text-xs">Optional short handle.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Parent</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={busy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>No parent</SelectItem>
                  {departments
                    .filter((department) => department.is_active)
                    .map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || name.trim().length === 0}>
              {busy ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
