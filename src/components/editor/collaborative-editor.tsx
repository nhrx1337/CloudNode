"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Environment } from "monaco-editor";
import type { OnMount } from "@monaco-editor/react";
import { getSocketUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, CheckIcon, LogoMark, SpinnerIcon } from "@/components/ui/icons";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "c",
  "cpp",
  "python",
  "json",
  "html",
  "css",
  "markdown",
  "yaml",
  "sql",
  "go",
  "java",
  "rust",
  "php",
] as const;

type ConnectionState = "connecting" | "online" | "offline";

type Props = {
  initialRoom: string;
};

export function CollaborativeEditor({ initialRoom }: Props) {
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState<string>("typescript");
  const [room, setRoom] = useState(initialRoom);
  const [peers, setPeers] = useState(1);
  const [conn, setConn] = useState<ConnectionState>("connecting");
  const [copied, setCopied] = useState(false);

  const modelRef = useRef<{
    getValue: () => string;
    setValue: (v: string) => void;
    pushUndoStop: () => void;
  } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const applyingRef = useRef(false);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load local Monaco with workers
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaderMod = await import("@monaco-editor/react");
      const monaco = await import("monaco-editor");

      const workerUrl = (name: string) => `/api/monaco/vs/${name}`;

      const environment: Environment = {
        getWorker(_id: string, label: string) {
          if (label === "json")
            return new Worker(workerUrl("language/json/json.worker.js"), { type: "module" });
          if (label === "css" || label === "scss" || label === "less")
            return new Worker(workerUrl("language/css/css.worker.js"), { type: "module" });
          if (label === "html" || label === "handlebars" || label === "razor")
            return new Worker(workerUrl("language/html/html.worker.js"), { type: "module" });
          if (label === "typescript" || label === "javascript")
            return new Worker(workerUrl("language/typescript/ts.worker.js"), { type: "module" });
          return new Worker(workerUrl("editor/editor.worker.js"), { type: "module" });
        },
      };

      (globalThis as { MonacoEnvironment?: Environment }).MonacoEnvironment = environment;

      loaderMod.loader.config({ monaco });
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // WebSocket room connection
  useEffect(() => {
    mountedRef.current = true;
    let socketClosed = false;

    const connect = () => {
      if (!mountedRef.current) return;
      setConn("connecting");

      let ws: WebSocket;
      try {
        ws = new WebSocket(getSocketUrl(room));
      } catch {
        setConn("offline");
        return;
      }
      socketRef.current = ws;

      ws.onopen = () => {
        setConn("online");
        ws.send(JSON.stringify({ type: "join", room }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "init" && typeof data.text === "string") {
            const model = modelRef.current;
            if (model && model.getValue() !== data.text) {
              applyingRef.current = true;
              model.setValue(data.text);
              applyingRef.current = false;
            }
          } else if (data.type === "text" && typeof data.text === "string") {
            const model = modelRef.current;
            if (model && model.getValue() !== data.text) {
              applyingRef.current = true;
              model.setValue(data.text);
              applyingRef.current = false;
            }
          } else if (data.type === "peers" && typeof data.count === "number") {
            setPeers(Math.max(1, data.count));
          }
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onclose = () => {
        if (socketClosed) return;
        setConn("offline");
        if (mountedRef.current) setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      socketClosed = true;
      mountedRef.current = false;
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
      if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [room]);

  const handleEditorMount: OnMount = (editor) => {
    const model = editor.getModel();
    if (!model) return;

    modelRef.current = {
      getValue: () => model.getValue(),
      setValue: (v: string) => model.setValue(v),
      pushUndoStop: () => {
        model.pushStackElement();
      },
    };

    // Send the initial snapshot so late joiners get the current content.
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "text", text: model.getValue() }));
    }

    model.onDidChangeContent(() => {
      if (applyingRef.current) return;

      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
      sendTimerRef.current = setTimeout(() => {
        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "text", text: model.getValue() }));
        }
      }, 150);
    });
  };

  const copyRoomLink = async () => {
    const url = `${window.location.origin}/editor?room=${encodeURIComponent(room)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Badge tone={conn === "online" ? "success" : conn === "connecting" ? "warning" : "danger"}>
            {conn === "online" ? "online" : conn === "connecting" ? "connecting…" : "offline"}
          </Badge>
          <Badge tone="neutral">{peers} {peers === 1 ? "client" : "clients"}</Badge>
        </div>

        <input
          value={room}
          onChange={(e) => setRoom(e.target.value.trim() || "main")}
          aria-label="Room name"
          className="h-9 w-40 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-accent/70"
          spellCheck={false}
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Language"
          className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-accent/70"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <button
          onClick={copyRoomLink}
          className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted transition-colors hover:bg-zinc-800/60 hover:text-foreground"
        >
          {copied ? (
            <CheckIcon width={14} height={14} className="text-emerald-400" />
          ) : (
            <CopyIcon width={14} height={14} />
          )}
          {copied ? "Copied" : "Copy room link"}
        </button>
      </div>

      {!ready ? (
        <div className="grid h-[62vh] place-items-center rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 text-sm text-muted">
            <SpinnerIcon width={22} height={22} className="text-accent" />
            Loading editor…
          </div>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-border"
          style={{ height: "62vh" }}
        >
          <Editor
            language={language}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              minimap: { enabled: true },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              padding: { top: 14, bottom: 14 },
              automaticLayout: true,
              tabSize: 2,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              renderLineHighlight: "all",
            }}
          />
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-faint">
        <LogoMark width={14} height={14} className="text-accent" />
        Typing is shared live with everyone in room &quot;{room}&quot;. Open the room link in another
        tab to collaborate.
      </p>
    </div>
  );
}
