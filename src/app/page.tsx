import Link from "next/link";
import { eq, count, sum } from "drizzle-orm";
import { db } from "@/db";
import { filesTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { formatBytes } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button-styles";
import {
  GlobeIcon,
  CodeIcon,
  UploadCloudIcon,
  LogoMark,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  const [contributorRows, totalCountResult, totalSizeResult] = await Promise.all([
    db.query.usersTable.findMany({ columns: { id: true } }),
    db.select({ count: count() }).from(filesTable).where(eq(filesTable.isPublic, true)),
    db.select({ totalSize: sum(filesTable.size) }).from(filesTable).where(eq(filesTable.isPublic, true)),
  ]);

  const totalPublicSize = Number(totalSizeResult[0]?.totalSize ?? 0);
  const totalFiles = totalCountResult[0]?.count ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-zinc-800">
      <SiteHeader />

      <section className="flex-1 flex items-center border-b border-zinc-800/80">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 w-full">

          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            File sharing on your own infrastructure.
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            A minimalist workspace to upload files, publish a public feed,
            generate expiring links, and collaborate on documents in real time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            {currentUser ? (
              <Link href="/uploads" className={buttonClasses("primary", "lg")}>
                <UploadCloudIcon width={16} height={16} />
                Upload file
              </Link>
            ) : (
              <Link href="/register" className={buttonClasses("primary", "lg")}>
                Get started
              </Link>
            )}
            <Link href="/feed" className={buttonClasses("secondary", "lg")}>
              <GlobeIcon width={16} height={16} />
              Public feed
            </Link>
            <Link href="/editor" className={buttonClasses("ghost", "lg")}>
              <CodeIcon width={16} height={16} />
              Editor
            </Link>
          </div>

          <div className="mt-14 grid max-w-md grid-cols-3 gap-px bg-zinc-800/60 rounded-lg overflow-hidden border border-zinc-800 text-xs">
            {[
              { label: "FILES", value: String(totalFiles) },
              { label: "USERS", value: String(contributorRows.length) },
              { label: "STORAGE", value: formatBytes(totalPublicSize) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0f0f0f] px-4 py-3">
                <div className="text-zinc-500 font-mono tracking-wider text-[10px]">{label}</div>
                <div className="mt-1 font-mono font-medium text-zinc-200">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800/85 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-500 font-mono sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <LogoMark width={14} height={14} className="text-zinc-300" />
            <span className="font-medium text-zinc-300">CloudNode</span>
            <span>// self-hosted</span>
          </div>
          <div>
            © {new Date().getFullYear()} — local storage only.
          </div>
        </div>
      </footer>
    </div>
  );
}
