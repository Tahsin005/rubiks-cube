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
}

const usersController = new UsersController();

export const { getRankings } = usersController;
