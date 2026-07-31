import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { parse } from "url";
import { redis } from "../config/redis.js";
import { addClient, removeClient, getClients, sendToUser } from "./wsClients.js";
import { friendsRepository } from "../modules/friends/friends.repository.js";
import { joinQueue, leaveQueue } from "./matchmakingManager.js";
import { handleChallengeSend, handleChallengeAccept, handleChallengeDecline } from "./challengeManager.js";
import { handleReady, handleStateUpdate, handleSolve, handleDisconnect } from "./gameManager.js";
import { handleChatMessage, handleMarkRead } from "./messageManager.js";

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
        
        // Track online status in Redis only on first connection
        if (getClients(payload.id).size === 1) {
            redis.sadd("online_users", payload.id).then(async () => {
                try {
                    const friendsList = await friendsRepository.getFriends(payload.id, { status: 'accepted', limit: 1000 });
                    friendsList.forEach(f => {
                        sendToUser(f.friend.id, { 
                            type: "FRIEND_ONLINE_STATUS", 
                            payload: { username: payload.username, isOnline: true } 
                        });
                    });
                } catch (err) {
                    console.error("[WS] Error broadcasting online status:", err);
                }
            }).catch(err => console.error("[WS] Redis SADD error:", err));
        }
        
        console.log(`[WS] Connected: user=${payload.username} (${payload.id})`);

        // handlers
        ws.on("message", (data) => {
            handleMessage(ws, data);
        });

        ws.on("close", () => {
            removeClient(payload.id, ws);
            leaveQueue(payload.id);
            handleDisconnect(payload.id);
            
            // remove from Redis online list only on last disconnection
            if (getClients(payload.id).size === 0) {
                redis.srem("online_users", payload.id).then(async () => {
                    try {
                        const friendsList = await friendsRepository.getFriends(payload.id, { status: 'accepted', limit: 1000 });
                        friendsList.forEach(f => {
                            sendToUser(f.friend.id, { 
                                type: "FRIEND_ONLINE_STATUS", 
                                payload: { username: payload.username, isOnline: false } 
                            });
                        });
                    } catch (err) {
                        console.error("[WS] Error broadcasting offline status:", err);
                    }
                }).catch(err => console.error("[WS] Redis SREM error:", err));
            }
            
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
        // ranked Matchmaking
        case "MATCH_SEARCH_START":
            joinQueue(ws.user.id);
            break;
        case "MATCH_SEARCH_CANCEL":
            leaveQueue(ws.user.id);
            break;
        
        // friendly Challenges
        case "CHALLENGE_SEND":
            if (payload && payload.targetUsername) {
                handleChallengeSend(ws.user.id, payload.targetUsername);
            }
            break;
        case "CHALLENGE_ACCEPT":
            if (payload && payload.challengeId) {
                handleChallengeAccept(ws.user.id, payload.challengeId);
            }
            break;
        case "CHALLENGE_DECLINE":
            if (payload && payload.challengeId) {
                handleChallengeDecline(ws.user.id, payload.challengeId);
            }
            break;

        // in-Game
        case "MATCH_READY":
            handleReady(ws.user.id);
            break;
        case "MATCH_STATE_UPDATE":
            handleStateUpdate(ws.user.id, payload);
            break;
        case "MATCH_SOLVE":
            if (payload && payload.solveTimeMs) {
                handleSolve(ws.user.id, payload.solveTimeMs);
            }
            break;

        // chat
        case "CHAT_MESSAGE_SEND":
            if (payload && payload.targetUsername && payload.content) {
                handleChatMessage(ws, ws.user.id, payload.targetUsername, payload.content, payload.clientId);
            }
            break;
        case "CHAT_MESSAGE_READ":
            if (payload && payload.targetUsername) {
                handleMarkRead(ws, ws.user.id, payload.targetUsername);
            }
            break;

        default:
            ws.send(JSON.stringify({ type: "ERROR", message: `Unknown message type: ${type}` }));
    }
}
