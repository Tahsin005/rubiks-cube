import { z } from "zod";

export const rankingsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        minElo: z.coerce.number().int().min(0).optional(),
        minWinRate: z.coerce.number().min(0).max(100).optional(),
        maxPb: z.coerce.number().int().min(0).optional(),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        countryCode: z.string().length(2).toUpperCase().optional(),
    }),
});

export const userAchievementsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        category: z.enum(['matches', 'solves', 'social', 'elo']).optional(),
    }),
});
