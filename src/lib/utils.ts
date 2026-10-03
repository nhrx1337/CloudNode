export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "recently";
  if (seconds < 0) return "just now";

  const thresholds: [number, string][] = [
    [60, "second"],
    [60 * 60, "minute"],
    [60 * 60 * 24, "hour"],
    [60 * 60 * 24 * 7, "day"],
    [60 * 60 * 24 * 30.44, "week"],
    [60 * 60 * 24 * 365.25, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let divisor = 1;
  let unit = "second";
  for (const [threshold, label] of thresholds) {
    if (seconds < threshold) {
      unit = label;
      break;
    }
    divisor = threshold;
  }

  const value = Math.floor(seconds / divisor);
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export function getFileExtension(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && ext !== name ? ext : "file";
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

export function getSocketUrl(room: string): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    const base = process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
    return `${base}?room=${encodeURIComponent(room)}`;
  }
  const proto =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "wss"
      : "ws";
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `${proto}://${hostname}:1234?room=${encodeURIComponent(room)}`;
}
