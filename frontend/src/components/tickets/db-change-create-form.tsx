"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { baseTicketSchema, dbChangeDetailsSchema } from "backend/client";
import { createTicketAction } from "@/app/actions/tickets";
import { Field, FormSection, inputClass, textareaClass } from "@/components/tickets/form-fields";
import { Button } from "@/components/ui/button";

const formSchema = baseTicketSchema.merge(dbChangeDetailsSchema);
type FormValues = z.infer<typeof formSchema>;

// Shared by both Database Fix Request and Mass Request pages -- the two
// types have identical fields (see backend/src/validation/ticketSchemas.ts);
// only the approval-time auto-tagging behavior differs, which lands in
// spec 008.
export function DbChangeCreateForm({
  type,
}: {
  type: "database_fix_request" | "mass_request";
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { priority: "medium" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const result = await createTicketAction(
      type,
      { title: values.title, description: values.description, priority: values.priority },
      {
        environment: values.environment,
        affectedSystem: values.affectedSystem,
        tableName: values.tableName,
        changeDescription: values.changeDescription,
        businessJustification: values.businessJustification,
        recordCountEstimate: values.recordCountEstimate,
        requestedCompletionDate: values.requestedCompletionDate,
      }
    );
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/tickets/${result.ticketId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title="Ticket Details">
        <Field label="Title" error={errors.title} full>
          <input className={inputClass} {...register("title")} />
        </Field>
        <Field label="Description (optional)" full>
          <textarea className={textareaClass} {...register("description")} />
        </Field>
        <Field label="How urgent is this?" error={errors.priority}>
          <select className={inputClass} {...register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>
        <Field label="Needed by (optional)">
          <input type="date" className={inputClass} {...register("requestedCompletionDate")} />
        </Field>
      </FormSection>

      <FormSection title="Change Details">
        <Field label="Which environment? (e.g. Production, Staging)" error={errors.environment}>
          <input className={inputClass} {...register("environment")} placeholder="e.g. Production" />
        </Field>
        <Field label="Which system is affected?" error={errors.affectedSystem}>
          <input className={inputClass} {...register("affectedSystem")} />
        </Field>
        <Field label="Table name (optional)" full={type !== "mass_request"}>
          <input className={inputClass} {...register("tableName")} />
        </Field>
        {type === "mass_request" && (
          <Field label="How many records will this affect? (optional)">
            <input
              type="number"
              className={inputClass}
              {...register("recordCountEstimate", { valueAsNumber: true })}
            />
          </Field>
        )}
        <Field label="What needs to change?" error={errors.changeDescription} full>
          <textarea className={textareaClass} {...register("changeDescription")} />
        </Field>
        <Field label="Why is this change needed?" error={errors.businessJustification} full>
          <textarea className={textareaClass} {...register("businessJustification")} />
        </Field>
      </FormSection>

      {submitError && <p className="text-sm text-status-error">{submitError}</p>}

      <Button type="submit" loading={isSubmitting} className="w-fit">
        Submit for Approval
      </Button>
    </form>
  );
}
