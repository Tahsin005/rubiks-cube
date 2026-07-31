import { db } from "../config/db.js";
import { matchChallenges, users, userStats } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { sendToUser } from "./wsClients.js";
import { createMatch } from "./gameManager.js";

export async function handleChallengeSend(senderId, targetUsername) {
    const targetRows = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.username, targetUsername)).limit(1);
    if (targetRows.length === 0) return; // target not found

    const receiverId = targetRows[0].id;
    if (senderId === receiverId) return;

    const insertRows = await db.insert(matchChallenges).values({
        senderId,
        receiverId,
        status: "pending"
    }).returning();

    const challenge = insertRows[0];

    // get sender info
    const senderRows = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.id, senderId)).limit(1);

    // notify receiver
    sendToUser(receiverId, {
        type: "CHALLENGE_RECEIVED",
        payload: {
            challengeId: challenge.id,
            sender: {
                id: senderId,
                username: senderRows[0].username
            },
            expiresAt: challenge.expiresAt
        }
    });
}

export async function handleChallengeAccept(receiverId, challengeId) {
    const rows = await db.select().from(matchChallenges).where(eq(matchChallenges.id, challengeId)).limit(1);
    if (rows.length === 0) return;
    const challenge = rows[0];

    if (challenge.receiverId !== receiverId || challenge.status !== "pending") return;

    // accept it
    await db.update(matchChallenges).set({ status: "accepted" }).where(eq(matchChallenges.id, challengeId));

    // get both players
    const [playerA, playerB] = await Promise.all([
        fetchUserDetails(challenge.senderId),
        fetchUserDetails(challenge.receiverId)
    ]);

    if (!playerA || !playerB) return;

    // start match
    await createMatch("friendly", playerA, playerB);
}

export async function handleChallengeDecline(receiverId, challengeId) {
    const rows = await db.select().from(matchChallenges).where(eq(matchChallenges.id, challengeId)).limit(1);
    if (rows.length === 0) return;
    const challenge = rows[0];

    if (challenge.receiverId !== receiverId || challenge.status !== "pending") return;

    // decline it
    await db.update(matchChallenges).set({ status: "declined" }).where(eq(matchChallenges.id, challengeId));

    // notify sender
    sendToUser(challenge.senderId, {
        type: "CHALLENGE_DECLINED",
        payload: {
            challengeId
        }
    });
}

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
