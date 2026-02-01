import express from 'express';
import {
  createJob,
  requestJobPosting,
  approveJobRequest,
  rejectJobRequest,
  applyForJob,
  getAllJobs,
  getJobById,
  getPendingJobRequests,
  getMyApplications,
  getMyJobRequests,
  getJobApplications,
  deleteJob,
  deletePendingJobRequest,
} from '../controllers/jobController.js';
import { authenticate, isAdmin, isAlumni, isStudent, isStudentOrAlumni } from '../middleware/auth.js';

const router = express.Router();

/* =========================
   PUBLIC/AUTHENTICATED ROUTES
   ========================= */

// Get all approved jobs (accessible to all authenticated users)
router.get('/', authenticate, getAllJobs);

// Get specific job by ID (accessible to all authenticated users)
router.get('/:jobId', authenticate, getJobById);

/* =========================
   ADMIN ROUTES
   ========================= */

// Create and publish job directly (admin only)
router.post('/create', authenticate, isAdmin, createJob);

// Get pending job requests for approval (admin only)
router.get('/pending/requests', authenticate, isAdmin, getPendingJobRequests);

// Approve alumni job request (admin only)
router.post('/approve/:requestId', authenticate, isAdmin, approveJobRequest);

// Reject alumni job request (admin only)
router.post('/reject/:requestId', authenticate, isAdmin, rejectJobRequest);

/* =========================
   ALUMNI ROUTES
   ========================= */

// Submit job posting request (alumni only)
router.post('/request', authenticate, isAlumni, requestJobPosting);

// Get my job requests (alumni only)
router.get('/my/requests', authenticate, isAlumni, getMyJobRequests);

/* =========================
   STUDENT & ALUMNI ROUTES
   ========================= */

// Apply for a job (students and alumni only)
router.post('/apply/:jobId', authenticate, isStudentOrAlumni, applyForJob);

// Get my job applications (students and alumni)
router.get('/my/applications', authenticate, isStudentOrAlumni, getMyApplications);

/* =========================
   JOB MANAGEMENT ROUTES
   ========================= */

// Get applications for a specific job (admin or job poster only)
router.get('/:jobId/applications', authenticate, getJobApplications);

// Delete a job (admin or job poster only)
router.delete('/:jobId', authenticate, deleteJob);

// Delete pending job request (alumni - their own pending requests, or admin)
router.delete('/pending/request/:requestId', authenticate, deletePendingJobRequest);

export default router;
