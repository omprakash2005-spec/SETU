-- ============================================
-- SETU Feed System - Database Schema
-- Production-ready for Neon PostgreSQL
-- ============================================

-- ============================================
-- TABLE: posts
-- Stores all user posts (text + optional image)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  post_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'alumni')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- TABLE: post_likes
-- Stores likes on posts (one per user per post)
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  like_id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ============================================
-- TABLE: post_comments
-- Stores comments on posts
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
  comment_id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'alumni')),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);

-- ============================================
-- NOTES:
-- ============================================
-- 1. All tables use CASCADE on delete to maintain referential integrity
-- 2. Indexes added for common query patterns (feed ordering, like counts, etc.)
-- 3. user_role stored in posts/comments for display (no JOIN needed)
-- 4. image_url stores Cloudinary URL (NOT local filesystem path)
-- 5. UNIQUE constraint on post_likes prevents duplicate likes
-- 6. All timestamps use PostgreSQL CURRENT_TIMESTAMP
-- ============================================
