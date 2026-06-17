import { db } from "../../config/db.js";
import { sql } from "drizzle-orm";

class HealthRepository {
    async pingDb() {
        await db.execute(sql`SELECT 1`);
    }
}

export const healthRepository = new HealthRepository();
