import express from 'express';
import {
  studentSignup,
  studentLogin,
} from '../controllers/studentAuthController.js';
import { uploadIdCard } from '../config/multer.js';

const router = express.Router();

/**
 * Student Authentication Routes
 * Separate from regular auth routes to avoid conflicts
 */

// Student signup with ID card upload (no OTP required)
router.post('/signup', uploadIdCard.single('student_id_card'), studentSignup);

// Student login (after signup)
router.post('/login', studentLogin);

export default router;
