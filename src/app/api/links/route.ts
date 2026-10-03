import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createShareLink, getPublicLinkUrl } from "@/lib/links";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const fileId = Number(body.fileId);
    const expiresHours = Number(body.expiresHours);
    const burnAfterRead = body.burnAfterRead === true;
    const label = typeof body.label === "string" ? body.label : "";
    const maxViewsValue = body.maxViews;

    const maxViews =
      maxViewsValue === null || maxViewsValue === undefined || maxViewsValue === ""
        ? null
        : Number(maxViewsValue);

    if (!Number.isInteger(fileId) || fileId <= 0) {
      return NextResponse.json({ error: "A valid file id is required." }, { status: 400 });
    }

    if (!Number.isFinite(expiresHours) || expiresHours <= 0 || expiresHours > 24 * 365) {
      return NextResponse.json({ error: "A valid expiry duration is required." }, { status: 400 });
    }

    if (maxViews !== null && (!Number.isFinite(maxViews) || maxViews < 1)) {
      return NextResponse.json({ error: "Max views must be a positive number." }, { status: 400 });
    }

    try {
      const link = await createShareLink({
        userId: user.id,
        fileId,
        label,
        expiresAt: new Date(Date.now() + expiresHours * 3600 * 1000),
        maxViews,
        burnAfterRead,
      });

      return NextResponse.json(
        {
          status: "success",
          url: getPublicLinkUrl(link.token),
          token: link.token,
        },
        { status: 201 }
      );
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Could not create the link." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}