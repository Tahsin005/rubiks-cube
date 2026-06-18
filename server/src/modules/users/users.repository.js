import { db } from "../../config/db.js";
import { users, userStats, solves, eloTiers, friendships, matchResults, achievements, userAchievements } from "../../db/index.js";
import { eq, ilike, and, desc, sql, gte, lte, or } from "drizzle-orm";

class UsersRepository {
    async getRankings({ page = 1, limit = 10, search, minElo, minWinRate, maxPb }) {
        const offset = (page - 1) * limit;

        // CTE to get the PB for each user from the solves table
        const userMinSolves = db.$with('user_min_solves').as(
            db.select({
                userId: solves.userId,
                pbTime: sql`min(${solves.timeMs})`.mapWith(Number).as('pb_time'),
            })
            .from(solves)
            .groupBy(solves.userId)
        );

        // build where conditions
        const conditions = [];

        if (search) {
            conditions.push(ilike(users.username, `%${search}%`));
        }

        if (minElo !== undefined) {
            conditions.push(gte(userStats.elo, minElo));
        }

        // win percentage = (won / played) * 100
        // coalesce to handle nulls and division by zero
        const winPercentageSql = sql`
            CASE 
                WHEN ${userStats.matchesPlayed} > 0 THEN 
                    ROUND((${userStats.matchesWon}::numeric / ${userStats.matchesPlayed}::numeric) * 100, 2)
                ELSE 0 
            END
        `.mapWith(Number);

        if (minWinRate !== undefined) {
            conditions.push(gte(winPercentageSql, minWinRate));
        }

        if (maxPb !== undefined) {
            conditions.push(lte(userMinSolves.pbTime, maxPb));
        }

        const query = db.with(userMinSolves)
            .select({
                username: users.username,
                matchesPlayed: sql`COALESCE(${userStats.matchesPlayed}, 0)`.mapWith(Number),
                winPercentage: winPercentageSql,
                pbTime: sql`COALESCE(${userMinSolves.pbTime}, 0)`.mapWith(Number),
                elo: sql`COALESCE(${userStats.elo}, 1000)`.mapWith(Number),
            })
            .from(users)
            .leftJoin(userStats, eq(users.id, userStats.userId))
            .leftJoin(userMinSolves, eq(users.id, userMinSolves.userId));

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        // order by Elo descending
        query.orderBy(desc(userStats.elo), users.username)
             .limit(limit)
             .offset(offset);

        const results = await query;

        return results;
    }

    async getProfile(targetUsername, requesterId) {
        const targetUserRows = await db.select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
            countryCode: users.countryCode,
            elo: userStats.elo,
            matchesPlayed: userStats.matchesPlayed,
            matchesWon: userStats.matchesWon,
        })
        .from(users)
        .leftJoin(userStats, eq(users.id, userStats.userId))
        .where(eq(users.username, targetUsername))
        .limit(1);

        const targetUser = targetUserRows[0];
        if (!targetUser) return null;

        const played = targetUser.matchesPlayed || 0;
        const won = targetUser.matchesWon || 0;
        const loss = Math.max(0, played - won);
        const winPercentage = played > 0 ? Number(((won / played) * 100).toFixed(2)) : 0;

        const currentElo = targetUser.elo || 1000;
        const eloTiersRows = await db.select()
            .from(eloTiers)
            .where(and(lte(eloTiers.minElo, currentElo), gte(eloTiers.maxElo, currentElo)))
            .limit(1);
        const eloTier = eloTiersRows[0] || null;

        const maxEloRows = await db.select({
            maxElo: sql`MAX(${matchResults.eloAfter})`.mapWith(Number),
        })
        .from(matchResults)
        .where(eq(matchResults.userId, targetUser.id));

        const maxEloDb = maxEloRows[0]?.maxElo;
        const maxElo = maxEloDb !== null && maxEloDb !== undefined && maxEloDb > currentElo ? maxEloDb : currentElo;

        const isSelf = targetUser.id === requesterId;

        let friendship = null;
        if (!isSelf && requesterId) {
            const fRows = await db.select()
                .from(friendships)
                .where(
                    or(
                        and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, targetUser.id)),
                        and(eq(friendships.requesterId, targetUser.id), eq(friendships.addresseeId, requesterId))
                    )
                )
                .limit(1);
            friendship = fRows[0] || null;
        }

        return {
            username: targetUser.username,
            avatarUrl: targetUser.avatarUrl,
            countryCode: targetUser.countryCode,
            is_self: isSelf,
            elo: {
                current: currentElo,
                max: maxElo
            },
            eloTier: eloTier,
            stats: {
                totalMatchPlayed: played,
                win: won,
                loss: loss,
                winPercentage: winPercentage
            },
            friendship: friendship
        };
    }

    async updateProfile(userId, { avatarUrl, countryCode }) {
        const updateData = {};
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (countryCode !== undefined) updateData.countryCode = countryCode;

        if (Object.keys(updateData).length === 0) return null;

        const results = await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        return results[0] || null;
    }

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

export const usersRepository = new UsersRepository();
