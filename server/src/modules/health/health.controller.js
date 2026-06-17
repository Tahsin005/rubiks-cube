import { healthService } from "./health.service.js";
import { successResponse } from "../../utils/response.js";

class HealthController {
    async healthCheck(req, res, next) {
        try {
            await healthService.checkDbHealth();

            return successResponse(res, {
                message: "Server is healthy",
                data: {
                    server: "ok",
                    database: "ok",
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (err) {
            err.message = "Server is up but database connection failed";
            err.statusCode = 503;
            next(err);
        }
    }
}

const healthController = new HealthController();

export const { healthCheck } = healthController;