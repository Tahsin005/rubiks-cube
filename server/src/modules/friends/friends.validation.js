import { z } from "zod";

export const friendsSchema = z.object({
    query: z.object({
        page:   z.coerce.number().int().min(1).default(1),
        limit:  z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum(['pending', 'accepted', 'blocked']).optional(),
    }),
});

export const friendActionSchema = z.object({
    params: z.object({
        username: z.string(),
    }),
});
