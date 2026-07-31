import { z } from "zod";

export const userAchievementsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        category: z.enum(['matches', 'solves', 'social', 'elo']).optional(),
        username: z.string().optional(), // if provided, fetch for that user instead
    }),
});
