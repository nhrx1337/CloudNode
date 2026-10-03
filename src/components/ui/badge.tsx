import { cn } from "@/lib/utils";

type Tone = "accent" | "success" | "danger" | "warning" | "neutral";

const toneClasses: Record<Tone, string> = {
  accent: "border-accent/40 bg-accent/10 text-indigo-300",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  neutral: "border-border bg-surface text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}