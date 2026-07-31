import { db } from "../../config/db.js";
import { users, matches, matchResults } from "../../db/index.js";
import { eq, and, desc, or } from "drizzle-orm";

class MatchesRepository {
    async getMatchHistory(userId, { page = 1, limit = 20, opponentId }) {
        const offset = (page - 1) * limit;

        const playerA = db.$with('playerA').as(db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users));
        const playerB = db.$with('playerB').as(db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users));

        let condition = or(eq(matches.playerAId, userId), eq(matches.playerBId, userId));
        if (opponentId) {
            condition = and(
                or(eq(matches.playerAId, userId), eq(matches.playerBId, userId)),
                or(eq(matches.playerAId, opponentId), eq(matches.playerBId, opponentId))
            );
        }

        const userMatches = await db.with(playerA, playerB)
            .select({
                matchId: matches.id,
                matchType: matches.matchType,
                status: matches.status,
                winnerId: matches.winnerId,
                startedAt: matches.startedAt,
                playerAId: matches.playerAId,
                playerBId: matches.playerBId,
                playerAUsername: playerA.username,
                playerBUsername: playerB.username,
                playerAAvatarUrl: playerA.avatarUrl,
                playerBAvatarUrl: playerB.avatarUrl,
                eloBefore: matchResults.eloBefore,
                eloAfter: matchResults.eloAfter,
            })
            .from(matches)
            .innerJoin(playerA, eq(matches.playerAId, playerA.id))
            .innerJoin(playerB, eq(matches.playerBId, playerB.id))
            .leftJoin(matchResults, and(eq(matchResults.matchId, matches.id), eq(matchResults.userId, userId)))
            .where(condition)
            .orderBy(desc(matches.startedAt))
            .limit(limit)
            .offset(offset);

        return userMatches.map(m => {
            const isPlayerA = m.playerAId === userId;
            const oppUsername = isPlayerA ? m.playerBUsername : m.playerAUsername;
            const oppAvatarUrl = isPlayerA ? m.playerBAvatarUrl : m.playerAAvatarUrl;

            let eloChange;
            if (m.matchType === 'friendly') {
                eloChange = '+0';
            } else {
                if (m.eloBefore != null && m.eloAfter != null) {
                    const diff = m.eloAfter - m.eloBefore;
                    eloChange = diff > 0 ? `+${diff}` : `${diff}`;
                } else {
                    eloChange = null;
                }
            }

            let winner = null;
            if (m.winnerId) {
                if (m.winnerId === userId) winner = 'me';
                else winner = 'them';
            } else if (m.status === 'aborted') {
                winner = 'none (aborted)';
            } else if (m.status === 'finished') {
                winner = 'draw';
            }

            return {
                matchId: m.matchId,
                oppositionUsername: oppUsername,
                oppositionAvatarUrl: oppAvatarUrl,
                status: m.status,
                matchType: m.matchType,
                winner: winner,
                eloChange: eloChange,
                startedAt: m.startedAt
            };
        });
    }
}

export const matchesRepository = new MatchesRepository();
