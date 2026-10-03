import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { filesTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { formatDate, formatBytes } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/ui/logout-button";
import { UserIcon, MailIcon, CalendarIcon, FileIcon, LogOutIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const myFiles = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.userId, user.id));

  const totalSize = myFiles.reduce((acc, f) => acc + f.size, 0);

  const rows = [
    { label: "User ID", value: `#${user.id}`, icon: UserIcon },
    { label: "Username", value: user.username || "Not set", icon: UserIcon },
    { label: "Email", value: user.email, icon: MailIcon },
    { label: "Member since", value: user.createdAt ? formatDate(user.createdAt) : "—", icon: CalendarIcon },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your account details and storage usage.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-gradient-to-r from-accent/15 to-transparent px-6 py-8">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-surface text-2xl font-semibold uppercase">
              {(user.username || user.email).charAt(0)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{user.username || "Member"}</h2>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
        </div>

        <dl className="divide-y divide-border px-6">
          {rows.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3.5">
              <dt className="flex items-center gap-2.5 text-sm text-muted">
                <Icon width={16} height={16} className="text-faint" />
                {label}
              </dt>
              <dd className="text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10">
            <FileIcon width={18} height={18} className="text-accent" />
          </span>
          <div>
            <p className="text-sm font-medium">{myFiles.length} files stored</p>
            <p className="text-xs text-muted">{formatBytes(totalSize)} in use</p>
          </div>
        </div>
        <Link href="/dashboard" className={buttonClasses("secondary", "sm")}>
          View files
        </Link>
      </Card>

      <Card className="flex items-center justify-between gap-4 p-5 border-red-500/20 bg-red-500/5">
        <div>
          <p className="text-sm font-medium text-foreground">Session Control</p>
          <p className="text-xs text-muted">Sign out of your account on this device.</p>
        </div>
        <LogoutButton />
      </Card>
    </div>
  );
}
