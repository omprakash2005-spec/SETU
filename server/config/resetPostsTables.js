import pool from './database.js';

const resetTables = async () => {
  try {
    console.log('🗑️ Dropping existing posts tables...');
    
    await pool.query('DROP TABLE IF EXISTS post_comments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS post_likes CASCADE;');
    await pool.query('DROP TABLE IF EXISTS posts CASCADE;');
    
    console.log('✅ Tables dropped successfully');
    
    console.log('🔧 Creating new tables with correct schema...');
    
    // Create posts table with correct columns
    await pool.query(`
      CREATE TABLE posts (
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
    
    // Create indexes
    await pool.query('CREATE INDEX idx_posts_user_id ON posts(user_id);');
    await pool.query('CREATE INDEX idx_posts_created_at ON posts(created_at DESC);');
    console.log('✅ Indexes created');
    
    // Create post_likes table
    await pool.query(`
      CREATE TABLE post_likes (
        like_id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('✅ Post_likes table created');
    
    await pool.query('CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);');
    await pool.query('CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);');
    console.log('✅ Post_likes indexes created');
    
    // Create post_comments table
    await pool.query(`
      CREATE TABLE post_comments (
        comment_id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'alumni')),
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Post_comments table created');
    
    await pool.query('CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);');
    await pool.query('CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);');
    console.log('✅ Post_comments indexes created');
    
    console.log('🎉 All tables reset successfully!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting tables:', error);
    await pool.end();
    process.exit(1);
  }
};

resetTables();
