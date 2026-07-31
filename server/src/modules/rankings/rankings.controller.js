import { rankingsRepository } from "./rankings.repository.js";
import { successResponse } from "../../utils/response.js";

class RankingsController {
    async getRankings(req, res, next) {
        try {
            const { page, limit, search, minElo, minWinRate, maxPb } = req.query;

            const rankings = await rankingsRepository.getRankings({
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
                    pagination: {
                        page,
                        limit,
                    },
                },
            });
        } catch (err) {
            next(err);
        }
    }
}

export const rankingsController = new RankingsController();
