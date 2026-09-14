import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export function NumInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="decimal"
      className={cn(
        "min-h-11 w-full rounded-sm border border-border bg-bg px-3 font-mono text-base text-fg outline-none ring-accent/40 placeholder:text-subtle focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-sm border border-border bg-bg px-3 text-base text-fg outline-none ring-accent/40 focus:ring-2",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        className,
      )}
    >
      {children}
    </section>
  );
}
