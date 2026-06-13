import { pgTable, uuid, text, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

export const matchInvites = pgTable("match_invites", {
    id:         uuid("id").primaryKey().defaultRandom(),
    senderId:   uuid("sender_id").notNull().references(() => users.id),
    receiverId: uuid("receiver_id").notNull().references(() => users.id),
    matchType:  text("match_type").default("friendly"),
    status:     text("status").default("pending"),
    createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt:  timestamp("expires_at", { withTimezone: true })
                                .default(sql`now() + INTERVAL '2 minutes'`),
}, (t) => [
    check("match_type_check", sql`${t.matchType} IN ('ranked', 'friendly')`),
    check("status_check",     sql`${t.status} IN ('pending', 'accepted', 'declined', 'expired')`),
]);