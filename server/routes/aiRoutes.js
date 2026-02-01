import express from "express";
import { recommendMentors } from "../controllers/ai_controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ✅ ONLY authenticate, NO role restriction
router.get("/mentor-recommend", authenticate, recommendMentors);

export default router;
