"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { baseTicketSchema, serviceRequestDetailsSchema, type AssignableUser } from "backend/client";
import { createTicketAction } from "@/app/actions/tickets";
import { Field, FormSection, inputClass, textareaClass } from "@/components/tickets/form-fields";
import { Button } from "@/components/ui/button";

const formSchema = baseTicketSchema.merge(serviceRequestDetailsSchema);
type FormValues = z.infer<typeof formSchema>;

export function ServiceRequestCreateForm({ assignableUsers }: { assignableUsers: AssignableUser[] }) {
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
      "service_request",
      { title: values.title, description: values.description, priority: values.priority },
      {
        category: values.category,
        requestedCompletionDate: values.requestedCompletionDate,
        assigneeUserId: Number(values.assigneeUserId),
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

      <FormSection title="Service Details">
        <Field label="What type of service do you need?" error={errors.category} full>
          <input className={inputClass} {...register("category")} placeholder="e.g. Access Request" />
        </Field>
        <Field label="Who should handle this?" error={errors.assigneeUserId} full>
          <select className={inputClass} {...register("assigneeUserId", { valueAsNumber: true })}>
            <option value="">Select an Associate or Admin…</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      {submitError && <p className="text-sm text-status-error">{submitError}</p>}

      <Button type="submit" loading={isSubmitting} className="w-fit">
        Create Service Request
      </Button>
    </form>
  );
}
