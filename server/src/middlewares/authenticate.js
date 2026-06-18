import jwt from "jsonwebtoken";

/**
 * Middleware that verifies the JWT from the Authorization header.
 * Attaches the decoded payload to `req.user` on success.
 *
 * Usage:
 *   import { authenticate } from "../middlewares/authenticate.js";
 *   router.get("/protected", authenticate, handler);
 */
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const err = new Error("Authentication required");
        err.statusCode = 401;
        return next(err);
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        const authErr = new Error(
            err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
        );
        authErr.statusCode = 401;
        next(authErr);
    }
};
