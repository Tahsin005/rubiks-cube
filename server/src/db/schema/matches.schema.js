import { pgTable, uuid, text, integer, unique, timestamp, check, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

export const matches = pgTable("matches", {
    id:               uuid("id").primaryKey().defaultRandom(),
    scramble:         text("scramble").notNull(),
    matchType:        text("match_type").notNull(),
    status:           text("status").notNull().default("in_progress"),
    playerAId:        uuid("player_a_id").notNull().references(() => users.id),
    playerBId:        uuid("player_b_id").notNull().references(() => users.id),
    winnerId:         uuid("winner_id").references(() => users.id),
    startedAt:        timestamp("started_at", { withTimezone: true }).defaultNow(),
    finishedAt:       timestamp("finished_at", { withTimezone: true }),

    playerAEloBefore: integer("player_a_elo_before"),
    playerBEloBefore: integer("player_b_elo_before"),
    playerAEloAfter:  integer("player_a_elo_after"),
    playerBEloAfter:  integer("player_b_elo_after"),
}, (t) => [
    check("match_type_check", sql`${t.matchType} IN ('ranked', 'friendly')`),
    check("status_check",     sql`${t.status} IN ('in_progress', 'finished', 'aborted')`),
]);

export const matchResults = pgTable("match_results", {
    id:          uuid("id").primaryKey().defaultRandom(),
    matchId:     uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
    userId:      uuid("user_id").notNull().references(() => users.id),
    solveTimeMs: integer("solve_time_ms"),
    penalty:     text("penalty"),
    dnf:         boolean("dnf").default(false),
    finishedAt:  timestamp("finished_at", { withTimezone: true }),
}, (t) => [
    unique().on(t.matchId, t.userId),
    check("penalty_check", sql`${t.penalty} IN ('+2', 'DNF')`),
]);