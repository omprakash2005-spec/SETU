import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    saveUserLocation,
    getMyLocation,
    getNearbyConnections,
    deleteMyLocation,
} from '../controllers/locationController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Save or update location
router.post('/', saveUserLocation);

// Get current user's location
router.get('/me', getMyLocation);

// Get nearby connected users
router.get('/nearby', getNearbyConnections);

// Delete location
router.delete('/me', deleteMyLocation);

export default router;
