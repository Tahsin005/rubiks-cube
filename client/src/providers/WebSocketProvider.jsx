import { useAuth } from "@/hooks/useAuth";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { messagesApi } from "../redux/api/messagesApi";
import { notificationsApi } from "../redux/api/notificationsApi";
import { friendsApi } from "../redux/api/friendsApi";
import { usersApi } from "../redux/api/usersApi";

const WebSocketContext = createContext(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }) {
  const { token } = useAuth();
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map()); // map of eventType -> Set of callbacks

  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("[WS] Error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;
        const eventType = data.type;

        // Handle Global Cache Invalidations
        if (eventType === "CHAT_MESSAGE_RECEIVE") {
          dispatch(messagesApi.util.invalidateTags(['Conversation']));
        }
        if (eventType === "NOTIFICATION_RECEIVE") {
          dispatch(notificationsApi.util.invalidateTags(['Notification']));
        }
        if (eventType === "FRIEND_ONLINE_STATUS") {
          dispatch(friendsApi.util.invalidateTags(['Friends']));
          dispatch(usersApi.util.invalidateTags(['User']));
        }

        if (listenersRef.current.has(type)) {
          listenersRef.current.get(type).forEach((cb) => cb(payload));
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const sendMessage = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("[WS] Cannot send message, socket not connected");
    }
  }, []);

  const addListener = useCallback((type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(callback);
    return () => {
      const set = listenersRef.current.get(type);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listenersRef.current.delete(type);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
}
