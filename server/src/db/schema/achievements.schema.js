import { uuid, pgTable, serial, integer, text, timestamp, primaryKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

export const achievements = pgTable("achievements", {
    id:          serial("id").primaryKey(),
    key:         text("key").unique().notNull(),
    name:        text("name").notNull(),
    description: text("description").notNull(),
    iconUrl:     text("icon_url"),
    category:    text("category"),
}, (t) => [
    check("category_check", sql`${t.category} IN ('matches', 'solves', 'social', 'elo')`),
]);

export const userAchievements = pgTable("user_achievements", {
    userId:        uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id").references(() => achievements.id),
    earnedAt:      timestamp("earned_at", { withTimezone: true }).defaultNow(),
}, (t) => [
    primaryKey({ columns: [t.userId, t.achievementId] }),
]);