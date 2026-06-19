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

    async getFriends(userId, { page = 1, limit = 20, status }) {
        const offset = (page - 1) * limit;

        const requester = db.$with('requester').as(
            db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users)
        );
        const addressee = db.$with('addressee').as(
            db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users)
        );

        const isParticipant = or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
        );

        const conditions = [isParticipant];
        if (status) conditions.push(eq(friendships.status, status));

        const rows = await db.with(requester, addressee)
            .select({
                friendshipId:      friendships.id,
                status:            friendships.status,
                createdAt:         friendships.createdAt,
                requesterId:       friendships.requesterId,
                addresseeId:       friendships.addresseeId,
                requesterUsername: requester.username,
                requesterAvatar:   requester.avatarUrl,
                addresseeUsername: addressee.username,
                addresseeAvatar:   addressee.avatarUrl,
            })
            .from(friendships)
            .innerJoin(requester, eq(friendships.requesterId, requester.id))
            .innerJoin(addressee, eq(friendships.addresseeId, addressee.id))
            .where(and(...conditions))
            .orderBy(desc(friendships.createdAt))
            .limit(limit)
            .offset(offset);

        return rows.map(row => {
            const iAmRequester = row.requesterId === userId;
            const friend = {
                username:  iAmRequester ? row.addresseeUsername : row.requesterUsername,
                avatarUrl: iAmRequester ? row.addresseeAvatar   : row.requesterAvatar,
            };
            const entry = {
                friendshipId: row.friendshipId,
                status:       row.status,
                createdAt:    row.createdAt,
                friend,
            };
            // for non-accepted statuses, surface who initiated
            if (row.status !== 'accepted') {
                entry.initiatedBy = row.requesterId === userId ? 'me' : 'them';
                entry.initiatorUsername = row.requesterUsername;
            }
            return entry;
        });
    }

    async sendFriendRequest(requesterId, targetUsername) {
        // get target user
        const targetUserRows = await db.select({ id: users.id }).from(users).where(eq(users.username, targetUsername)).limit(1);
        if (targetUserRows.length === 0) return { error: "User not found", status: 404 };
        const targetId = targetUserRows[0].id;

        if (requesterId === targetId) return { error: "Cannot send friend request to yourself", status: 400 };

        // check existing friendship
        const existing = await db.select().from(friendships).where(
            or(
                and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, targetId)),
                and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, requesterId))
            )
        ).limit(1);

        if (existing.length > 0) {
            const f = existing[0];
            if (f.status === 'accepted') return { error: "Already friends", status: 400 };
            if (f.status === 'blocked') return { error: "Cannot send friend request", status: 403 };
            if (f.status === 'pending') {
                if (f.requesterId === requesterId) return { error: "Friend request already sent", status: 400 };
                else return { error: "You already have a pending friend request from this user", status: 400 };
            }
        }

        // insert
        const result = await db.insert(friendships).values({
            requesterId,
            addresseeId: targetId,
            status: 'pending'
        }).returning();

        return { data: result[0] };
    }

    async acceptFriendRequest(userId, targetUsername) {
        const targetUserRows = await db.select({ id: users.id }).from(users).where(eq(users.username, targetUsername)).limit(1);
        if (targetUserRows.length === 0) return { error: "User not found", status: 404 };
        const targetId = targetUserRows[0].id;

        const existing = await db.select().from(friendships).where(
            or(
                and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetId)),
                and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, userId))
            )
        ).limit(1);

        if (existing.length === 0) return { error: "Friend request not found", status: 404 };
        const f = existing[0];

        if (f.status === 'accepted') return { error: "Already friends", status: 400 };
        if (f.status === 'blocked') return { error: "Cannot accept friend request", status: 403 };
        
        if (f.requesterId === userId) return { error: "You cannot accept your own friend request", status: 400 };

        const result = await db.update(friendships)
            .set({ status: 'accepted', updatedAt: new Date() })
            .where(eq(friendships.id, f.id))
            .returning();

        return { data: result[0] };
    }

    async removeFriend(userId, targetUsername) {
        const targetUserRows = await db.select({ id: users.id }).from(users).where(eq(users.username, targetUsername)).limit(1);
        if (targetUserRows.length === 0) return { error: "User not found", status: 404 };
        const targetId = targetUserRows[0].id;

        const existing = await db.select().from(friendships).where(
            or(
                and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetId)),
                and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, userId))
            )
        ).limit(1);

        if (existing.length === 0) return { error: "Friendship not found", status: 404 };
        const f = existing[0];

        if (f.status === 'blocked' && f.requesterId !== userId) {
            return { error: "Cannot modify this friendship", status: 403 }; // they blocked us
        }

        await db.delete(friendships).where(eq(friendships.id, f.id));
        return { data: { success: true } };
    }
}

export const usersRepository = new UsersRepository();
