import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
    check,
} from "../controllers/authController.js";
import protectedRoute from "../middleware/protectedRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update", protectedRoute, updateProfile);

router.get("/check", protectedRoute, check);

export default router;
