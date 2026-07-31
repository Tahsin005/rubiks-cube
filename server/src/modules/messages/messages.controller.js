import { messagesRepository } from "./messages.repository.js";
import { successResponse } from "../../utils/response.js";
import { db } from "../../config/db.js";
import { users } from "../../db/index.js";
import { eq } from "drizzle-orm";

class MessagesController {
    async getConversations(req, res, next) {
        try {
            const conversations = await messagesRepository.getConversations(req.user.id);

            return successResponse(res, {
                message: "Conversations retrieved successfully",
                data: { conversations },
            });
        } catch (err) {
            next(err);
        }
    }

    async getMessagesWithUser(req, res, next) {
        try {
            const { friendUsername } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, friendUsername)).limit(1);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            const friendId = rows[0].id;

            const offset = (page - 1) * limit;
            const messages = await messagesRepository.getMessagesWithUser(req.user.id, friendId, { limit, offset });

            // Automatically mark messages as read if we are fetching them
            await messagesRepository.markMessagesAsRead(req.user.id, friendId);

            return successResponse(res, {
                message: "Messages retrieved successfully",
                data: { messages, pagination: { page, limit } },
            });
        } catch (err) {
            next(err);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const { friendUsername } = req.params;

            const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, friendUsername)).limit(1);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            const friendId = rows[0].id;

            await messagesRepository.markMessagesAsRead(req.user.id, friendId);

            return successResponse(res, {
                message: "Messages marked as read",
            });
        } catch (err) {
            next(err);
        }
    }
}

export const messagesController = new MessagesController();
