import { matchesRepository } from "./matches.repository.js";
import { successResponse } from "../../utils/response.js";

class MatchesController {
    async getMatchHistory(req, res, next) {
        try {
            const { page, limit } = req.query;

            const matches = await matchesRepository.getMatchHistory(req.user.id, { page, limit });

            return successResponse(res, {
                message: "Match history retrieved successfully",
                data: {
                    matches,
                    pagination: { page, limit },
                },
            });
        } catch (err) {
            next(err);
        }
    }
}

export const matchesController = new MatchesController();
