import { usersRepository } from "./users.repository.js";
import { successResponse } from "../../utils/response.js";

class UsersController {
    async getRankings(req, res, next) {
        try {
            const { page, limit, search, minElo, minWinRate, maxPb } = req.query;

            const rankings = await usersRepository.getRankings({
                page,
                limit,
                search,
                minElo,
                minWinRate,
                maxPb,
            });

            return successResponse(res, {
                message: "Rankings retrieved successfully",
                data: {
                    rankings,
                    page,
                    limit,
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async getProfile(req, res, next) {
        try {
            const { username } = req.params;
            const requesterId = req.user ? req.user.id : null;

            const profile = await usersRepository.getProfile(username, requesterId);

            if (!profile) {
                const err = new Error("User not found");
                err.statusCode = 404;
                throw err;
            }

            return successResponse(res, {
                message: "Profile retrieved successfully",
                data: profile,
            });
        } catch (err) {
            next(err);
        }
    }
}

const usersController = new UsersController();

export const { getRankings, getProfile } = usersController;
