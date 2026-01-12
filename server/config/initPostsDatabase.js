import pool from './database.js';

/**
 * Initialize Posts, Likes, and Comments tables
 * Production-ready schema for Neon PostgreSQL
 */
export const initPostsDatabase = async () => {
  try {
    console.log('🔧 Initializing Posts database schema...');

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'alumni')),
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Posts table created');

    // Create index on user_id for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    `);
    console.log('✅ Index on posts.user_id created');

    // Create index on created_at for feed ordering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    `);
    console.log('✅ Index on posts.created_at created');

    // Create post_likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        like_id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('✅ Post_likes table created');

    // Create index on post_id for faster like counts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
    `);
    console.log('✅ Index on post_likes.post_id created');

    // Create index on user_id for checking if user liked
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
    `);
    console.log('✅ Index on post_likes.user_id created');

    // Create post_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        comment_id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'alumni')),
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Post_comments table created');

    // Create index on post_id for fetching comments
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
    `);
    console.log('✅ Index on post_comments.post_id created');

    // Create index on created_at for comment ordering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);
    `);
    console.log('✅ Index on post_comments.created_at created');

    console.log('🎉 Posts database schema initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing posts database:', error.message);
    throw error;
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initPostsDatabase()
    .then(() => {
      console.log('✅ Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}
