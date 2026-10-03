import { getTusServer } from "@/lib/tus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function HEAD(req: Request) {
  return getTusServer().handleWeb(req);
}

export async function PATCH(req: Request) {
  return getTusServer().handleWeb(req);
}

export async function DELETE(req: Request) {
  return getTusServer().handleWeb(req);
}

export async function OPTIONS(req: Request) {
  return getTusServer().handleWeb(req);
}
