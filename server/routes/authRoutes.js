import express from 'express';
import { register, login, logout, getProfile, updateProfile, alumniSignup, uploadProfilePicture, getUserById } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadIdCard, upload } from '../config/multer.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/alumni/signup', uploadIdCard.single('verification_document'), alumniSignup);
router.get('/users/:id', getUserById); // Public profile view

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/upload-picture', authenticate, upload.single('profile_picture'), uploadProfilePicture);

// Export router
export default router;

