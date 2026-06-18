import { z } from "zod";

export const rankingsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(10),
        search: z.string().optional(),
        minElo: z.coerce.number().int().min(0).optional(),
        minWinRate: z.coerce.number().min(0).max(100).optional(),
        maxPb: z.coerce.number().int().min(0).optional(),
    }),
});
