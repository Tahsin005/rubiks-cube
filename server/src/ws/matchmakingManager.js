import { redis } from "../config/redis.js";
import { db } from "../config/db.js";
import { users, userStats } from "../db/index.js";
import { eq } from "drizzle-orm";
import { createMatch } from "./gameManager.js";

const QUEUE_KEY = "matchmaking_queue";

export async function joinQueue(userId) {
    // Try to pop someone from the queue
    const opponents = await redis.spop(QUEUE_KEY, 1);

    if (opponents && opponents.length > 0) {
        const opponentId = opponents[0];

        if (opponentId === userId) {
            // It was us. Put us back.
            await redis.sadd(QUEUE_KEY, userId);
            return;
        }

        // We found a match!
        const [playerA, playerB] = await Promise.all([
            fetchUserDetails(userId),
            fetchUserDetails(opponentId)
        ]);

        if (!playerA || !playerB) {
            // Someone was deleted? Just put the valid one back.
            if (playerA) await redis.sadd(QUEUE_KEY, playerA.id);
            if (playerB) await redis.sadd(QUEUE_KEY, playerB.id);
            return;
        }

        await createMatch("ranked", playerA, playerB);
    } else {
        // No one in queue, add ourselves
        await redis.sadd(QUEUE_KEY, userId);
    }
}

export async function leaveQueue(userId) {
    await redis.srem(QUEUE_KEY, userId);
}

// Fetch user details for the match manager
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
