import { checkDbHealth } from "./health.service.js";
import { successResponse } from "../../utils/response.js";

export const healthCheck = async (req, res, next) => {
    try {
        await checkDbHealth();

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
};