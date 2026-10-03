import Link from "next/link";
import { LogoMark } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button-styles";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface">
        <LogoMark className="text-accent" width={28} height={28} />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={`${buttonClasses("primary", "md")} mt-8`}>
        Back to home
      </Link>
    </div>
  );
}