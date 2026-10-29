"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { LoaderCircleIcon, PencilIcon, Trash2Icon } from "lucide-react";

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
import { apiDelete, apiPatch } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import type { Department } from "@/lib/api/types";

const NO_PARENT = "none";

/**
 * Rename, re-parent, archive or delete one department.
 *
 * Deleting a staffed department is refused by the API rather than silently
 * emptying it — so when that refusal comes back, this asks where those people
 * should go instead of pretending the click failed for no reason.
 */
export function DepartmentActions({ department, departments }: { department: Department; departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(department.name);
  const [code, setCode] = useState(department.code);
  const [parentId, setParentId] = useState(department.parent_id ? String(department.parent_id) : NO_PARENT);
  const [isActive, setIsActive] = useState(department.is_active);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");

  // Set only when the API refused the delete because people are still in it.
  const [needsReassign, setNeedsReassign] = useState(false);
  const [reassignId, setReassignId] = useState("");

  const others = departments.filter((other) => other.id !== department.id);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("save");
    setError("");
    try {
      await apiPatch(`org/departments/${department.id}`, {
        name: name.trim(),
        code: code.trim(),
        parent_id: parentId === NO_PARENT ? null : Number(parentId),
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

  const remove = async (reassignTo?: number) => {
    setBusy("delete");
    setError("");
    try {
      const suffix = reassignTo ? `?reassign_to=${reassignTo}` : "";
      await apiDelete(`org/departments/${department.id}${suffix}`);
      setOpen(false);
      router.refresh();
    } catch (caught) {
      if (isApiError(caught) && caught.code === "department_has_members") {
        setNeedsReassign(true);
        setError(caught.message);
      } else {
        setError(errorMessage(caught));
      }
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
          setNeedsReassign(false);
          setReassignId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{department.name}</DialogTitle>
            <DialogDescription>
              Renaming is safe. Archiving hides it from pickers without touching the people in it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-department-name">Name</Label>
            <Input
              id="edit-department-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
              disabled={busy !== null}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-department-code">Code</Label>
              <Input
                id="edit-department-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={32}
                disabled={busy !== null}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Parent</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={busy !== null}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>No parent</SelectItem>
                  {others
                    .filter((other) => other.is_active)
                    .map((other) => (
                      <SelectItem key={other.id} value={String(other.id)}>
                        {other.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="edit-department-active">Active</Label>
              <span className="text-muted-foreground text-xs">
                Archived departments keep their history and their members.
              </span>
            </div>
            <Switch
              id="edit-department-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={busy !== null}
            />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          {needsReassign ? (
            <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
              <Label>Move those members to</Label>
              <Select value={reassignId} onValueChange={setReassignId} disabled={busy !== null}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a department" />
                </SelectTrigger>
                <SelectContent>
                  {others
                    .filter((other) => other.is_active)
                    .map((other) => (
                      <SelectItem key={other.id} value={String(other.id)}>
                        {other.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy !== null || !reassignId}
                onClick={() => remove(Number(reassignId))}
              >
                {busy === "delete" ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
                Move members, then delete
              </Button>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={() => remove()} disabled={busy !== null}>
              {busy === "delete" && !needsReassign ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
              Delete
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
