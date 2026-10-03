"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/ui/logout-button";
import {
  LogoMark,
  GlobeIcon,
  DashboardIcon,
  UploadCloudIcon,
  LinkIcon,
  CodeIcon,
  UserIcon,
} from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: GlobeIcon },
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/uploads", label: "Upload", icon: UploadCloudIcon },
  { href: "/shares", label: "Link manager", icon: LinkIcon },
  { href: "/editor", label: "Editor", icon: CodeIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

type AppShellProps = {
  user: { username: string | null; email: string };
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface-2 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface">
            <Link href="/" title="Home">
              <LogoMark className="text-accent" width={20} height={20} />
            </Link>
          </span>
          <span className="text-base font-semibold tracking-tight">CloudNode</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-zinc-800/60 hover:text-foreground"
                )}
              >
                <Icon width={18} height={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-xs font-semibold uppercase">
              {(user.username || user.email).charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.username || "Member"}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <LogoutButton/>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center gap-2 overflow-x-auto px-4">
            <span className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface">
              <LogoMark className="text-accent" width={16} height={16} />
            </span>
            {NAV_ITEMS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-zinc-800/60 hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>

        <footer className="border-t border-border px-4 py-5 text-center text-xs text-faint">
          CloudNode · self-hosted file sharing · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
