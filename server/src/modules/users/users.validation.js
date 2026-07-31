import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        countryCode: z.string().length(2).toUpperCase().optional(),
    }),
});
