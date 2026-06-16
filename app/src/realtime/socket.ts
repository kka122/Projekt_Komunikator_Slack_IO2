import {io, type Socket} from "socket.io-client";
import {BACKEND_ORIGIN} from "../config/api.ts";

/**
 * The process-wide Socket.IO client. Created lazily and reused, so every part of
 * the app shares one connection.
 */
let socket: Socket | null = null;

/**
 * Get the shared Socket.IO client, creating it on first use.
 *
 * The client is *not* connected automatically — {@link RealtimeProvider} owns
 * the connection lifecycle. Key options:
 * - `withCredentials` sends the httpOnly JWT cookie on the handshake, which the
 *   backend verifies to authenticate the socket (same session as REST).
 * - `transports: ["websocket", "polling"]` prefers a WebSocket but falls back to
 *   HTTP long-polling if the upgrade fails. The backend runs a single process,
 *   so polling needs no sticky sessions.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_ORIGIN, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 500,
    });
  }
  return socket;
}
