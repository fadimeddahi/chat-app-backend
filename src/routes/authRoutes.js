import express from "express";
import {
  signup,
  login,
  logout,
  update,
    check,
} from "../controllers/authController.js";
import protectedRoute from "../middleware/protectedRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update", protectedRoute, update);

router.get("/check", protectedRoute, check);

export default router;
