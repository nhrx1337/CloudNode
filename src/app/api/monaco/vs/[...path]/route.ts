import { readFile } from "node:fs/promises";
import { join, normalize, resolve, sep } from "node:path";
import { NextRequest, NextResponse } from "next/server";

const MONACO_ROOT = join(
  process.cwd(),
  "node_modules",
  "monaco-editor",
  "esm",
  "vs",
);

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  if (path.length === 0 || !path[0]) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rel = path.join("/");
  const filePath = normalize(join(MONACO_ROOT, rel));

  if (!filePath.startsWith(resolve(MONACO_ROOT) + sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const name = filePath.split(sep).pop() ?? "";
  if (!name.endsWith(".js")) {
    return new NextResponse("Unsupported file type", { status: 415 });
  }

  try {
    const body = await readFile(filePath);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=86400, immutable",
        "Service-Worker-Allowed": "/",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}