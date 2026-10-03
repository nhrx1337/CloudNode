import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { filesTable, linksTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { openStoredFile, removeStoredFile, safeFileName } from "@/lib/storage";

async function resolveParams(
  params: Promise<{ filename: string }>
): Promise<string> {
  const { filename } = await params;
  return safeFileName(filename);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ filename: string }> }
) {
  try {
    const filename = await resolveParams(ctx.params);

    const [file] = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.filename, filename))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const user = await getCurrentUser();

    if (!file.isPublic) {
      if (!user || user.id !== file.userId) {
        return NextResponse.json({ error: "This file is private." }, { status: 403 });
      }
    }

    let opened: Awaited<ReturnType<typeof openStoredFile>>;
    try {
      opened = await openStoredFile(file.filename);
    } catch {
      return NextResponse.json({ error: "File not found on disk." }, { status: 404 });
    }

    const disposition = file.mimeType.startsWith("text/")
      ? "inline"
      : "attachment";

    return new NextResponse(
      Readable.toWeb(opened.stream) as ReadableStream,
      {
        headers: {
          "Content-Type": file.mimeType || "application/octet-stream",
          "Content-Length": String(opened.size),
          "Cache-Control": file.isPublic
            ? "public, max-age=3600"
            : "private, no-store",
          "Content-Disposition": `${disposition}; filename="${encodeURIComponent(file.originalName)}"`,
        },
      }
    );
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ filename: string }> }
) {
  try {
    const filename = await resolveParams(ctx.params);
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const [file] = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.filename, filename))
      .limit(1);

    if (!file || file.userId !== user.id) {
      return NextResponse.json({ error: "File not found or not yours to delete." }, { status: 404 });
    }

    await removeStoredFile(file.filename);

    await db.delete(linksTable).where(eq(linksTable.fileId, file.id));
    await db.delete(filesTable).where(eq(filesTable.id, file.id));

    return NextResponse.json({ status: "success", message: "File deleted." });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
