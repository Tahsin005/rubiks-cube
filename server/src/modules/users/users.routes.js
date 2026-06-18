import { Router } from "express";
import { getRankings } from "./users.controller.js";
import { validate } from "../../middlewares/validate.js";
import { rankingsSchema } from "./users.validation.js";
import { rateLimit } from "../../middlewares/rateLimit.js";

const router = Router();

router.get("/rankings", rateLimit(100, 60), validate(rankingsSchema), getRankings);

export default router;
