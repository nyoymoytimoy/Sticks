"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { baseTicketSchema, bcpWhitelistDetailsSchema } from "backend/client";
import { createTicketAction } from "@/app/actions/tickets";
import { Field, inputClass, textareaClass } from "@/components/tickets/form-fields";
import { Button } from "@/components/ui/button";

const formSchema = baseTicketSchema.merge(bcpWhitelistDetailsSchema);
type FormValues = z.infer<typeof formSchema>;

export function BcpCreateForm() {
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
      "bcp_whitelisting_request",
      { title: values.title, description: values.description, priority: values.priority },
      {
        ipCidr: values.ipCidr,
        urlDomain: values.urlDomain,
        department: values.department,
        businessReason: values.businessReason,
        expiryDate: values.expiryDate,
      }
    );
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/tickets/${result.ticketId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
      <Field label="Title" error={errors.title}>
        <input className={inputClass} {...register("title")} />
      </Field>
      <Field label="Description (optional)">
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
      <Field label="IP address or range to whitelist (optional)" error={errors.ipCidr}>
        <input className={inputClass} {...register("ipCidr")} placeholder="e.g. 203.0.113.0/24" />
      </Field>
      <Field label="Website or domain to whitelist (optional)">
        <input className={inputClass} {...register("urlDomain")} placeholder="e.g. vendor.example.com" />
      </Field>
      <Field label="Department" error={errors.department}>
        <input className={inputClass} {...register("department")} />
      </Field>
      <Field label="Why do you need this whitelisted?" error={errors.businessReason}>
        <textarea className={textareaClass} {...register("businessReason")} />
      </Field>
      <Field label="When should this expire? (optional)">
        <input type="date" className={inputClass} {...register("expiryDate")} />
      </Field>

      {submitError && <p className="text-sm text-status-error">{submitError}</p>}

      <Button type="submit" loading={isSubmitting} className="mt-2 w-fit">
        Create Whitelisting Request
      </Button>
    </form>
  );
}
