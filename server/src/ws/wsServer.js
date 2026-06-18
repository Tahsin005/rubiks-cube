import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { parse } from "url";
import { addClient, removeClient } from "./wsClients.js";

/**
 * Attaches a WebSocket server to the given HTTP server.
 * Every incoming connection MUST supply a valid JWT via the `?token=` query param.
 * On success, the user's payload is attached to `ws.user`.
 *
 * @param {import("http").Server} httpServer
 */
export function setupWsServer(httpServer) {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws, req) => {
        // auth
        const { query } = parse(req.url, true);
        const token = query.token;

        if (!token) {
            ws.close(4001, "Missing token");
            return;
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            ws.close(4001, "Invalid or expired token");
            return;
        }

        ws.user = payload;
        addClient(payload.id, ws);
        console.log(`[WS] Connected: user=${payload.username} (${payload.id})`);

        // handlers
        ws.on("message", (data) => {
            handleMessage(ws, data);
        });

        ws.on("close", () => {
            removeClient(payload.id, ws);
            console.log(`[WS] Disconnected: user=${payload.username} (${payload.id})`);
        });

        ws.on("error", (err) => {
            console.error(`[WS] Error for user ${payload.id}:`, err.message);
        });

        // confirm successful connection
        ws.send(JSON.stringify({ type: "CONNECTED", message: "WebSocket connection established" }));
    });

    console.log("[WS] WebSocket server attached to HTTP server");
    return wss;
}

// central message router -> JSON: { type: string, payload: any }
function handleMessage(ws, data) {
    let msg;
    try {
        msg = JSON.parse(data);
    } catch {
        ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON" }));
        return;
    }

    const { type, payload } = msg;

    switch (type) {
        case "PING":
            ws.send(JSON.stringify({ type: "PONG" }));
            break;
        default:
            ws.send(JSON.stringify({ type: "ERROR", message: `Unknown message type: ${type}` }));
    }
}
