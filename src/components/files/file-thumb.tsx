import { getFileExtension } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EXT_TONES: Record<string, string> = {
  image: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  video: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  audio: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  zip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  pdf: "bg-red-500/15 text-red-300 border-red-500/30",
  doc: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  code: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
const DOC_EXTS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "md"];
const CODE_EXTS = [
  "ts", "js", "tsx", "jsx", "py", "go", "rs", "c", "cpp", "h", "java",
  "rb", "php", "css", "scss", "html", "json", "yml", "yaml", "sh", "sql",
];
const ARCHIVE_EXTS = ["zip", "rar", "7z", "tar", "gz", "bz2", "tgz"];
const AUDIO_EXTS = ["mp3", "wav", "ogg", "flac", "aac"];

function toneFor(ext: string): keyof typeof EXT_TONES {
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (ARCHIVE_EXTS.includes(ext)) return "zip";
  if (ext === "pdf") return "pdf";
  if (DOC_EXTS.includes(ext)) return "doc";
  if (CODE_EXTS.includes(ext)) return "code";
  return "pdf";
}

const VIDEO_EXTS = ["mp4", "webm", "mkv", "mov", "avi"];
const typeFor = (ext: string): "video" | keyof typeof EXT_TONES =>
  VIDEO_EXTS.includes(ext) ? "video" : toneFor(ext);

export function FileThumb({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const ext = getFileExtension(name);
  const tone = typeFor(ext);
  const toneClass = tone === "video" ? EXT_TONES.video : EXT_TONES[tone];

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg border font-semibold uppercase tracking-wide",
        size === "sm" && "h-9 w-9 text-[9px]",
        size === "md" && "h-11 w-11 text-[10px]",
        size === "lg" && "h-14 w-14 text-xs",
        toneClass
      )}
    >
      {ext.slice(0, 4)}
    </div>
  );
}