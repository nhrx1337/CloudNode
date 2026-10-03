"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { XIcon, FlameIcon, CheckIcon, CopyIcon, SpinnerIcon, LinkIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const EXPIRY_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
];

type Props = {
  file: { id: number; originalName: string };
  onClose: () => void;
};

export function CreateLinkDialog({ file, onClose }: Props) {
  const [label, setLabel] = useState(file.originalName);
  const [hours, setHours] = useState(24);
  const [maxViews, setMaxViews] = useState("");
  const [burn, setBurn] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          label,
          expiresHours: hours,
          maxViews: maxViews ? Number(maxViews) : null,
          burnAfterRead: burn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the link.");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10">
              <LinkIcon width={16} height={16} className="text-accent" />
            </span>
            <h2 className="text-sm font-semibold">New share link</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-zinc-800/60 hover:text-foreground">
            <XIcon width={17} height={17} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {!url ? (
            <form onSubmit={create} className="space-y-4">
              {error && <Alert tone="error">{error}</Alert>}

              <div>
                <Label htmlFor="link-label">Label</Label>
                <Input
                  id="link-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1.5"
                  maxLength={120}
                />
              </div>

              <div>
                <Label>Expires after</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setHours(opt.hours)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                        hours === opt.hours
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted hover:bg-zinc-800/60"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="link-views">Max views (optional)</Label>
                <Input
                  id="link-views"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10">
                    <FlameIcon width={16} height={16} className="text-red-400" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">Burn after read</span>
                    <span className="block text-xs text-muted">
                      Link self-destructs after the first download.
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={burn}
                  onChange={(e) => setBurn(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <SpinnerIcon width={16} height={16} /> : <LinkIcon width={16} height={16} />}
                {busy ? "Creating…" : "Create link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert tone="success" className="inline-flex items-center gap-2">
                <CheckIcon width={16} height={16} />
                Share link created.
              </Alert>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
                  {url}
                </code>
                <Button type="button" variant="secondary" size="icon" onClick={copy} title="Copy link">
                  {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
                </Button>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="secondary" className="w-full">
                  Open share page
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
