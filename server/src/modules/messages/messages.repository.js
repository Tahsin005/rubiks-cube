import { db } from "../../config/db.js";
import { friendMessages, users } from "../../db/index.js";
import { eq, or, and, desc, sql, asc } from "drizzle-orm";

class MessagesRepository {
    async getConversations(userId) {
        // Query to get active conversations with last message time and unread count
        const query = sql`
            WITH Conversations AS (
                SELECT 
                    CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END AS friend_id,
                    content as last_message,
                    sent_at as last_message_at,
                    sender_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END 
                        ORDER BY sent_at DESC
                    ) as rn,
                    COUNT(CASE WHEN receiver_id = ${userId} AND read_at IS NULL THEN 1 END) OVER (
                        PARTITION BY CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END
                    ) as unread_count
                FROM ${friendMessages}
                WHERE sender_id = ${userId} OR receiver_id = ${userId}
            )
            SELECT 
                c.friend_id,
                u.username as friend_username,
                u.avatar_url as friend_avatar_url,
                c.last_message,
                c.last_message_at,
                c.sender_id,
                c.unread_count
            FROM Conversations c
            JOIN ${users} u ON u.id = c.friend_id
            WHERE c.rn = 1
            ORDER BY c.last_message_at DESC;
        `;

        const result = await db.execute(query);
        const rows = result.rows || result;
        return rows.map(r => ({
            friendId: r.friend_id,
            friendUsername: r.friend_username,
            friendAvatarUrl: r.friend_avatar_url,
            lastMessage: r.last_message,
            lastMessageAt: r.last_message_at,
            isLastMessageFromMe: r.sender_id === userId,
            unreadCount: Number(r.unread_count)
        }));
    }

    async getMessagesWithUser(userId, friendId, { limit = 50, offset = 0 }) {
        const query = await db
            .select({
                id: friendMessages.id,
                senderId: friendMessages.senderId,
                receiverId: friendMessages.receiverId,
                content: friendMessages.content,
                sentAt: friendMessages.sentAt,
                readAt: friendMessages.readAt
            })
            .from(friendMessages)
            .where(
                or(
                    and(eq(friendMessages.senderId, userId), eq(friendMessages.receiverId, friendId)),
                    and(eq(friendMessages.senderId, friendId), eq(friendMessages.receiverId, userId))
                )
            )
            .orderBy(desc(friendMessages.sentAt))
            .limit(limit)
            .offset(offset);
        
        // Reverse so they are in chronological order for chat UI
        return query.reverse();
    }

    async markMessagesAsRead(userId, friendId) {
        await db
            .update(friendMessages)
            .set({ readAt: new Date() })
            .where(
                and(
                    eq(friendMessages.receiverId, userId),
                    eq(friendMessages.senderId, friendId),
                    sql`${friendMessages.readAt} IS NULL`
                )
            );
    }
}

export const messagesRepository = new MessagesRepository();
