"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBytes, formatDate, cn } from "@/lib/utils";
import { CreateLinkDialog } from "./create-link-dialog";
import { FileThumb } from "./file-thumb";
import {
  DownloadIcon,
  TrashIcon,
  LinkIcon,
  SpinnerIcon,
  GlobeIcon,
  LockIcon,
} from "@/components/ui/icons";

export type DashboardFile = {
  id: number;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  isPublic: boolean;
  createdAt: string;
};

export function FilesTable({ files }: { files: DashboardFile[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [sharing, setSharing] = useState<DashboardFile | null>(null);

  const togglePublic = async (file: DashboardFile) => {
    setBusyId(file.id);
    try {
      await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !file.isPublic }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (file: DashboardFile) => {
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;
    setBusyId(file.id);
    try {
      await fetch(`/api/uploads/${file.filename}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden w-full items-center gap-4 border-b border-border bg-surface px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid md:grid-cols-[minmax(0,2fr)_90px_110px_120px_130px_96px]">
          <span>File</span>
          <span>Size</span>
          <span>Type</span>
          <span>Uploaded</span>
          <span>Visibility</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-border">
          {files.map((file) => (
            <li
              key={file.id}
              className="grid gap-3 rounded-lg px-5 py-4 transition-colors hover:bg-zinc-900/60 md:grid-cols-[minmax(0,2fr)_90px_110px_120px_130px_96px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileThumb name={file.originalName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.originalName}
                  </p>
                  <p className="truncate text-xs text-faint">{file.mimeType || "—"}</p>
                </div>
              </div>
              <span className="text-sm text-muted">{formatBytes(file.size)}</span>
              <span className="truncate text-sm text-muted">
                {file.originalName.split(".").pop()?.toUpperCase() || "—"}
              </span>
              <span className="text-sm text-muted">{formatDate(file.createdAt)}</span>

              <div>
                <button
                  onClick={() => togglePublic(file)}
                  disabled={busyId === file.id}
                  title={file.isPublic ? "Click to make private" : "Click to make public"}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {busyId === file.id ? (
                    <SpinnerIcon width={14} height={14} />
                  ) : file.isPublic ? (
                    <GlobeIcon width={14} height={14} className="text-accent" />
                  ) : (
                    <LockIcon width={14} height={14} />
                  )}
                  {file.isPublic ? "Public" : "Private"}
                  <span
                    className={cn(
                      "relative ml-1 inline-block h-4 w-7 rounded-full transition-colors",
                      file.isPublic ? "bg-accent" : "bg-zinc-700"
                    )}
                  >
                    <span
                      className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-200"
                      style={{ translate: file.isPublic ? "12px" : "0" }}
                    />
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <a
                  href={`/api/uploads/${file.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-zinc-800/60 hover:text-foreground"
                >
                  <DownloadIcon width={16} height={16} />
                </a>
                <button
                  onClick={() => setSharing(file)}
                  title="Share"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-zinc-800/60 hover:text-accent"
                >
                  <LinkIcon width={16} height={16} />
                </button>
                <button
                  onClick={() => remove(file)}
                  disabled={busyId === file.id}
                  title="Delete"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {sharing && (
        <CreateLinkDialog
          file={{ id: sharing.id, originalName: sharing.originalName }}
          onClose={() => setSharing(null)}
        />
      )}
    </>
  );
}