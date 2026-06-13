import { errorResponse } from "../utils/response.js";

// 404 handler
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// global error handler
export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[ERROR] ${statusCode} - ${message}`);

    return errorResponse(res, {
        statusCode,
        message,
        errors: process.env.NODE_ENV === "development" ? err.stack : null,
    });
};