import pool from '../config/database.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Create a new post (text + optional image)
 * POST /api/posts
 */
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const { id: userId, role } = req.user;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required',
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Post content exceeds maximum length of 5000 characters',
      });
    }

    // Check user role
    if (role !== 'student' && role !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only students and alumni can create posts',
      });
    }

    let imageUrl = null;

    // Handle image upload if present
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer);
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
        });
      }
    }

    // Insert post into database and fetch author details
    const result = await pool.query(
      `INSERT INTO posts (user_id, user_role, content, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING post_id, user_id, user_role, content, image_url, created_at`,
      [userId, role, content.trim(), imageUrl]
    );

    const post = result.rows[0];

    // Fetch author details
    const authorResult = await pool.query(
      'SELECT name, profile_image FROM users WHERE id = $1',
      [userId]
    );

    const author = authorResult.rows[0] || {};

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        ...post,
        author_name: author.name || null,
        author_avatar: author.profile_image || null,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
    });
  }
};

/**
 * Get paginated feed
 * GET /api/posts?page=1&limit=10
 */
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { id: userId } = req.user;

    // Validate pagination
    if (limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum limit is 50 posts per page',
      });
    }

    // Get posts with likes/comments counts, user's like status, and author profile info
    const result = await pool.query(
      `SELECT 
        p.post_id,
        p.user_id,
        p.user_role,
        p.content,
        p.image_url,
        p.created_at,
        u.name AS author_name,
        u.profile_image AS author_avatar,
        COALESCE(COUNT(DISTINCT pl.like_id), 0)::int AS likes_count,
        COALESCE(COUNT(DISTINCT pc.comment_id), 0)::int AS comments_count,
        EXISTS(
          SELECT 1 FROM post_likes 
          WHERE post_id = p.post_id AND user_id = $1
        ) AS is_liked
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN post_likes pl ON p.post_id = pl.post_id
       LEFT JOIN post_comments pc ON p.post_id = pc.post_id
       GROUP BY p.post_id, u.name, u.profile_image
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      posts: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

/**
 * Delete a post
 * DELETE /api/posts/:postId
 * Author or admin only
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { id: userId, role } = req.user;

    // Get post details
    const postResult = await pool.query(
      'SELECT user_id, image_url FROM posts WHERE post_id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const post = postResult.rows[0];

    // Check permissions (author or admin)
    if (post.user_id !== userId && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this post',
      });
    }

    // Delete image from Cloudinary if exists
    if (post.image_url) {
      await deleteFromCloudinary(post.image_url);
    }

    // Delete post (cascades to likes and comments)
    await pool.query('DELETE FROM posts WHERE post_id = $1', [postId]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    });
  }
};

/**
 * Like a post
 * POST /api/posts/:postId/like
 */
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { id: userId } = req.user;

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT post_id FROM posts WHERE post_id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if already liked
    const likeCheck = await pool.query(
      'SELECT like_id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (likeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post',
      });
    }

    // Add like
    await pool.query(
      'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)',
      [postId, userId]
    );

    // Get updated likes count
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS likes_count FROM post_likes WHERE post_id = $1',
      [postId]
    );

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      likes_count: countResult.rows[0].likes_count,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
    });
  }
};

/**
 * Unlike a post
 * DELETE /api/posts/:postId/like
 */
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { id: userId } = req.user;

    // Delete like
    const result = await pool.query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING like_id',
      [postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post',
      });
    }

    // Get updated likes count
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS likes_count FROM post_likes WHERE post_id = $1',
      [postId]
    );

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      likes_count: countResult.rows[0].likes_count,
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike post',
    });
  }
};

/**
 * Add a comment to a post
 * POST /api/posts/:postId/comments
 */
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment_text } = req.body;
    const { id: userId, role } = req.user;

    // Validate comment
    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    if (comment_text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment exceeds maximum length of 1000 characters',
      });
    }

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT post_id FROM posts WHERE post_id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check user role
    if (role !== 'student' && role !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only students and alumni can comment',
      });
    }

    // Add comment
    const result = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, user_role, comment_text)
       VALUES ($1, $2, $3, $4)
       RETURNING comment_id, post_id, user_id, user_role, comment_text, created_at`,
      [postId, userId, role, comment_text.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: result.rows[0],
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
    });
  }
};

/**
 * Get comments for a post
 * GET /api/posts/:postId/comments
 */
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT post_id FROM posts WHERE post_id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Get comments
    const result = await pool.query(
      `SELECT comment_id, post_id, user_id, user_role, comment_text, created_at
       FROM post_comments
       WHERE post_id = $1
       ORDER BY created_at ASC`,
      [postId]
    );

    res.status(200).json({
      success: true,
      comments: result.rows,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
    });
  }
};
