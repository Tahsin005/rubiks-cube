import { pgTable, bigint, uuid, integer, text, check, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";
import { matches } from "./matches.schema.js";

export const solves = pgTable("solves", {
    id:       bigint("id", { mode: "number" }).primaryKey(),  // client-generated timestamp id
    userId:   uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    timeMs:   integer("time_ms").notNull(),
    penalty:  text("penalty"),
    scramble: text("scramble").notNull(),
    source:   text("source").default("solo"),
    matchId:  uuid("match_id").references(() => matches.id),
    solvedAt: timestamp("solved_at", { withTimezone: true }).notNull(),
    synced:   boolean("synced").default(false),
}, (t) => [
    index("idx_solves_user").on(t.userId, t.solvedAt.desc()),
    check("source_check",  sql`${t.source} IN ('solo', 'match', 'imported')`),
    check("penalty_check", sql`${t.penalty} IN ('+2', 'DNF')`),
]);