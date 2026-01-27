import express from "express";
import { authenticate, isStudent } from "../middleware/auth.js";

import { recommendMentors } from "../controllers/ai_controller.js";

const router = express.Router();

router.get("/mentor-recommend", authenticate, isStudent, recommendMentors);

export default router;
