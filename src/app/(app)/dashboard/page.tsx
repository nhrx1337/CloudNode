import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { filesTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { formatBytes } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/card";
import { FilesTable } from "@/components/files/files-table";
import { PlusIcon, UploadCloudIcon, FileIcon, GlobeIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const files = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.userId, user.id))
    .orderBy(desc(filesTable.createdAt));

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const publicCount = files.filter((f) => f.isPublic).length;

  const stats = [
    { label: "Total files", value: String(files.length), icon: FileIcon },
    { label: "Storage used", value: formatBytes(totalSize), icon: UploadCloudIcon },
    { label: "Public files", value: String(publicCount), icon: GlobeIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Welcome back, <span className="font-medium text-foreground">{user.username || user.email}</span>.
          </p>
        </div>
        <Link href="/uploads" className={buttonClasses("primary", "md")}>
          <UploadCloudIcon width={16} height={16} />
          Upload file
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10">
              <Icon width={20} height={20} className="text-accent" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Your files</h2>
          <span className="text-xs text-faint">{files.length} item{files.length === 1 ? "" : "s"}</span>
        </div>

        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface">
              <UploadCloudIcon width={22} height={22} className="text-faint" />
            </span>
            <h3 className="mt-4 text-sm font-medium">No files yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Upload your first file to get started, or explore public files shared by the community.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/uploads" className={buttonClasses("primary", "md")}>
                Upload a file
              </Link>
              <Link href="/feed" className={buttonClasses("secondary", "md")}>
                Browse feed
              </Link>
            </div>
          </div>
        ) : (
          <FilesTable
            files={files.map((f) => ({
              id: f.id,
              originalName: f.originalName,
              filename: f.filename,
              mimeType: f.mimeType,
              size: f.size,
              isPublic: f.isPublic,
              createdAt: f.createdAt.toISOString(),
            }))}
          />
        )}
      </section>
    </div>
  );
}
