import { authService } from "./auth.service.js";
import { successResponse } from "../../utils/response.js";

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
}

const authController = new AuthController();

export const { register, login } = authController;
