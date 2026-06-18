import { db } from "../../config/db.js";
import { users, userStats, solves } from "../../db/index.js";
import { eq, ilike, and, desc, sql, gte, lte } from "drizzle-orm";

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

        // Build where conditions
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
}

export const usersRepository = new UsersRepository();
