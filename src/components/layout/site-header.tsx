import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { buttonClasses } from "@/components/ui/button-styles";
import { LogoMark, UserIcon } from "@/components/ui/icons";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface">
            <LogoMark className="text-accent" width={20} height={20} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            CloudNode
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/feed" className={buttonClasses("ghost", "sm")}>
            Feed
          </Link>
          <Link href="/editor" className={buttonClasses("ghost", "sm")}>
            Editor
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={buttonClasses("secondary", "sm")}>
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-zinc-800/60"
              >
                <UserIcon width={14} height={14} className="text-muted" />
                <span className="max-w-[120px] truncate">
                  {user.username || user.email}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "sm")}>
                Sign in
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
