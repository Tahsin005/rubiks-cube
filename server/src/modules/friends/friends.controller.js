import { friendsRepository } from "./friends.repository.js";
import { redis } from "../../config/redis.js";
import { successResponse } from "../../utils/response.js";

class FriendsController {
    async getFriends(req, res, next) {
        try {
            const { page, limit, status } = req.query;

            const friends = await friendsRepository.getFriends(req.user.id, { page, limit, status });

            // Fetch online status from Redis
            const onlineUsersArray = await redis.smembers("online_users");
            const onlineUsersSet = new Set(onlineUsersArray);

            friends.forEach(f => {
                f.friend.isOnline = onlineUsersSet.has(f.friend.id);
            });

            return successResponse(res, {
                message: "Friends retrieved successfully",
                data: {
                    friends,
                    pagination: { page, limit },
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async sendFriendRequest(req, res, next) {
        try {
            const { username } = req.params;
            const result = await friendsRepository.sendFriendRequest(req.user.id, username);
            if (result.error) {
                return res.status(result.status).json({ success: false, message: result.error });
            }
            return successResponse(res, { message: "Friend request sent", data: result.data });
        } catch (err) { next(err); }
    }

    async acceptFriendRequest(req, res, next) {
        try {
            const { username } = req.params;
            const result = await friendsRepository.acceptFriendRequest(req.user.id, username);
            if (result.error) {
                return res.status(result.status).json({ success: false, message: result.error });
            }
            return successResponse(res, { message: "Friend request accepted", data: result.data });
        } catch (err) { next(err); }
    }

    async rejectFriendRequest(req, res, next) {
        try {
            const { username } = req.params;
            const result = await friendsRepository.rejectFriendRequest(req.user.id, username);
            if (result.error) {
                return res.status(result.status).json({ success: false, message: result.error });
            }
            return successResponse(res, { message: "Friend request rejected", data: null });
        } catch (err) { next(err); }
    }

    async removeFriend(req, res, next) {
        try {
            const { username } = req.params;
            const result = await friendsRepository.removeFriend(req.user.id, username);
            if (result.error) {
                return res.status(result.status).json({ success: false, message: result.error });
            }
            return successResponse(res, { message: "Friend removed / request cancelled or rejected", data: null });
        } catch (err) { next(err); }
    }
}

export const friendsController = new FriendsController();
