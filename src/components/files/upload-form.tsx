"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import { cn, formatBytes } from "@/lib/utils";
import {
  MAX_UPLOAD_SIZE,
  TUS_CHUNK_SIZE,
  TUS_ENDPOINT,
  TUS_RETRY_DELAYS,
} from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { UploadCloudIcon, FileIcon, CheckIcon, SpinnerIcon, GlobeIcon, LockIcon } from "@/components/ui/icons";

export function UploadForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const taskRef = useRef<tus.Upload | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const selectFile = (next: File | undefined | null) => {
    setError("");
    setSuccess(null);
    if (!next) return;
    if (next.size > MAX_UPLOAD_SIZE) {
      setError(`File exceeds the ${formatBytes(MAX_UPLOAD_SIZE)} limit.`);
      return;
    }
    setFile(next);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    selectFile(e.dataTransfer.files?.[0]);
  }, []);

  const reset = () => {
    setUploading(false);
    setProgress(0);
    taskRef.current = null;
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;

    setError("");
    setSuccess(null);
    setProgress(0);
    setUploading(true);

    const name = file.name;
    const task = new tus.Upload(file, {
      endpoint: `${window.location.origin}${TUS_ENDPOINT}`,
      chunkSize: TUS_CHUNK_SIZE,
      retryDelays: TUS_RETRY_DELAYS,
      storeFingerprintForResuming: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        originalName: name,
        mimeType: file.type || "application/octet-stream",
        isPublic: String(isPublic),
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal > 0) {
          setProgress(Math.round((bytesUploaded * 100) / bytesTotal));
        }
      },
      onError: (err) => {
        reset();
        setError(err.message || "Upload failed.");
      },
      onSuccess: () => {
        reset();
        setSuccess(name);
        setFile(null);
        setIsPublic(false);
        if (fileInput.current) fileInput.current.value = "";
        router.refresh();
      },
    });

    taskRef.current = task;

    try {
      const previous = await task.findPreviousUploads();
      if (previous.length > 0) {
        task.resumeFromPreviousUpload(previous[0]);
      }
      task.start();
    } catch {
      reset();
      setError("Something went wrong while starting the upload.");
    }
  };

  const cancel = async () => {
    const task = taskRef.current;
    if (!task) return;
    reset();
    try {
      await task.abort(true);
    } catch {
      return;
    }
  };

  return (
    <form onSubmit={upload} className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {success && (
        <Alert tone="success" className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckIcon width={16} height={16} />
            <strong className="truncate">{success}</strong> uploaded successfully.
          </span>
          <Link href="/dashboard" className="shrink-0 font-medium underline underline-offset-4">
            View in dashboard
          </Link>
        </Alert>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        className={cn(
          "relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border bg-surface hover:border-zinc-600"
        )}
      >
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          onChange={(e) => selectFile(e.target.files?.[0])}
        />
        {file ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-card">
              <FileIcon width={22} height={22} className="text-accent" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted">{formatBytes(file.size)}</p>
            </div>
            <p className="text-xs text-faint">Click or drop a different file to replace it</p>
          </>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10">
              <UploadCloudIcon width={24} height={24} className="text-accent" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag &amp; drop a file here
              </p>
              <p className="mt-1 text-xs text-muted">
                or click to browse · max {formatBytes(MAX_UPLOAD_SIZE)}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10">
            {isPublic ? (
              <GlobeIcon width={16} height={16} className="text-accent" />
            ) : (
              <LockIcon width={16} height={16} className="text-muted" />
            )}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Public file</p>
            <p className="text-xs text-muted">
              {isPublic
                ? "Visible to everyone on the home feed."
                : "Only you can see this file."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            isPublic ? "bg-accent" : "bg-zinc-700"
          )}
        >
          <span
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
            style={{ translate: isPublic ? "20px" : "0" }}
          />
        </button>
      </div>

      {uploading ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-accent transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <SpinnerIcon width={16} height={16} />
              Uploading {progress}% · chunked &amp; resumable
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <Button type="submit" size="lg" disabled={!file} className="w-full">
          {file ? (
            <>
              <UploadCloudIcon width={18} height={18} />
              Upload {file.name}
            </>
          ) : (
            "Select a file to upload"
          )}
        </Button>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-faint">
        <LockIcon width={13} height={13} />
        Files are stored privately on this server.
      </p>
    </form>
  );
}
