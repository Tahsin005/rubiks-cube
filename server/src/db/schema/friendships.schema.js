import { pgTable, uuid, text, timestamp, uniqueIndex, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

export const friendships = pgTable("friendships", {
    id:          uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id").notNull().references(() => users.id),
    addresseeId: uuid("addressee_id").notNull().references(() => users.id),
    status:      text("status").notNull().default("pending"),
    createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [
    uniqueIndex("uq_friendship_pair").on(
        sql`LEAST(${t.requesterId}, ${t.addresseeId})`,
        sql`GREATEST(${t.requesterId}, ${t.addresseeId})`
    ),
    check("status_check",   sql`${t.status} IN ('pending', 'accepted', 'blocked')`),
    check("no_self_friend", sql`${t.requesterId} != ${t.addresseeId}`),
    index("idx_friendships_addressee").on(t.addresseeId, t.status),
    index("idx_friendships_requester").on(t.requesterId, t.status),
]);