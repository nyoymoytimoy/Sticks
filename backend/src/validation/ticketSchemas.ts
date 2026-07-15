import { z } from "zod";

export const TICKET_TYPE_CODES = [
  "database_fix_request",
  "mass_request",
  "bcp_whitelisting_request",
  "incident_report",
  "service_request",
] as const;

export type TicketTypeCode = (typeof TICKET_TYPE_CODES)[number];

export const baseTicketSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().max(4000).optional(),
  // No .default() here deliberately: zod's `.default()` makes the input
  // type optional but the output (z.infer) type required, which conflicts
  // with react-hook-form's useForm<T> generic (it expects one consistent
  // type). Each create form supplies its own `defaultValues: { priority: ... }`
  // to useForm instead. The same reasoning rules out `.transform()` here
  // for normalizing "" -> undefined -- see stripEmptyStrings() below, which
  // does that job outside the schema instead.
  priority: z.enum(["low", "medium", "high", "critical"]),
});

// Database Fix Request and Mass Request share the exact same fields --
// both write to ticket_db_change_details (see migration 003's comment on
// why they share one extension table).
export const dbChangeDetailsSchema = z.object({
  environment: z.string().min(1).max(64),
  affectedSystem: z.string().min(1).max(255),
  tableName: z.string().max(255).optional(),
  changeDescription: z.string().min(1).max(4000),
  businessJustification: z.string().min(1).max(4000),
  recordCountEstimate: z.number().int().positive().optional(),
  requestedCompletionDate: z.string().optional(),
});

export const bcpWhitelistDetailsSchema = z
  .object({
    ipCidr: z.string().max(64).optional(),
    urlDomain: z.string().max(255).optional(),
    department: z.string().min(1).max(120),
    businessReason: z.string().min(1).max(4000),
    expiryDate: z.string().optional(),
  })
  .refine((data) => Boolean(data.ipCidr || data.urlDomain), {
    message: "Provide an IP/CIDR or a URL/domain to whitelist.",
    path: ["ipCidr"],
  });

export const incidentReportDetailsSchema = z.object({
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"]),
  systemsAffected: z.string().min(1).max(4000),
  incidentOccurredAt: z.string().min(1),
  impactDescription: z.string().min(1).max(4000),
  immediateActionTaken: z.string().max(4000).optional(),
});

export const serviceRequestDetailsSchema = z.object({
  category: z.string().min(1).max(120),
  requestedCompletionDate: z.string().optional(),
  assigneeUserId: z.number().int().positive(),
});

export const TICKET_TYPE_DETAIL_SCHEMAS = {
  database_fix_request: dbChangeDetailsSchema,
  mass_request: dbChangeDetailsSchema,
  bcp_whitelisting_request: bcpWhitelistDetailsSchema,
  incident_report: incidentReportDetailsSchema,
  service_request: serviceRequestDetailsSchema,
} satisfies Record<TicketTypeCode, z.ZodTypeAny>;

export type TicketDetailsFor<T extends TicketTypeCode> = z.infer<
  (typeof TICKET_TYPE_DETAIL_SCHEMAS)[T]
>;

/**
 * Empty HTML <input type="date"/text"> fields submit as "" (not undefined),
 * which `.optional()` alone doesn't catch -- "" passed straight to a
 * Postgres DATE column throws "invalid input syntax for type date". Called
 * on raw form data before it reaches `.safeParse()`, so the zod schemas
 * above can stay simple `.optional()` fields without an input/output type
 * mismatch (see the note on baseTicketSchema.priority for why `.transform()`
 * isn't used instead).
 */
export function stripEmptyStrings<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  for (const key of Object.keys(result)) {
    if (result[key as keyof T] === "") {
      delete result[key as keyof T];
    }
  }
  return result;
}
