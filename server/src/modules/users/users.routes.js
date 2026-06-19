import { Router } from "express";
import { getRankings, getProfile, updateProfile, getAchievements, getFriends, sendFriendRequest, acceptFriendRequest, removeFriend } from "./users.controller.js";
import { validate } from "../../middlewares/validate.js";
import { rankingsSchema, updateProfileSchema, userAchievementsSchema, friendsSchema, friendActionSchema } from "./users.validation.js";
import { rateLimit } from "../../middlewares/rateLimit.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { upload } from "../../middlewares/upload.js";

const router = Router();

router.get("/rankings", rateLimit(100, 60), validate(rankingsSchema), getRankings);
router.get("/profile/:username", authenticate, getProfile);
router.patch("/profile", authenticate, upload.single("avatar"), validate(updateProfileSchema), updateProfile);
router.get("/me/achievements", authenticate, validate(userAchievementsSchema), getAchievements);
router.get("/me/friends",      authenticate, validate(friendsSchema), getFriends);

router.post("/me/friends/:username", authenticate, validate(friendActionSchema), sendFriendRequest);
router.post("/me/friends/:username/accept", authenticate, validate(friendActionSchema), acceptFriendRequest);
router.delete("/me/friends/:username", authenticate, validate(friendActionSchema), removeFriend);

export default router;
