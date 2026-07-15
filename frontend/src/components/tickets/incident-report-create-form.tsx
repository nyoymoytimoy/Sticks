"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { baseTicketSchema, incidentReportDetailsSchema } from "backend/client";
import { createTicketAction } from "@/app/actions/tickets";
import { Field, FormSection, inputClass, textareaClass } from "@/components/tickets/form-fields";
import { Button } from "@/components/ui/button";

const formSchema = baseTicketSchema.merge(incidentReportDetailsSchema);
type FormValues = z.infer<typeof formSchema>;

export function IncidentReportCreateForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { priority: "high" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const result = await createTicketAction(
      "incident_report",
      { title: values.title, description: values.description, priority: values.priority },
      {
        severity: values.severity,
        systemsAffected: values.systemsAffected,
        incidentOccurredAt: values.incidentOccurredAt,
        impactDescription: values.impactDescription,
        immediateActionTaken: values.immediateActionTaken,
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
        <Field label="When did it happen?" error={errors.incidentOccurredAt}>
          <input type="datetime-local" className={inputClass} {...register("incidentOccurredAt")} />
        </Field>
      </FormSection>

      <FormSection title="Incident Details">
        <Field label="How severe is it?" error={errors.severity} full>
          <select className={inputClass} {...register("severity")}>
            <option value="sev1">Sev1 — Critical, everyone affected</option>
            <option value="sev2">Sev2 — High, many people affected</option>
            <option value="sev3">Sev3 — Medium, some people affected</option>
            <option value="sev4">Sev4 — Low, minor issue</option>
          </select>
        </Field>
        <Field label="Which systems are affected?" error={errors.systemsAffected} full>
          <textarea className={textareaClass} {...register("systemsAffected")} />
        </Field>
        <Field label="What's the impact?" error={errors.impactDescription} full>
          <textarea className={textareaClass} {...register("impactDescription")} />
        </Field>
        <Field label="What have you already tried? (optional)" full>
          <textarea className={textareaClass} {...register("immediateActionTaken")} />
        </Field>
      </FormSection>

      {submitError && <p className="text-sm text-status-error">{submitError}</p>}

      <Button type="submit" loading={isSubmitting} className="w-fit">
        Report Incident
      </Button>
    </form>
  );
}
