import { Router } from "express";
import { achievementsController } from "./achievements.controller.js";
import { validate } from "../../middlewares/validate.js";
import { userAchievementsSchema } from "./achievements.validation.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, validate(userAchievementsSchema), achievementsController.getAchievements.bind(achievementsController));

export default router;
