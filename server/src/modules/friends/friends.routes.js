import { Router } from "express";
import { friendsController } from "./friends.controller.js";
import { validate } from "../../middlewares/validate.js";
import { friendsSchema, friendActionSchema } from "./friends.validation.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, validate(friendsSchema), friendsController.getFriends.bind(friendsController));

router.post("/:username", authenticate, validate(friendActionSchema), friendsController.sendFriendRequest.bind(friendsController));
router.post("/:username/accept", authenticate, validate(friendActionSchema), friendsController.acceptFriendRequest.bind(friendsController));
router.post("/:username/reject", authenticate, validate(friendActionSchema), friendsController.rejectFriendRequest.bind(friendsController));
router.delete("/:username", authenticate, validate(friendActionSchema), friendsController.removeFriend.bind(friendsController));

export default router;
