import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";
const EMIT_TIMEOUT_MS = 8000;

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    return () => socket.disconnect();
  }, []);

  const emit = useCallback((event, data) => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        return resolve({ error: "Not connected to server." });
      }

      // Fail-safe: resolve with an error if server never responds
      const timer = setTimeout(
        () => resolve({ error: "Server did not respond. Please try again." }),
        EMIT_TIMEOUT_MS
      );

      socketRef.current.emit(event, data, (response) => {
        clearTimeout(timer);
        resolve(response ?? {});
      });
    });
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, connected, emit, on, off };
}
