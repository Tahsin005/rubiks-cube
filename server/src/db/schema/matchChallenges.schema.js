import { pgTable, uuid, text, timestamp, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

export const matchChallenges = pgTable("match_challenges", {
    id:         uuid("id").primaryKey().defaultRandom(),
    senderId:   uuid("sender_id").notNull().references(() => users.id),
    receiverId: uuid("receiver_id").notNull().references(() => users.id),
    status:     text("status").default("pending"),
    createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt:  timestamp("expires_at", { withTimezone: true })
                                .default(sql`now() + INTERVAL '2 minutes'`),
}, (t) => [
    check("status_check",     sql`${t.status} IN ('pending', 'accepted', 'declined', 'expired')`),
    // only one pending invite may exist between a given pair at a time
    index("uq_pending_invite").on(t.senderId, t.receiverId)
        .where(sql`${t.status} = 'pending'`),
]);