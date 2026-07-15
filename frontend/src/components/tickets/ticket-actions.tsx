"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyTicketTransitionAction } from "@/app/actions/ticketTransitions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { AvailableAction } from "backend/client";

export function TicketActions({
  ticketId,
  actions,
}: {
  ticketId: number;
  actions: AvailableAction[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [noteDraftFor, setNoteDraftFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function runAction(actionCode: string, actionNote?: string) {
    setPendingAction(actionCode);
    const result = await applyTicketTransitionAction(ticketId, actionCode, actionNote);
    setPendingAction(null);

    if (!result.ok) {
      push({ title: "Action failed", description: result.error, tone: "error" });
      return;
    }

    setNoteDraftFor(null);
    setNote("");
    push({ title: "Ticket updated", tone: "success" });
    router.refresh();
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-base p-5 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-wide text-teal">Actions</span>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isDecline = action.actionCode === "decline";
          return (
            <Button
              key={action.actionCode}
              variant={isDecline ? "destructive" : "secondary"}
              loading={pendingAction === action.actionCode}
              onClick={() => {
                if (action.requiresNote) {
                  setNoteDraftFor(action.actionCode);
                } else {
                  runAction(action.actionCode);
                }
              }}
            >
              {action.toStatusLabel}
            </Button>
          );
        })}
      </div>

      {noteDraftFor && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary p-3">
          <label className="text-sm text-ink-700">
            Note (required)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 min-h-20 w-full rounded-md border border-border bg-surface-base px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={pendingAction === noteDraftFor}
              disabled={!note.trim()}
              onClick={() => runAction(noteDraftFor, note)}
            >
              Submit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNoteDraftFor(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
