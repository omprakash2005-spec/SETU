import express from 'express';
import multer from 'multer';
import { 
  adminLogin, 
  createAdmin, 
  getAdminProfile, 
  getAllUsers, 
  getDirectory, 
  exportDirectoryCSV, 
  exportDirectoryExcel, 
  exportDirectoryPDF, 
  importDirectoryCSV, 
  getAnalyticsKPIs, 
  getUserRegistrationsTrend, 
  getAlumniByDepartment, 
  getUsersByRole, 
  getPostsActivity,
  getAlumniVerificationStatus,
  getStudentSkills
} from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
});

// Public routes
router.post('/login', adminLogin);

// Protected admin routes
router.get('/profile', authenticate, isAdmin, getAdminProfile);
router.post('/create', authenticate, isAdmin, createAdmin);
router.get('/users', authenticate, isAdmin, getAllUsers);

// Directory routes
router.get('/directory', authenticate, isAdmin, getDirectory);
router.get('/directory/export/csv', authenticate, isAdmin, exportDirectoryCSV);
router.get('/directory/export/excel', authenticate, isAdmin, exportDirectoryExcel);
router.get('/directory/export/pdf', authenticate, isAdmin, exportDirectoryPDF);
router.post('/directory/import/csv', authenticate, isAdmin, upload.single('file'), importDirectoryCSV);

// Analytics routes
router.get('/analytics/kpis', authenticate, isAdmin, getAnalyticsKPIs);
router.get('/analytics/registrations-trend', authenticate, isAdmin, getUserRegistrationsTrend);
router.get('/analytics/alumni-by-department', authenticate, isAdmin, getAlumniByDepartment);
router.get('/analytics/users-by-role', authenticate, isAdmin, getUsersByRole);
router.get('/analytics/posts-activity', authenticate, isAdmin, getPostsActivity);
router.get('/analytics/alumni-verification-status', authenticate, isAdmin, getAlumniVerificationStatus);
router.get('/analytics/student-skills', authenticate, isAdmin, getStudentSkills);

export default router;
