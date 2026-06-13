import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

export const userStats = pgTable("user_stats", {
    userId:         uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    elo:            integer("elo").notNull().default(1000),
    matchesPlayed:  integer("matches_played").default(0),
    matchesWon:     integer("matches_won").default(0),
    matchesLost:    integer("matches_lost").default(0),
    matchesDrawn:   integer("matches_drawn").default(0),
    pbSingleMs:     integer("pb_single_ms"),   // personal best in ms, null until first solve
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow(),
});