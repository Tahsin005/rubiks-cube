import { db } from "../../config/db.js";
import { notifications } from "../../db/index.js";
import { eq, desc } from "drizzle-orm";

class NotificationsRepository {
    async createNotification(userId, type, message, relatedEntityId = null) {
        const result = await db.insert(notifications).values({
            userId,
            type,
            message,
            relatedEntityId
        }).returning();
        return result[0];
    }

    async getNotifications(userId, limit = 50) {
        return db.select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);
    }

    async markAsRead(userId) {
        await db.update(notifications)
            .set({ readAt: new Date() })
            .where(eq(notifications.userId, userId));
    }
}

export const notificationsRepository = new NotificationsRepository();
