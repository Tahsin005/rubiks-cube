import { Router } from "express";
import { notificationsController } from "./notifications.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, notificationsController.getNotifications.bind(notificationsController));
router.post("/read", authenticate, notificationsController.markAsRead.bind(notificationsController));

export default router;
