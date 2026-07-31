import { achievementsRepository } from "./achievements.repository.js";
import { successResponse } from "../../utils/response.js";
import { db } from "../../config/db.js";
import { users } from "../../db/index.js";
import { eq } from "drizzle-orm";

class AchievementsController {
    async getAchievements(req, res, next) {
        try {
            const { page, limit, category, username } = req.query;

            let targetUserId = req.user.id;

            if (username) {
                const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
                if (rows.length === 0) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
                targetUserId = rows[0].id;
            }

            const data = await achievementsRepository.getUserAchievements(targetUserId, { page, limit, category });

            return successResponse(res, {
                message: "Achievements retrieved successfully",
                data: {
                    achievements: data,
                    pagination: { page, limit },
                },
            });
        } catch (err) {
            next(err);
        }
    }
}

export const achievementsController = new AchievementsController();
