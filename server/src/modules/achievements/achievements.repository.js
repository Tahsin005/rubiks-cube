import { db } from "../../config/db.js";
import { achievements, userAchievements } from "../../db/index.js";
import { eq, and, desc } from "drizzle-orm";

class AchievementsRepository {
    async getUserAchievements(userId, { page = 1, limit = 10, category }) {
        const offset = (page - 1) * limit;

        const conditions = [eq(userAchievements.userId, userId)];
        if (category) {
            conditions.push(eq(achievements.category, category));
        }

        return await db.select({
            id: achievements.id,
            key: achievements.key,
            name: achievements.name,
            description: achievements.description,
            iconUrl: achievements.iconUrl,
            category: achievements.category,
            earnedAt: userAchievements.earnedAt
        })
            .from(userAchievements)
            .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
            .where(and(...conditions))
            .orderBy(desc(userAchievements.earnedAt))
            .limit(limit)
            .offset(offset);
    }
}

export const achievementsRepository = new AchievementsRepository();
