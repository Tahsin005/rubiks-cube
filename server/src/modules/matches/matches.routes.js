import { Router } from "express";
import { matchesController } from "./matches.controller.js";
import { validate } from "../../middlewares/validate.js";
import { matchHistorySchema } from "./matches.validation.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, validate(matchHistorySchema), matchesController.getMatchHistory.bind(matchesController));

export default router;
