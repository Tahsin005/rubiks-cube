import { redis } from "../config/redis.js";

export const rateLimit = (limit = 100, windowSeconds = 60) => {
    return async (req, res, next) => {
        try {
            // IP address as the identifier, fallback to a generic key if IP is missing.
            const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
            const key = `ratelimit:${req.originalUrl}:${ip}`;

            const requests = await redis.incr(key);

            if (requests === 1) {
                // set expiry on the first request
                await redis.expire(key, windowSeconds);
            }

            // set rate limit headers
            res.setHeader("X-RateLimit-Limit", limit);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - requests));

            if (requests > limit) {
                return res.status(429).json({
                    success: false,
                    message: "Too many requests. Please try again later.",
                });
            }

            next();
        } catch (err) {
            console.error("[RateLimit Error]:", err);
            next();
        }
    };
};
