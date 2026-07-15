"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/authOptions";
import {
  createTicket,
  baseTicketSchema,
  TICKET_TYPE_DETAIL_SCHEMAS,
  stripEmptyStrings,
  type TicketTypeCode,
  type TicketDetailsFor,
} from "backend";

type CreateTicketResult =
  | { ok: true; ticketId: number; ticketNumber: string }
  | { ok: false; error: string };

// Returns a plain result object rather than calling redirect() itself, so
// the client can await this action inside a try/catch (for real failures
// like a DB error) without also having to special-case Next's internal
// redirect-signaling exception -- that's an undocumented implementation
// detail, not part of the public API surface.
export async function createTicketAction<T extends TicketTypeCode>(
  type: T,
  rawBase: unknown,
  rawDetails: unknown
): Promise<CreateTicketResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, error: "Not authenticated." };
  }

  const baseResult = baseTicketSchema.safeParse(
    stripEmptyStrings(rawBase as Record<string, unknown>)
  );
  if (!baseResult.success) {
    return { ok: false, error: "Invalid ticket details." };
  }

  const detailsResult = TICKET_TYPE_DETAIL_SCHEMAS[type].safeParse(
    stripEmptyStrings(rawDetails as Record<string, unknown>)
  );
  if (!detailsResult.success) {
    return { ok: false, error: "Invalid ticket details." };
  }

  try {
    const ticket = await createTicket({
      type,
      requestorId: Number(session.user.id),
      base: baseResult.data,
      details: detailsResult.data as TicketDetailsFor<T>,
    });

    revalidatePath("/tickets");
    return { ok: true, ticketId: ticket.id, ticketNumber: ticket.ticketNumber };
  } catch (err) {
    console.error("createTicketAction failed:", err);
    return { ok: false, error: "Something went wrong creating the ticket. Please try again." };
  }
}
