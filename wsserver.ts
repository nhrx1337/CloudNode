import { WebSocketServer, WebSocket } from "ws";

type Room = { text: string; clients: Set<WebSocket> };

const rooms = new Map<string, Room>();
const socketRooms = new WeakMap<WebSocket, string>();

const PORT = Number(process.env.WS_PORT ?? 1234);
const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

wss.on("listening", () => {
  console.log(`[cloudnode-ws] collaboration server listening on ws://0.0.0.0:${PORT}`);
});

wss.on("error", (err) => {
  console.error("[cloudnode-ws] server error:", err);
});

wss.on("connection", (socket: WebSocket) => {
  joinRoom(socket, "main", true);

  socket.on("message", (raw) => {
    let data: unknown;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (!isRecord(data)) return;

    if (data.type === "join" && typeof data.room === "string") {
      leaveRoom(socket);
      joinRoom(socket, data.room, true);
      return;
    }

    const room = rooms.get(socketRooms.get(socket) ?? "");
    if (!room) return;

    if (data.type === "text" && typeof data.text === "string") {
      room.text = data.text.slice(0, 1_000_000);
      for (const client of room.clients) {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          send(client, { type: "text", text: room.text });
        }
      }
    }
  });

  socket.on("close", () => {
    leaveRoom(socket);
  });

  socket.on("error", () => {
    socket.terminate();
  });
});

function joinRoom(socket: WebSocket, name: string, sendInit: boolean) {
  const normalized = name.replace(/[^\w-]/g, "").slice(0, 40) || "main";
  socketRooms.set(socket, normalized);

  let room = rooms.get(normalized);
  if (!room) {
    room = { text: "", clients: new Set() };
    rooms.set(normalized, room);
  }
  room.clients.add(socket);

  if (sendInit) {
    send(socket, { type: "init", text: room.text });
  }
  broadcastCount(room);
}

function leaveRoom(socket: WebSocket) {
  const name = socketRooms.get(socket);
  if (!name) return;

  const room = rooms.get(name);
  if (!room) return;

  socketRooms.delete(socket);
  room.clients.delete(socket);
  broadcastCount(room);

  if (room.clients.size === 0) {
    rooms.delete(name);
  }
}

function broadcastCount(room: Room) {
  const payload = JSON.stringify({ type: "peers", count: room.clients.size });
  for (const client of room.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function send(socket: WebSocket, data: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function shutdown() {
  console.log("[cloudnode-ws] shutting down.");
  for (const client of wss.clients) client.terminate();
  wss.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
