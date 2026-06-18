import { db } from "../config/db.js";
import { eloTiers } from "./index.js";
import { sql } from "drizzle-orm";

const tiersData = [
  { name: "bronze iii", minElo: 0, maxElo: 299 },
  { name: "bronze ii", minElo: 300, maxElo: 599 },
  { name: "bronze i", minElo: 600, maxElo: 799 },
  { name: "silver iii", minElo: 800, maxElo: 899 },
  { name: "silver ii", minElo: 900, maxElo: 999 },
  { name: "silver i", minElo: 1000, maxElo: 1099 },
  { name: "gold iii", minElo: 1100, maxElo: 1199 },
  { name: "gold ii", minElo: 1200, maxElo: 1299 },
  { name: "gold i", minElo: 1300, maxElo: 1399 },
  { name: "platinum iii", minElo: 1400, maxElo: 1499 },
  { name: "platinum ii", minElo: 1500, maxElo: 1599 },
  { name: "platinum i", minElo: 1600, maxElo: 1699 },
  { name: "diamond iii", minElo: 1700, maxElo: 1799 },
  { name: "diamond ii", minElo: 1800, maxElo: 1899 },
  { name: "diamond i", minElo: 1900, maxElo: 1999 },
  { name: "master", minElo: 2000, maxElo: 2199 },
  { name: "grandmaster", minElo: 2200, maxElo: 2499 },
  { name: "cube god", minElo: 2500, maxElo: 999999 },
];

function getBadgeColor(name) {
  if (name.includes("bronze")) return "#cd7f32"; // Bronze
  if (name.includes("silver")) return "#c0c0c0"; // Silver
  if (name.includes("gold")) return "#ffd700";   // Gold
  if (name.includes("platinum")) return "#e5e4e2"; // Platinum
  if (name.includes("diamond")) return "#b9f2ff";  // Diamond
  if (name.includes("grandmaster")) return "#ff4500"; // Red-Orange
  if (name.includes("master")) return "#9370db";   // Purple
  if (name.includes("cube god")) return "#00ffff"; // Cyan/Glowing
  return "#ffffff";
}

async function seedEloTiers() {
    console.log("[Seed] Upserting Elo Tiers...");
    try {
        const values = tiersData.map(t => ({
            name: t.name,
            minElo: t.minElo,
            maxElo: t.maxElo,
            badgeColor: getBadgeColor(t.name),
        }));

        await db.insert(eloTiers)
            .values(values)
            .onConflictDoUpdate({
                target: eloTiers.name,
                set: {
                    minElo: sql`EXCLUDED.min_elo`,
                    maxElo: sql`EXCLUDED.max_elo`,
                    badgeColor: sql`EXCLUDED.badge_color`,
                }
            });

        console.log("[Seed] Elo Tiers seeded successfully.");
    } catch (err) {
        console.error("[Seed] Failed to seed Elo Tiers:", err);
    }
}

export async function runSeeders() {
    console.log("[Seed] Starting database seeders...");
    await seedEloTiers();
    console.log("[Seed] Database seeding complete.");
}
