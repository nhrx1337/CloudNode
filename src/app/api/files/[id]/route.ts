import { NextResponse, NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { filesTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const fileId = Number(id);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic boolean is required." }, { status: 400 });
    }

    const [updated] = await db
      .update(filesTable)
      .set({ isPublic: body.isPublic })
      .where(and(eq(filesTable.id, fileId), eq(filesTable.userId, user.id)))
      .returning({
        id: filesTable.id,
        originalName: filesTable.originalName,
        isPublic: filesTable.isPublic,
      });

    if (!updated) {
      return NextResponse.json({ error: "File not found or not yours." }, { status: 404 });
    }

    return NextResponse.json({ status: "success", file: updated });
  } catch (error) {
    console.error("File visibility error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}