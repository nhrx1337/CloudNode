import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { Server, FileKvStore } from "@tus/server";
import { FileStore } from "@tus/file-store";
import type { Upload } from "@tus/utils";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { filesTable } from "@/db/schema";
import { MAX_UPLOAD_SIZE } from "@/lib/upload";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const TUS_PATH = "/api/tus";
const TUS_EXPIRATION_MS = 24 * 60 * 60 * 1000;

type StoredUpload = {
  id: string;
  size?: number;
  offset: number;
  metadata?: Record<string, string | null>;
};

function fail(status: number, message: string): never {
  const error = new Error(message) as Error & { status_code: number; body: string };
  error.status_code = status;
  error.body = `${message}\n`;
  throw error;
}

export function safeFileName(name: string): string {
  return path.basename(name).replace(/[\x00-\x1f]/g, "").slice(0, 255);
}

function safeExtension(name: string): string {
  return path.extname(name).replace(/[^A-Za-z0-9.]/g, "").slice(0, 20);
}

function readOriginalName(metadata?: Record<string, string | null>): string {
  return safeFileName(metadata?.originalName || metadata?.filename || "") || "file";
}

function readMimeType(metadata?: Record<string, string | null>): string {
  const value = metadata?.mimeType || metadata?.filetype || "";
  return (value || "application/octet-stream").slice(0, 255);
}

async function statOrFail(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return fail(404, "The file for this url was not found");
  }
}

async function markCompleted(kv: FileKvStore, id: string, size: number) {
  await (async () => {
    const record = (await kv.get(id)) as Record<string, unknown> | undefined;
    if (!record) return;
    await kv.set(id, { ...record, offset: size } as unknown as Upload);
  })().catch(() => undefined);
}

async function finalizeUpload(upload: Upload, kv: FileKvStore) {
  const metadata = upload.metadata ?? {};
  const userId = Number(metadata.userId);
  const originalName = readOriginalName(metadata);
  const mimeType = readMimeType(metadata);
  const isPublic = metadata.isPublic === "true";
  const filePath = path.join(UPLOAD_DIR, upload.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    fail(400, "Invalid upload metadata.");
  }

  const stat = await statOrFail(filePath);
  const size = Math.min(stat.size, upload.size ?? stat.size);

  try {
    const [existing] = await db
      .select({ id: filesTable.id })
      .from(filesTable)
      .where(and(eq(filesTable.filename, upload.id), eq(filesTable.userId, userId)))
      .limit(1);

    if (existing) {
      await markCompleted(kv, upload.id, size);
      return existing;
    }

    const [file] = await db
      .insert(filesTable)
      .values({
        userId,
        filename: upload.id,
        originalName,
        mimeType,
        size,
        isPublic,
      })
      .returning();

    await markCompleted(kv, upload.id, size);
    return file;
  } catch (error) {
    await fs.rm(filePath, { force: true }).catch(() => undefined);
    await kv.delete(upload.id).catch(() => undefined);
    throw error;
  }
}

function createServer() {
  const kv = new FileKvStore(UPLOAD_DIR);

  const datastore = new FileStore({
    directory: UPLOAD_DIR,
    configstore: kv,
    expirationPeriodInMilliseconds: TUS_EXPIRATION_MS,
  });

  return new Server({
    path: TUS_PATH,
    datastore,
    maxSize: MAX_UPLOAD_SIZE,
    relativeLocation: true,
    respectForwardedHeaders: true,
    namingFunction: (_req, metadata) =>
      `${crypto.randomUUID()}${safeExtension(readOriginalName(metadata))}`,
    onUploadCreate: async (_req, upload) => {
      const user = await getCurrentUser();
      if (!user) fail(401, "You must be signed in to upload.");

      if (!upload.size) fail(400, "The file is empty.");
      if (upload.size > MAX_UPLOAD_SIZE) {
        fail(413, `File exceeds the ${MAX_UPLOAD_SIZE / 1024 ** 3} GB limit.`);
      }

      return {
        metadata: {
          userId: String(user.id),
          originalName: readOriginalName(upload.metadata),
          mimeType: readMimeType(upload.metadata),
          isPublic: upload.metadata?.isPublic === "true" ? "true" : "false",
        },
      };
    },
    onIncomingRequest: async (req, uploadId) => {
      const user = await getCurrentUser();
      if (!user) fail(401, "You must be signed in to upload.");

      if (req.method === "POST") return;

      const record = (await kv.get(uploadId)) as StoredUpload | undefined;
      if (!record || Number(record.metadata?.userId) !== user.id) {
        fail(404, "The file for this url was not found");
      }
    },
    onUploadFinish: async (_req, upload) => {
      await finalizeUpload(upload, kv);
      datastore.deleteExpired().catch(() => undefined);
      return {};
    },
  });
}

const globalRef = globalThis as unknown as {
  __cloudnodeTusServer?: Server;
};

export function getTusServer(): Server {
  if (!globalRef.__cloudnodeTusServer) {
    globalRef.__cloudnodeTusServer = createServer();
  }
  return globalRef.__cloudnodeTusServer;
}
