import { Router } from "express";
import { usersController } from "./users.controller.js";
import { validate } from "../../middlewares/validate.js";
import { updateProfileSchema } from "./users.validation.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { upload } from "../../middlewares/upload.js";

const router = Router();

router.get("/:username", authenticate, usersController.getProfile.bind(usersController));
router.patch("/", authenticate, upload.single("avatar"), validate(updateProfileSchema), usersController.updateProfile.bind(usersController));

export default router;
