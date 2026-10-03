import { getCurrentUser } from "@/lib/session";
import { getLinksForUser, getLinkStatus } from "@/lib/links";
import { LinksTable } from "@/components/shares/links-table";
import { LinkIcon } from "@/components/ui/icons";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

function logCause(err: unknown) {
  const cause = err instanceof Error ? (err.cause ?? err) : err;
  const detail =
    cause instanceof Error ? (cause.stack ?? cause.message) : String(cause);
  console.error("[shares] getLinksForUser failed:", detail);
}

function ErrorState() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Link manager</h1>
        <p className="mt-1 text-sm text-muted">
          Expiring and burn-after-read links created from your files.
        </p>
      </div>
      <Alert tone="error">
        Share links couldn&apos;t be loaded. The server logged the underlying
        database error — check the database connection and run{" "}
        <code className="font-mono">pnpm db:push</code> to make sure the
        <code className="font-mono"> links</code> table schema is up to date.
      </Alert>
    </div>
  );
}

export default async function SharesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let links: Awaited<ReturnType<typeof getLinksForUser>>;
  try {
    links = await getLinksForUser(user.id);
  } catch (err) {
    logCause(err);
    return <ErrorState />;
  }

  const activeCount = links.filter((l) => getLinkStatus(l) === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Link manager</h1>
        <p className="mt-1 text-sm text-muted">
          Expiring and burn-after-read links created from your files.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10">
          <LinkIcon width={18} height={18} className="text-accent" />
        </span>
        <div>
          <p className="font-medium">{links.length} total share links</p>
          <p className="text-xs text-muted">{activeCount} currently active · create links from the Dashboard</p>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface">
            <LinkIcon width={22} height={22} className="text-faint" />
          </span>
          <h3 className="mt-4 text-sm font-medium">No share links yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Open Dashboard, pick a file and hit the share icon to create an expiring or burn-after-read link.
          </p>
        </div>
      ) : (
        <LinksTable
          links={links.map((l) => ({
            id: l.id,
            token: l.token,
            label: l.label,
            views: l.views,
            maxViews: l.maxViews,
            burnAfterRead: l.burnAfterRead,
            expiresAt: l.expiresAt.toISOString(),
            createdAt: l.createdAt.toISOString(),
            file: l.file
              ? {
                  id: l.file.id,
                  originalName: l.file.originalName,
                  size: l.file.size,
                }
              : null,
          }))}
        />
      )}
    </div>
  );
}