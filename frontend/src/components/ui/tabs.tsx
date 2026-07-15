"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn("flex gap-1 border-b border-border", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "px-4 py-2 text-sm font-medium text-ink-500 transition-colors",
        "data-[state=active]:text-teal data-[state=active]:border-b-2 data-[state=active]:border-teal",
        "hover:text-ink-900",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: RadixTabs.TabsContentProps) {
  return (
    <RadixTabs.Content className={cn("py-6", className)} {...props} />
  );
}
