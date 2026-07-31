import { Router } from "express";
import { rankingsController } from "./rankings.controller.js";
import { validate } from "../../middlewares/validate.js";
import { rankingsSchema } from "./rankings.validation.js";
import { rateLimit } from "../../middlewares/rateLimit.js";

const router = Router();

router.get("/", rateLimit(100, 60), validate(rankingsSchema), rankingsController.getRankings.bind(rankingsController));

export default router;
