import { achievementsRepository } from "./achievements.repository.js";
import { successResponse } from "../../utils/response.js";

class AchievementsController {
    async getAchievements(req, res, next) {
        try {
            const { page, limit, category } = req.query;

            const data = await achievementsRepository.getUserAchievements(req.user.id, { page, limit, category });

            return successResponse(res, {
                message: "Achievements retrieved successfully",
                data: {
                    achievements: data,
                    pagination: {
                        page,
                        limit,
                    },
                },
            });
        } catch (err) {
            next(err);
        }
    }
}

export const achievementsController = new AchievementsController();
