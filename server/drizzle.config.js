import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    out: "./drizzle",
    schema: "./src/**/*.schema.js", // point to your schema files when you add them
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});