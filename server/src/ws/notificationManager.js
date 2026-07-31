import { sendToUser } from "./wsClients.js";
import { notificationsRepository } from "../modules/notifications/notifications.repository.js";

/**
 * Persists a notification to the database and broadcasts it via WebSocket.
 */
export async function sendNotification(userId, type, message, relatedEntityId = null) {
    try {
        const notification = await notificationsRepository.createNotification(
            userId,
            type,
            message,
            relatedEntityId
        );

        sendToUser(userId, {
            type: "NOTIFICATION_RECEIVE",
            payload: notification
        });
    } catch (err) {
        console.error("[WS] Error sending notification:", err);
    }
}
