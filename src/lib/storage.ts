import path from "node:path";
import fs from "node:fs/promises";
import { safeFileName } from "@/lib/tus";

export { safeFileName };

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function openStoredFile(filename: string) {
  const handle = await fs.open(path.join(UPLOAD_DIR, path.basename(filename)), "r");
  try {
    const { size } = await handle.stat();
    return { size, stream: handle.createReadStream() };
  } catch (error) {
    await handle.close().catch(() => undefined);
    throw error;
  }
}

export async function removeStoredFile(filename: string) {
  const safe = path.basename(filename);
  await fs.rm(path.join(UPLOAD_DIR, safe), { force: true });
  await fs.rm(path.join(UPLOAD_DIR, `${safe}.json`), { force: true }).catch(() => undefined);
}
