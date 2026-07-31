import { db } from "../config/db.js";
import { friendMessages, users } from "../db/index.js";
import { eq, or, and, sql } from "drizzle-orm";
import { getClients, sendToUser } from "./wsClients.js";
import { sendNotification } from "./notificationManager.js";

export async function handleChatMessage(ws, senderId, targetUsername, content, clientId) {
    if (!content || !content.trim()) return;

    try {
        // resolve target user
        const targetUsers = await db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users).where(eq(users.username, targetUsername)).limit(1);
        if (targetUsers.length === 0) return;
        
        const targetId = targetUsers[0].id;
        
        const result = await db.insert(friendMessages).values({
            senderId,
            receiverId: targetId,
            content: content.trim(),
        }).returning();

        const savedMsg = result[0];

        // construct payload for client
        const messagePayload = {
            id: savedMsg.id,
            senderId: savedMsg.senderId,
            receiverId: savedMsg.receiverId,
            content: savedMsg.content,
            sentAt: savedMsg.sentAt,
            readAt: savedMsg.readAt,
            // include sender info for the receiver's UI
            senderUsername: ws.user.username,
            senderAvatarUrl: ws.user.avatarUrl
        };

        // send to receiver if online
        sendToUser(targetId, {
            type: "CHAT_MESSAGE_RECEIVE",
            payload: messagePayload
        });

        // echo back to sender for optimistic UI resolution
        ws.send(JSON.stringify({
            type: "CHAT_MESSAGE_ACK",
            payload: {
                ...messagePayload,
                clientId // echo this back so the UI knows which optimistic message to replace
            }
        }));
        
        // generate a notification for the recipient
        await sendNotification(
            targetId, 
            'MESSAGE', 
            `New message from ${ws.user.username}`, 
            ws.user.id
        );

    } catch (err) {
        console.error("[WS] Error sending chat message:", err);
    }
}

/**
 * Handles marking messages as read in real-time.
 */
export async function handleMarkRead(ws, readerId, senderUsername) {
    try {
        const senderUsers = await db.select({ id: users.id }).from(users).where(eq(users.username, senderUsername)).limit(1);
        if (senderUsers.length === 0) return;
        const senderId = senderUsers[0].id;

        // update DB
        await db.update(friendMessages).set({ readAt: new Date() }).where(
            and(
                eq(friendMessages.receiverId, readerId),
                eq(friendMessages.senderId, senderId),
                sql`${friendMessages.readAt} IS NULL`
            )
        );

        // notify the original sender that their messages were read, if online
        sendToUser(senderId, {
            type: "CHAT_READ_RECEIPT",
            payload: { readerUsername: ws.user.username }
        });
    } catch (err) {
        console.error("[WS] Error marking messages read:", err);
    }
}
