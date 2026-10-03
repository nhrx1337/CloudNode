import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "warning" | "info";

const toneClasses: Record<Tone, string> = {
  error: "border-red-900/60 bg-red-950/30 text-red-300",
  success: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300",
  warning: "border-amber-900/60 bg-amber-950/30 text-amber-300",
  info: "border-indigo-900/60 bg-indigo-950/30 text-indigo-300",
};

export function Alert({
  tone = "info",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}