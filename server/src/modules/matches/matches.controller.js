import { matchesRepository } from "./matches.repository.js";
import { successResponse } from "../../utils/response.js";
import { db } from "../../config/db.js";
import { users } from "../../db/index.js";
import { eq } from "drizzle-orm";

class MatchesController {
    async getMyMatches(req, res, next) {
        try {
            const { page, limit } = req.query;
            const matches = await matchesRepository.getMatchHistory(req.user.id, { page, limit });

            return successResponse(res, {
                message: "Matches retrieved successfully",
                data: {
                    matches,
                    pagination: { page, limit },
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async getMatchHistory(req, res, next) {
        try {
            const { page, limit } = req.query;
            const { opponentUsername } = req.params;

            let opponentId;
            if (opponentUsername) {
                const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, opponentUsername)).limit(1);
                if (rows.length === 0) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
                opponentId = rows[0].id;
            }

            const matches = await matchesRepository.getMatchHistory(req.user.id, { page, limit, opponentId });

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
