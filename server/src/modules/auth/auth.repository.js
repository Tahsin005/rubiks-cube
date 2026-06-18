import { db } from "../../config/db.js";
import { users } from "../../db/index.js";
import { eq } from "drizzle-orm";

class AuthRepository {
    async findByEmail(email) {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return result[0] ?? null;
    }

    async findByUsername(username) {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
        return result[0] ?? null;
    }

    async createUser({ username, email, passwordHash }) {
        const result = await db
            .insert(users)
            .values({ username, email, passwordHash })
            .returning({
                id:        users.id,
                username:  users.username,
                email:     users.email,
                avatarUrl: users.avatarUrl,
                createdAt: users.createdAt,
            });
        return result[0];
    }
}

export const authRepository = new AuthRepository();
