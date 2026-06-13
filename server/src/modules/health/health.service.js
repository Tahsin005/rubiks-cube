import { db } from "../../config/db.js";
import { sql } from "drizzle-orm";

export const checkDbHealth = async () => {
    await db.execute(sql`SELECT 1`);
    return true;
};