/** @type {Map<string, Set<import("ws").WebSocket>>} */
const clients = new Map();

// add a new client
export function addClient(userId, ws) {
    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);
}

export function removeClient(userId, ws) {
    const sockets = clients.get(userId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) clients.delete(userId);
}

// returns all active sockets for a given user
export function getClients(userId) {
    return clients.get(userId) ?? new Set();
}

// broadcast a JSON message to all sockets of a given user
export function sendToUser(userId, payload) {
    const sockets = getClients(userId);
    const data = JSON.stringify(payload);
    for (const ws of sockets) {
        if (ws.readyState === ws.OPEN) {
            ws.send(data);
        }
    }
}

// broadcast a JSON message to all connected clients
export function broadcast(payload, excludeUserId = null) {
    const data = JSON.stringify(payload);
    for (const [userId, sockets] of clients) {
        if (userId === excludeUserId) continue;
        for (const ws of sockets) {
            if (ws.readyState === ws.OPEN) {
                ws.send(data);
            }
        }
    }
}
