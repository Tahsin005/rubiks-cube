import { pgTable, uuid, text, timestamp, index, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(), // e.g., 'MESSAGE', 'FRIEND_REQUEST', 'MATCH_CHALLENGE'
    message: text("message").notNull(),
    relatedEntityId: uuid("related_entity_id"), // ID of the related object (e.g., friend_requests.id)
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
    index("idx_notifications_user").on(t.userId),
]);
