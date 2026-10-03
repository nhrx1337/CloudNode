"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button-styles";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface">
        <LogoMark className="text-accent" width={28} height={28} />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        An unexpected error occurred while rendering this page.
      </p>
      <button onClick={reset} className={`${buttonClasses("primary", "md")} mt-8`}>
        Try again
      </button>
    </div>
  );
}