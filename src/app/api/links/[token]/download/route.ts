import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import {
  consumeLink,
  getLinkByToken,
  getLinkStatus,
  removeLink,
  deleteFileRecord,
} from "@/lib/links";
import { openStoredFile, removeStoredFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params;
    if (!token) {
      return NextResponse.json({ error: "Missing link token." }, { status: 400 });
    }

    const link = await getLinkByToken(token);

    if (!link || !link.file) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    if (getLinkStatus(link) !== "active") {
      return NextResponse.json(
        { error: "This link has expired or reached its view limit." },
        { status: 410 }
      );
    }

    let opened: Awaited<ReturnType<typeof openStoredFile>>;
    try {
      opened = await openStoredFile(link.file.filename);
    } catch {
      return NextResponse.json({ error: "The shared file is no longer available." }, { status: 404 });
    }

    const { burned } = await consumeLink(token);

    if (burned) {
      await Promise.allSettled([
        removeLink(token),
        deleteFileRecord(link.file.id),
        removeStoredFile(link.file.filename),
      ]);
    }

    return new NextResponse(Readable.toWeb(opened.stream) as ReadableStream, {
      headers: {
        "Content-Type": link.file.mimeType || "application/octet-stream",
        "Content-Length": String(opened.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(link.file.originalName)}"`,
        "Cache-Control": "private, no-store",
        "Link-Views": String(link.views + 1),
      },
    });
  } catch (error) {
    console.error("Link download error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
