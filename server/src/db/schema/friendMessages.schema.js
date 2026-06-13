import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.schema.js";

export const friendMessages = pgTable("friend_messages", {
    id:         uuid("id").primaryKey().defaultRandom(),
    senderId:   uuid("sender_id").notNull().references(() => users.id),
    receiverId: uuid("receiver_id").notNull().references(() => users.id),
    content:    text("content").notNull(),
    sentAt:     timestamp("sent_at", { withTimezone: true }).defaultNow(),
    readAt:     timestamp("read_at", { withTimezone: true }),  // null = unread
}, (t) => [
    index("idx_friend_messages_thread").on(
        sql`LEAST(${t.senderId}, ${t.receiverId})`,
        sql`GREATEST(${t.senderId}, ${t.receiverId})`,
        t.sentAt.desc()
    ),
]);