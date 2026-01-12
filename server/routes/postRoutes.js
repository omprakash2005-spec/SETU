import express from 'express';
import { authenticate, isStudentOrAlumni } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import {
  createPost,
  getPosts,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  getComments,
} from '../controllers/postController.js';

const router = express.Router();

/**
 * POST ROUTES
 */

// Create a new post (with optional image)
// Multer middleware processes the image upload to memory
router.post(
  '/',
  authenticate,
  isStudentOrAlumni,
  upload.single('image'), // 'image' is the field name in FormData
  createPost
);

// Get paginated feed
router.get('/', authenticate, getPosts);

// Delete a post (author or admin only)
router.delete('/:postId', authenticate, deletePost);

/**
 * LIKE ROUTES
 */

// Like a post
router.post('/:postId/like', authenticate, isStudentOrAlumni, likePost);

// Unlike a post
router.delete('/:postId/like', authenticate, isStudentOrAlumni, unlikePost);

/**
 * COMMENT ROUTES
 */

// Add a comment
router.post('/:postId/comments', authenticate, isStudentOrAlumni, addComment);

// Get comments for a post
router.get('/:postId/comments', authenticate, getComments);

export default router;
