import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    out: "./drizzle",
    schema: "./src/db/schema/*.schema.js",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});