import express from "express";
import { getUsers } from "../controllers/messageController.js";
import protectedRoute from "../middleware/protectedRoute.js";
import { getMessages } from "../controllers/messageController.js";
import { sendMessage } from "../controllers/messageController.js";



const router = express.Router();

router.get("/users", protectedRoute, getUsers);
router.get("/:id", protectedRoute, getMessages);
router.post("/send/:id", protectedRoute, sendMessage);

export default router;

