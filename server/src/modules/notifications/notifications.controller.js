import { notificationsRepository } from "./notifications.repository.js";
import { successResponse } from "../../utils/response.js";

class NotificationsController {
    async getNotifications(req, res, next) {
        try {
            const notifications = await notificationsRepository.getNotifications(req.user.id);
            return successResponse(res, {
                message: "Notifications retrieved successfully",
                data: { notifications },
            });
        } catch (err) {
            next(err);
        }
    }

    async markAsRead(req, res, next) {
        try {
            await notificationsRepository.markAsRead(req.user.id);
            return successResponse(res, {
                message: "Notifications marked as read",
            });
        } catch (err) {
            next(err);
        }
    }
}

export const notificationsController = new NotificationsController();
