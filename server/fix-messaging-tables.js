import pool from './config/database.js';

/**
 * Manually create message_attachments table if missing
 * Run with: node server/fix-messaging-tables.js
 */

const fixTables = async () => {
    const client = await pool.connect();

    try {
        console.log('\n🔧 Fixing messaging tables...\n');

        // Create message_attachments table
        await client.query(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        attachment_id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        original_filename VARCHAR(255),
        mime_type VARCHAR(100),
        cloudinary_public_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✅ message_attachments table created');

        // Create index
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_message
      ON message_attachments(message_id);
    `);

        console.log('✅ Index created on message_attachments');

        // Verify all tables exist
        const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages', 'message_attachments')
      ORDER BY table_name
    `);

        console.log('\n📊 Messaging tables status:');
        result.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });

        console.log('\n✅ All messaging tables are ready!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

fixTables();
