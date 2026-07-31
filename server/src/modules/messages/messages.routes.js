import { Router } from "express";
import { messagesController } from "./messages.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, messagesController.getConversations.bind(messagesController));
router.get("/:friendUsername", authenticate, messagesController.getMessagesWithUser.bind(messagesController));
router.post("/:friendUsername/read", authenticate, messagesController.markAsRead.bind(messagesController));

export default router;
