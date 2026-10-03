import { UploadForm } from "@/components/files/upload-form";
import { ShieldIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload a file</h1>
        <p className="mt-1 text-sm text-muted">
          Store it privately on this server, or share it with the public feed.
        </p>
      </div>

      <UploadForm />

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        <ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-muted">
          Files are stored on your own server. Private files are only visible to you,
          and share links are the only way to grant access.
        </p>
      </div>
    </div>
  );
}