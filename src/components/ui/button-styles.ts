import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-outline";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent/90 shadow-sm",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-zinc-800/60",
  ghost: "text-muted hover:bg-zinc-800/60 hover:text-foreground",
  danger: "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
  "danger-outline":
    "border border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40",
};

export const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
  icon: "h-9 w-9",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg whitespace-nowrap font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}