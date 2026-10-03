import Link from "next/link";
import { LogoMark } from "@/components/ui/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface">
              <LogoMark className="text-accent" width={20} height={20} />
            </span>
            <span className="text-lg font-semibold tracking-tight">CloudNode</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-border py-5 text-center text-xs text-faint">
        CloudNode · self-hosted file sharing
      </footer>
    </div>
  );
}