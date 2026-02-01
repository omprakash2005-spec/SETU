import express from 'express';
import {
  createCheckoutSession,
  handleStripeWebhook,
  verifyPayment,
  getRecentDonationsController,
  getDonationAnalytics,
  getAlumniDonationsController,
} from '../controllers/donationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Webhook route - MUST be before express.json() middleware
// This is handled separately in server.js with raw body parser
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes (require authentication)
router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.get('/verify/:sessionId', authenticate, verifyPayment);
router.get('/recent', getRecentDonationsController); // Public - shows recent donations
router.get('/analytics', getDonationAnalytics); // Public or protected based on needs
router.get('/alumni/:alumniUid', authenticate, getAlumniDonationsController);

export default router;
