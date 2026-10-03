import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import { filesTable, linksTable } from "@/db/schema";

type NewLink = {
  userId: number;
  fileId: number;
  label: string;
  expiresAt: Date;
  maxViews?: number | null;
  burnAfterRead: boolean;
};

export function generateToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function getPublicLinkUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base}/s/${token}`;
}

export async function createShareLink({
  userId,
  fileId,
  label,
  expiresAt,
  maxViews = null,
  burnAfterRead = false,
}: NewLink) {
  if (!Number.isFinite(maxViews) && maxViews !== null) {
    throw new Error("Invalid maxViews value.");
  }

  if (expiresAt.getTime() <= Date.now()) {
    throw new Error("Expiration must be in the future.");
  }

  const file = await db
    .select({ id: filesTable.id, userId: filesTable.userId, originalName: filesTable.originalName })
    .from(filesTable)
    .where(eq(filesTable.id, fileId))
    .limit(1);

  if (file.length === 0 || file[0].userId !== userId) {
    throw new Error("File not found.");
  }

  const [link] = await db
    .insert(linksTable)
    .values({
      userId,
      fileId,
      token: generateToken(),
      label: label.trim().slice(0, 120) || file[0].originalName,
      expiresAt,
      maxViews:
        maxViews && maxViews > 0 ? Math.floor(maxViews) : null,
      burnAfterRead,
    })
    .returning();

  return link;
}

export async function getLinkByToken(token: string) {
  const [link] = await db
    .select({
      id: linksTable.id,
      token: linksTable.token,
      label: linksTable.label,
      views: linksTable.views,
      maxViews: linksTable.maxViews,
      burnAfterRead: linksTable.burnAfterRead,
      expiresAt: linksTable.expiresAt,
      createdAt: linksTable.createdAt,
      file: {
        id: filesTable.id,
        originalName: filesTable.originalName,
        filename: filesTable.filename,
        mimeType: filesTable.mimeType,
        size: filesTable.size,
      },
    })
    .from(linksTable)
    .leftJoin(filesTable, eq(linksTable.fileId, filesTable.id))
    .where(eq(linksTable.token, token))
    .limit(1);

  return link ?? null;
}

export type LinkStatus = "active" | "expired" | "exhausted";

export function getLinkStatus(link: {
  views: number;
  maxViews: number | null;
  expiresAt: Date;
}): LinkStatus {
  if (link.expiresAt.getTime() <= Date.now()) return "expired";
  if (link.maxViews !== null && link.views >= link.maxViews) return "exhausted";
  return "active";
}

/** Marks the link as viewed and returns whether it should be burned. */
export async function consumeLink(token: string): Promise<{ burned: boolean }> {
  const [link] = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.token, token))
    .limit(1);

  if (!link) throw new Error("Link not found.");

  const status = getLinkStatus(link);
  if (status !== "active") throw new Error(`Link is ${status}.`);

  const burned = link.burnAfterRead;
  await db
    .update(linksTable)
    .set({ views: link.views + 1 })
    .where(eq(linksTable.id, link.id));

  return { burned };
}

export async function revokeLink(token: string, userId: number) {
  const [deleted] = await db
    .delete(linksTable)
    .where(and(eq(linksTable.token, token), eq(linksTable.userId, userId)))
    .returning({ id: linksTable.id });

  return deleted ?? null;
}

export async function removeLink(token: string) {
  await db.delete(linksTable).where(eq(linksTable.token, token));
}

export async function deleteFileRecord(fileId: number) {
  await db.delete(filesTable).where(eq(filesTable.id, fileId));
}

export async function getLinksForUser(userId: number) {
  return db
    .select({
      id: linksTable.id,
      token: linksTable.token,
      label: linksTable.label,
      views: linksTable.views,
      maxViews: linksTable.maxViews,
      burnAfterRead: linksTable.burnAfterRead,
      expiresAt: linksTable.expiresAt,
      createdAt: linksTable.createdAt,
      file: {
        id: filesTable.id,
        originalName: filesTable.originalName,
        size: filesTable.size,
        mimeType: filesTable.mimeType,
      },
    })
    .from(linksTable)
    .leftJoin(filesTable, eq(linksTable.fileId, filesTable.id))
    .where(eq(linksTable.userId, userId))
    .orderBy(linksTable.createdAt)
    .limit(100)
    .then((links) => links.filter((link) => link.file !== null) as (typeof links)[number][]);
}