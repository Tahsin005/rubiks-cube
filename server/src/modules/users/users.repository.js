import { db } from "../../config/db.js";
import { users, userStats, eloTiers, matchResults, friendships } from "../../db/index.js";
import { eq, and, sql, gte, lte, or } from "drizzle-orm";

class UsersRepository {
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
            id: targetUser.id,
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
            friendship: friendship ? {
                status: friendship.status,
                // 'sender' if the logged-in user sent the request, 'receiver' if they received it
                viewerRole: friendship.requesterId === requesterId ? 'sender' : 'receiver',
            } : null
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
}

export const usersRepository = new UsersRepository();
