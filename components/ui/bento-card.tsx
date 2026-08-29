import * as React from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: "full" | "half" | "third" | "two-thirds" | "quarter" | "hero" | "compact";
  variant?: "default" | "muted" | "inset";
}

const spanClasses: Record<NonNullable<BentoCardProps["span"]>, string> = {
  full: "col-span-12",
  half: "col-span-12 md:col-span-6",
  third: "col-span-12 md:col-span-4",
  "two-thirds": "col-span-12 md:col-span-8",
  quarter: "col-span-12 md:col-span-3",
  hero: "col-span-12 lg:col-span-8",
  compact: "col-span-12 lg:col-span-4",
};

const variantClasses: Record<NonNullable<BentoCardProps["variant"]>, string> = {
  default: "bg-neutral-900/80 ring-1 ring-neutral-800/80",
  muted: "bg-neutral-950/90 ring-1 ring-neutral-800/60",
  inset: "bg-neutral-950 ring-1 ring-inset ring-neutral-800/80",
};

export function BentoCard({
  className,
  span = "full",
  variant = "default",
  children,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 sm:p-6",
        "transition-colors duration-200 hover:ring-neutral-700/80",
        spanClasses[span],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_55%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function BentoLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}

export function BentoTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-base font-semibold tracking-tight text-neutral-50 sm:text-lg",
        className,
      )}
      {...props}
    />
  );
}

export function BentoDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm leading-relaxed text-neutral-400", className)} {...props} />
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="flex h-full min-h-[88px] flex-col justify-between rounded-xl bg-neutral-950/70 p-4 ring-1 ring-neutral-800/70">
      <BentoLabel>{label}</BentoLabel>
      <div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-50">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      </div>
    </div>
  );
}
