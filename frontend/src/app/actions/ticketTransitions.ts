"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/authOptions";
import { applyTicketTransition } from "backend";

export async function applyTicketTransitionAction(
  ticketId: number,
  actionCode: string,
  note?: string
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false as const, error: "Not authenticated." };
  }

  const result = await applyTicketTransition({
    ticketId,
    actorUserId: Number(session.user.id),
    actorRoles: session.user.roles,
    actionCode,
    note,
  });

  if (result.ok) {
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
  }

  return result;
}
