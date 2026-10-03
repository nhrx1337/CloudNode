import { NextResponse } from "next/server";
import { revokeLink } from "@/lib/links";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { token } = await ctx.params;
    if (!token) {
      return NextResponse.json({ error: "Missing link token." }, { status: 400 });
    }

    const revoked = await revokeLink(token, user.id);
    if (!revoked) {
      return NextResponse.json({ error: "Link not found or not yours to revoke." }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "Link revoked." });
  } catch (error) {
    console.error("Revoke link error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}