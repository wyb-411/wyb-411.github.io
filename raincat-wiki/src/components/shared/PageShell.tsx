"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DashboardCanvas } from "@/components/shared/DashboardCanvas";

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  actions,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <DashboardCanvas className={cn("px-5 pb-20 pt-28 sm:px-7", className)}>
      <div className="mx-auto w-full max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            {eyebrow && <div className="font-averia text-sm text-[var(--color-brand)]">{eyebrow}</div>}
            <h1 className="font-averia mt-2 text-4xl leading-none sm:text-5xl">{title}</h1>
            {description && <p className="text-secondary mt-4 max-w-xl text-sm leading-7">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </motion.header>
        {children}
      </div>
    </DashboardCanvas>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search"
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 min-w-0 rounded-full border border-white/70 bg-white/55 px-4 text-sm shadow-[0_12px_34px_rgba(51,79,82,0.06)] backdrop-blur-xl transition focus:bg-white/75 sm:min-w-[260px]"
    />
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-white/70 bg-white/45 p-1 shadow-[0_12px_34px_rgba(51,79,82,0.06)] backdrop-blur-xl">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-medium transition",
            value === option.value ? "bg-linear text-white shadow-sm" : "text-secondary hover:bg-white/55"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <div className="font-averia text-2xl">{title}</div>
      <p className="text-secondary mt-3 max-w-sm text-sm leading-7">{description}</p>
    </div>
  );
}
