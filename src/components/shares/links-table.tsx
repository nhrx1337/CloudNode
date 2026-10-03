"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CopyIcon,
  CheckIcon,
  TrashIcon,
  ExternalLinkIcon,
  FlameIcon,
  SpinnerIcon,
} from "@/components/ui/icons";

export type ShareLink = {
  id: number;
  token: string;
  label: string;
  views: number;
  maxViews: number | null;
  burnAfterRead: boolean;
  expiresAt: string;
  createdAt: string;
  file: { id: number; originalName: string; size: number } | null;
};

type LinkStatus = "active" | "expired" | "exhausted";

function statusFor(link: ShareLink): LinkStatus {
  if (new Date(link.expiresAt).getTime() <= Date.now()) return "expired";
  if (link.maxViews !== null && link.views >= link.maxViews) return "exhausted";
  return "active";
}

function linkOrigin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function LinksTable({ links }: { links: ShareLink[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const hoverChip =
    "grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-zinc-800/60 hover:text-foreground";

  const copy = async (link: ShareLink) => {
    const url = `${linkOrigin()}/s/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const revoke = async (link: ShareLink) => {
    if (!window.confirm(`Revoke the link "${link.label}"?`)) return;
    setBusyId(link.id);
    try {
      await fetch(`/api/links/${link.token}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const status = statusFor(link);
        const viewsLabel =
          link.maxViews !== null ? `${link.views} / ${link.maxViews}` : `${link.views}`;
        return (
          <div
            key={link.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">
                  {link.label}
                </p>
                {link.burnAfterRead && (
                  <Badge tone="danger">
                    <FlameIcon width={12} height={12} />
                    burn
                  </Badge>
                )}
                <Badge
                  tone={
                    status === "active"
                      ? "success"
                      : status === "expired"
                        ? "warning"
                        : "danger"
                  }
                >
                  {status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {link.file?.originalName ?? "Deleted file"}
              </p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
                <span>{viewsLabel} views</span>
                <span>Expires {formatDate(link.expiresAt)}</span>
                <span className="font-mono">/{link.token.slice(0, 12)}…</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <a
                href={`/s/${link.token}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open share page"
                className={hoverChip}
              >
                <ExternalLinkIcon width={16} height={16} />
              </a>
              <button onClick={() => copy(link)} title="Copy URL" className={hoverChip}>
                {copiedId === link.id ? (
                  <CheckIcon width={16} height={16} className="text-emerald-400" />
                ) : (
                  <CopyIcon width={16} height={16} />
                )}
              </button>
              <button
                onClick={() => revoke(link)}
                disabled={busyId === link.id}
                title="Revoke"
                className={cn(hoverChip, "hover:text-red-400 hover:bg-red-950/40 disabled:opacity-50")}
              >
                {busyId === link.id ? (
                  <SpinnerIcon width={16} height={16} />
                ) : (
                  <TrashIcon width={16} height={16} />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}