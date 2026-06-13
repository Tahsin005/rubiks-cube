import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const eloTiers = pgTable("elo_tiers", {
    id:         serial("id").primaryKey(),
    name:       text("name").notNull(),
    minElo:     integer("min_elo").notNull(),
    maxElo:     integer("max_elo").notNull(),
    badgeColor: text("badge_color"),
    iconUrl:    text("icon_url"),
});