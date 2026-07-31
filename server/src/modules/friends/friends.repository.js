import { db } from "../../config/db.js";
import { users, friendships } from "../../db/index.js";
import { eq, and, desc, or } from "drizzle-orm";

class FriendsRepository {
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
                friendshipId: friendships.id,
                status: friendships.status,
                createdAt: friendships.createdAt,
                requesterId: friendships.requesterId,
                addresseeId: friendships.addresseeId,
                requesterUsername: requester.username,
                requesterAvatar: requester.avatarUrl,
                addresseeUsername: addressee.username,
                addresseeAvatar: addressee.avatarUrl,
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
                id: iAmRequester ? row.addresseeId : row.requesterId,
                username: iAmRequester ? row.addresseeUsername : row.requesterUsername,
                avatarUrl: iAmRequester ? row.addresseeAvatar : row.requesterAvatar,
            };
            const entry = {
                friendshipId: row.friendshipId,
                status: row.status,
                createdAt: row.createdAt,
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

    async rejectFriendRequest(userId, targetUsername) {
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

        if (f.status !== 'pending') return { error: "No pending friend request to reject", status: 400 };
        if (f.addresseeId !== userId) return { error: "You cannot reject a request you sent", status: 400 };

        await db.delete(friendships).where(eq(friendships.id, f.id));
        return { data: { success: true } };
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

export const friendsRepository = new FriendsRepository();
