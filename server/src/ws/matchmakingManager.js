import { redis } from "../config/redis.js";
import { db } from "../config/db.js";
import { users, userStats } from "../db/index.js";
import { eq } from "drizzle-orm";
import { createMatch } from "./gameManager.js";

const QUEUE_KEY = "matchmaking_queue";

export async function joinQueue(userId) {
    try {
        const opponents = await redis.spop(QUEUE_KEY, 1);

        if (opponents && opponents.length > 0) {
            const opponentId = opponents[0];

            if (opponentId === userId) {
                await redis.sadd(QUEUE_KEY, userId);
                return;
            }

            const [playerA, playerB] = await Promise.all([
                fetchUserDetails(userId),
                fetchUserDetails(opponentId)
            ]);

            if (!playerA || !playerB) {
                // someone was deleted? Just put the valid one back.
                if (playerA) await redis.sadd(QUEUE_KEY, playerA.id);
                if (playerB) await redis.sadd(QUEUE_KEY, playerB.id);
                return;
            }

            await createMatch("ranked", playerA, playerB);
        } else {
            // no one in queue, add ourselves
            await redis.sadd(QUEUE_KEY, userId);
        }
    } catch (err) {
        console.error("[WS] Error joining queue:", err.message);
    }
}

export async function leaveQueue(userId) {
    try {
        await redis.srem(QUEUE_KEY, userId);
    } catch (err) {
        console.error("[WS] Error leaving queue:", err.message);
    }
}

// fetch user details for the match manager
async function fetchUserDetails(userId) {
    const rows = await db.select({
        id: users.id,
        username: users.username,
        elo: userStats.elo
    }).from(users)
        .leftJoin(userStats, eq(users.id, userStats.userId))
        .where(eq(users.id, userId))
        .limit(1);

    if (rows.length === 0) return null;
    return rows[0];
}
