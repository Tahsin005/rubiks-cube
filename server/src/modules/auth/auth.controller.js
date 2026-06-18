import { authService } from "./auth.service.js";
import { successResponse } from "../../utils/response.js";
import { authRepository } from "./auth.repository.js";

class AuthController {
    async register(req, res, next) {
        try {
            const { username, email, password } = req.body;

            const { token, user } = await authService.register({ username, email, password });

            return successResponse(res, {
                statusCode: 201,
                message: "Account created successfully",
                data: { token, user },
            });
        } catch (err) {
            next(err);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const { token, user } = await authService.login({ email, password });

            return successResponse(res, {
                message: "Logged in successfully",
                data: { token, user },
            });
        } catch (err) {
            next(err);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await authRepository.findByEmail(req.user.email);
            if (!user) {
                const err = new Error("User not found");
                err.statusCode = 404;
                throw err;
            }

            const { passwordHash: _, ...safeUser } = user;
            return successResponse(res, {
                message: "User profile retrieved successfully",
                data: { user: safeUser },
            });
        } catch (err) {
            next(err);
        }
    }
}

const authController = new AuthController();

export const { register, login, getMe } = authController;
