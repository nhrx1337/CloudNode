  import Link from "next/link";
import { eq, desc, count } from "drizzle-orm";

import { db } from "@/db";
import { filesTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { formatBytes, timeAgo, cn } from "@/lib/utils";

import { buttonClasses } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/card";
import { FileThumb } from "@/components/files/file-thumb";
import {
  DownloadIcon,
  GlobeIcon,
  UploadCloudIcon,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const [publicFiles, totalCountResult] = await Promise.all([
    db.query.filesTable.findMany({
      where: eq(filesTable.isPublic, true),
      with: {
        user: true,
      },
      orderBy: [desc(filesTable.createdAt)],
      limit: ITEMS_PER_PAGE,
      offset,
    }),

    db
      .select({
        count: count(),
      })
      .from(filesTable)
      .where(eq(filesTable.isPublic, true)),
  ]);

  const totalFiles = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Public files
          </h1>

          <p className="mt-1 text-sm text-muted">
            Browse files shared publicly by the community.
          </p>
        </div>

        {currentUser && (
          <Link
            href="/uploads"
            className={buttonClasses("primary", "md")}
          >
            <UploadCloudIcon width={16} height={16} />
            Upload file
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">
          Latest uploads
        </h2>

        <span className="text-xs text-faint">
          Page {page} of {Math.max(1, totalPages)} · {totalFiles} item
          {totalFiles === 1 ? "" : "s"}
        </span>
      </div>

      {publicFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface">
            <GlobeIcon width={22} height={22} className="text-faint" />
          </span>

          <h3 className="mt-4 text-sm font-medium">
            No public files found
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            There are no publicly shared files yet. Be the first one to upload
            a file.
          </p>

          <div className="mt-5 flex justify-center gap-2">
            {currentUser ? (
              <Link
                href="/uploads"
                className={buttonClasses("primary", "md")}
              >
                Upload a file
              </Link>
            ) : (
              <Link
                href="/register"
                className={buttonClasses("primary", "md")}
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {publicFiles.map((file) => (
              <Card
                key={file.id}
                className="flex min-h-[150px] flex-col justify-between p-4 transition-colors hover:border-accent/50"
              >
                <div className="flex items-start gap-3">
                  <FileThumb name={file.originalName} />

                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-sm font-medium"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </h3>

                    <p className="mt-1 truncate text-xs text-muted">
                      Shared by{" "}
                      <span className="text-foreground">
                        {file.user?.username ||
                          file.user?.email ||
                          "anonymous"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{formatBytes(file.size)}</span>
                    <span>·</span>
                    <span>{timeAgo(file.createdAt)}</span>
                  </div>

                  <a
                    href={`/api/uploads/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download file"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-accent/50 hover:text-foreground"
                  >
                    <DownloadIcon width={15} height={15} />
                  </a>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 ? (
                <Link
                  href={`/feed?page=${page - 1}`}
                  className={buttonClasses("secondary", "sm")}
                >
                  ← Previous
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonClasses("secondary", "sm"),
                    "pointer-events-none opacity-50"
                  )}
                >
                  ← Previous
                </span>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => {
                    const isCurrent = pageNumber === page;

                    return (
                      <Link
                        key={pageNumber}
                        href={`/feed?page=${pageNumber}`}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border text-xs transition-colors",
                          isCurrent
                            ? "border-accent bg-accent/10 text-foreground"
                            : "border-border bg-card text-muted hover:border-accent/50 hover:text-foreground"
                        )}
                      >
                        {pageNumber}
                      </Link>
                    );
                  }
                )}
              </div>

              {page < totalPages ? (
                <Link
                  href={`/feed?page=${page + 1}`}
                  className={buttonClasses("secondary", "sm")}
                >
                  Next →
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonClasses("secondary", "sm"),
                    "pointer-events-none opacity-50"
                  )}
                >
                  Next →
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
