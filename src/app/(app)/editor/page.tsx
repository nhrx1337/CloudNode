import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { CodeIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const params = await searchParams;
  const room = params.room?.trim().replace(/[^\w-]/g, "").slice(0, 40) || "main";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CodeIcon width={22} height={22} className="text-accent" />
            Collaborative editor
          </h1>
        </div>
      </div>

      <CollaborativeEditor key={room} initialRoom={room} />
    </div>
  );
}
