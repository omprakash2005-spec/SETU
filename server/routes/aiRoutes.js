import express from "express";
import { recommendMentors } from "../controllers/aiController.js";

const router = express.Router();

router.post("/mentor-recommendation", recommendMentors);

export default router;
