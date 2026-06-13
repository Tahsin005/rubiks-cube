import { pgTable, uuid, text, char, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id:           uuid("id").primaryKey().defaultRandom(),
    username:     text("username").unique().notNull(),
    email:        text("email").unique().notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl:    text("avatar_url"),
    countryCode:  char("country_code", { length: 2 }),
    createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
    lastSeenAt:   timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
});