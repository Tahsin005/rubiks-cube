import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository.js";

const SALT_ROUNDS = 12;

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "100d" }
    );
}

class AuthService {
    async register({ username, email, password }) {
        // Check uniqueness
        const existingEmail = await authRepository.findByEmail(email);
        if (existingEmail) {
            const err = new Error("Email is already in use");
            err.statusCode = 409;
            throw err;
        }

        const existingUsername = await authRepository.findByUsername(username);
        if (existingUsername) {
            const err = new Error("Username is already taken");
            err.statusCode = 409;
            throw err;
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await authRepository.createUser({ username, email, passwordHash });
        const token = generateToken(user);

        return { token, user };
    }

    async login({ email, password }) {
        const user = await authRepository.findByEmail(email);
        if (!user) {
            const err = new Error("Invalid email or password");
            err.statusCode = 401;
            throw err;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            const err = new Error("Invalid email or password");
            err.statusCode = 401;
            throw err;
        }

        // Strip passwordHash before sending back
        const { passwordHash: _, ...safeUser } = user;
        const token = generateToken(safeUser);

        return { token, user: safeUser };
    }
}

export const authService = new AuthService();
