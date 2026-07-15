/**
 * Database Fix Request's action codes, centralized so the frontend never
 * hand-writes the magic strings the seeded ticket_type_workflow_transitions
 * rows use (see migration 20260715120009). The actual state machine (which
 * transitions are legal, who's authorized) lives in the database as data,
 * not here -- this file only names it for type-safe reference.
 */
export const DB_FIX_REQUEST_ACTIONS = {
  APPROVE: "approve",
  SEND_BACK: "send_back",
  DECLINE: "decline",
  RESUBMIT: "resubmit",
  START: "start",
  COMPLETE: "complete",
  REQUEST_DISCUSSION: "request_discussion",
  RESUME: "resume",
  REOPEN: "reopen",
} as const;
