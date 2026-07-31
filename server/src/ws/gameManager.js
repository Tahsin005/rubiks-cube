import { db } from "../config/db.js";
import { matches, matchResults, users, userStats } from "../db/index.js";
import { eq } from "drizzle-orm";
import { sendToUser } from "./wsClients.js";
import { generateScramble } from "../utils/scramble.js";
import { calculateElo } from "../utils/elo.js";

const activeMatches = new Map(); // matchId -> matchState
const playerToMatch = new Map(); // userId -> matchId

export async function createMatch(matchType, playerA, playerB) {
    const scramble = generateScramble();

    // Insert into DB
    const matchRows = await db.insert(matches).values({
        scramble,
        matchType,
        status: "in_progress",
        playerAId: playerA.id,
        playerBId: playerB.id,
    }).returning();

    const matchId = matchRows[0].id;

    const matchState = {
        id: matchId,
        type: matchType,
        scramble,
        playerA: { id: playerA.id, username: playerA.username, elo: playerA.elo || 1000, ready: false },
        playerB: { id: playerB.id, username: playerB.username, elo: playerB.elo || 1000, ready: false },
        status: "waiting_for_ready"
    };

    activeMatches.set(matchId, matchState);
    playerToMatch.set(playerA.id, matchId);
    playerToMatch.set(playerB.id, matchId);

    // Notify players
    const matchFoundPayload = {
        type: "MATCH_FOUND",
        payload: {
            matchId,
            matchType,
            scramble,
            opponent: {
                id: playerB.id,
                username: playerB.username,
                elo: playerB.elo || 1000
            }
        }
    };

    sendToUser(playerA.id, matchFoundPayload);

    // Send inverse to player B
    matchFoundPayload.payload.opponent = {
        id: playerA.id,
        username: playerA.username,
        elo: playerA.elo || 1000
    };
    sendToUser(playerB.id, matchFoundPayload);
}

export function handleReady(userId) {
    const matchId = playerToMatch.get(userId);
    if (!matchId) return;

    const match = activeMatches.get(matchId);
    if (!match || match.status !== "waiting_for_ready") return;

    if (match.playerA.id === userId) match.playerA.ready = true;
    if (match.playerB.id === userId) match.playerB.ready = true;

    if (match.playerA.ready && match.playerB.ready) {
        match.status = "in_progress";
        match.startTime = Date.now();

        const payload = { type: "MATCH_START", payload: { matchId } };
        sendToUser(match.playerA.id, payload);
        sendToUser(match.playerB.id, payload);
    }
}

export function handleStateUpdate(userId, stateData) {
    const matchId = playerToMatch.get(userId);
    if (!matchId) return;

    const match = activeMatches.get(matchId);
    if (!match || match.status !== "in_progress") return;

    const opponentId = match.playerA.id === userId ? match.playerB.id : match.playerA.id;
    sendToUser(opponentId, {
        type: "OPPONENT_STATE_UPDATE",
        payload: stateData
    });
}

export async function handleSolve(userId, solveTimeMs) {
    const matchId = playerToMatch.get(userId);
    if (!matchId) return;

    const match = activeMatches.get(matchId);
    if (!match || match.status !== "in_progress") return;

    match.status = "finished"; // Lock it so the other player can't trigger solve
    const winnerId = userId;
    const loserId = match.playerA.id === userId ? match.playerB.id : match.playerA.id;
    const winner = match.playerA.id === userId ? match.playerA : match.playerB;
    const loser = match.playerA.id === userId ? match.playerB : match.playerA;

    // Update matches table
    await db.update(matches)
        .set({ status: "finished", winnerId, finishedAt: new Date() })
        .where(eq(matches.id, matchId));

    let newWinnerElo = winner.elo;
    let newLoserElo = loser.elo;

    if (match.type === "ranked") {
        const result = calculateElo(winner.elo, loser.elo, 1);
        newWinnerElo = result.newPlayerAElo;
        newLoserElo = result.newPlayerBElo;
    }

    // Insert results
    await db.insert(matchResults).values([
        { matchId, userId: winnerId, solveTimeMs, eloBefore: winner.elo, eloAfter: newWinnerElo },
        { matchId, userId: loserId, penalty: "DNF", eloBefore: loser.elo, eloAfter: newLoserElo }
    ]);

    // Update stats for winner
    if (match.type === "ranked") {
        const wStatsRows = await db.select().from(userStats).where(eq(userStats.userId, winnerId)).limit(1);
        if (wStatsRows.length > 0) {
            await db.update(userStats).set({
                elo: newWinnerElo,
                matchesPlayed: (wStatsRows[0].matchesPlayed || 0) + 1,
                matchesWon: (wStatsRows[0].matchesWon || 0) + 1
            }).where(eq(userStats.userId, winnerId));
        } else {
            await db.insert(userStats).values({ userId: winnerId, elo: newWinnerElo, matchesPlayed: 1, matchesWon: 1 });
        }

        // Update stats for loser
        const lStatsRows = await db.select().from(userStats).where(eq(userStats.userId, loserId)).limit(1);
        if (lStatsRows.length > 0) {
            await db.update(userStats).set({
                elo: newLoserElo,
                matchesPlayed: (lStatsRows[0].matchesPlayed || 0) + 1
            }).where(eq(userStats.userId, loserId));
        } else {
            await db.insert(userStats).values({ userId: loserId, elo: newLoserElo, matchesPlayed: 1, matchesWon: 0 });
        }
    }

    // Cleanup
    activeMatches.delete(matchId);
    playerToMatch.delete(winnerId);
    playerToMatch.delete(loserId);

    // Notify
    const endPayloadWinner = {
        type: "MATCH_END",
        payload: {
            winnerId,
            solveTimeMs,
            eloChange: newWinnerElo - winner.elo
        }
    };
    const endPayloadLoser = {
        type: "MATCH_END",
        payload: {
            winnerId,
            solveTimeMs,
            eloChange: newLoserElo - loser.elo
        }
    };
    sendToUser(winnerId, endPayloadWinner);
    sendToUser(loserId, endPayloadLoser);
}

export async function handleDisconnect(userId) {
    const matchId = playerToMatch.get(userId);
    if (!matchId) return;

    const match = activeMatches.get(matchId);
    if (!match || match.status === "finished") return;

    // Treat disconnect as an abort
    match.status = "finished";
    const opponentId = match.playerA.id === userId ? match.playerB.id : match.playerA.id;

    await db.update(matches)
        .set({ status: "aborted", finishedAt: new Date() })
        .where(eq(matches.id, matchId));

    // Cleanup
    activeMatches.delete(matchId);
    playerToMatch.delete(userId);
    playerToMatch.delete(opponentId);

    sendToUser(opponentId, {
        type: "MATCH_END",
        payload: {
            aborted: true,
            reason: "Opponent disconnected"
        }
    });
}
