import express from 'express';
import {
  createConnection,
  getConnections,
  checkConnection,
  deleteConnection,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
} from '../controllers/connectionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create new connection request
router.post('/', createConnection);

// Get all accepted connections for current user
router.get('/', getConnections);

// Get pending connection requests (incoming)
router.get('/requests/pending', getPendingRequests);

// Accept a connection request
router.post('/accept/:requestId', acceptRequest);

// Reject a connection request
router.post('/reject/:requestId', rejectRequest);

// Check if connected with specific mentor
router.get('/check/:mentorName', checkConnection);

// Delete connection
router.delete('/:connectionId', deleteConnection);

export default router;
