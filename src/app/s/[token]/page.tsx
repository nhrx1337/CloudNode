import type { Metadata } from "next";
import Link from "next/link";
import { getLinkByToken, getLinkStatus, getPublicLinkUrl } from "@/lib/links";
import { formatBytes, formatDate } from "@/lib/utils";
import { LogoMark, DownloadIcon, ClockIcon, FlameIcon, EyeIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const link = await getLinkByToken(token);
  if (!link) return { title: "Link not found" };
  return { title: link.label };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const link = await getLinkByToken(token);

  if (!link || !link.file) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <h1 className="text-xl font-semibold">This link no longer exists</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            The share link was removed, burned or never existed. Ask the sender for a new one.
          </p>
        </div>
      </Shell>
    );
  }

  const status = getLinkStatus(link);
  const expired = status !== "active";

  return (
    <Shell>
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">{link.label}</h1>
              <p className="mt-1 truncate text-sm text-muted">{link.file.originalName}</p>
            </div>
            {link.burnAfterRead && (
              <Badge tone="danger">
                <FlameIcon width={12} height={12} />
                burn after read
              </Badge>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm sm:grid-cols-4">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <DownloadIcon width={13} height={13} className="text-faint" />
                Size
              </dt>
              <dd className="mt-1 font-medium">{formatBytes(link.file.size)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <EyeIcon width={13} height={13} className="text-faint" />
                Views
              </dt>
              <dd className="mt-1 font-medium">
                {link.views}
                {link.maxViews !== null ? ` / ${link.maxViews}` : ""}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <ClockIcon width={13} height={13} className="text-faint" />
                Expires
              </dt>
              <dd className="mt-1 font-medium">{formatDate(link.expiresAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Type</dt>
              <dd className="mt-1 truncate font-medium">{link.file.mimeType || "file"}</dd>
            </div>
          </dl>

          <div className="mt-6">
            {expired ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-300">
                {status === "expired" ? "This link has expired." : "This link has reached its view limit."}
              </div>
            ) : (
              <a
                href={`/api/links/${link.token}/download`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent/90"
              >
                <DownloadIcon width={18} height={18} />
                Download file
                {link.burnAfterRead ? " — this link will self-destruct" : ""}
              </a>
            )}
          </div>
        </div>

        <a
          href={getPublicLinkUrl(link.token)}
          className="block text-center font-mono text-xs text-faint hover:text-muted"
        >
          {getPublicLinkUrl(link.token)}
        </a>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface">
              <LogoMark className="text-accent" width={20} height={20} />
            </span>
            <span className="text-lg font-semibold tracking-tight">CloudNode</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 items-start px-4 py-10">
        {children}
      </main>
      <footer className="py-6 text-center text-xs text-faint">CloudNode · shared via expiring link</footer>
    </div>
  );
}