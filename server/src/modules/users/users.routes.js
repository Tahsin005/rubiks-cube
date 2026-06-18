import { Router } from "express";
import { getRankings, getProfile } from "./users.controller.js";
import { validate } from "../../middlewares/validate.js";
import { rankingsSchema } from "./users.validation.js";
import { rateLimit } from "../../middlewares/rateLimit.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.get("/rankings", rateLimit(100, 60), validate(rankingsSchema), getRankings);
router.get("/profile/:username", authenticate, getProfile);

export default router;
