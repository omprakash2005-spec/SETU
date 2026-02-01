import pool from '../config/database.js';

/**
 * Migration script to update mentor_connections table for two-sided connections
 * Run this script once to migrate existing data
 */

const migrateConnections = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting mentor_connections migration...');

    // Start transaction
    await client.query('BEGIN');

    // Check if new columns already exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mentor_connections' 
        AND column_name IN ('requester_id', 'receiver_id', 'request_status')
    `);

    if (columnCheck.rows.length === 3) {
      console.log('✅ Migration already completed. Skipping...');
      await client.query('ROLLBACK');
      return;
    }

    // Add new columns if they don't exist
    console.log('📝 Adding new columns...');
    
    await client.query(`
      ALTER TABLE mentor_connections 
      ADD COLUMN IF NOT EXISTS requester_id INTEGER,
      ADD COLUMN IF NOT EXISTS requester_role VARCHAR(20) CHECK (requester_role IN ('student', 'alumni')),
      ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS receiver_id INTEGER,
      ADD COLUMN IF NOT EXISTS receiver_role VARCHAR(20) CHECK (receiver_role IN ('student', 'alumni')),
      ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS request_status VARCHAR(20) DEFAULT 'accepted' CHECK (request_status IN ('pending', 'accepted', 'rejected')),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Migrate existing data: treat existing connections as already accepted
    console.log('📊 Migrating existing data...');
    
    await client.query(`
      UPDATE mentor_connections 
      SET 
        requester_id = user_id,
        requester_role = user_role,
        request_status = 'accepted'
      WHERE requester_id IS NULL
    `);

    // Create new indexes
    console.log('🔧 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_requester_id 
      ON mentor_connections(requester_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_receiver_id 
      ON mentor_connections(receiver_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_status 
      ON mentor_connections(request_status)
    `);

    // Drop old indexes if they exist
    console.log('🗑️ Cleaning up old indexes...');
    
    await client.query(`DROP INDEX IF EXISTS idx_connections_user_id`);
    await client.query(`DROP INDEX IF EXISTS idx_connections_user_role`);

    // Commit transaction
    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Added requester_id, receiver_id columns');
    console.log('   - Added request_status column (pending/accepted/rejected)');
    console.log('   - Migrated existing connections as "accepted"');
    console.log('   - Updated indexes for better performance');

    // Display current state
    const stats = await client.query(`
      SELECT 
        request_status, 
        COUNT(*) as count 
      FROM mentor_connections 
      GROUP BY request_status
    `);

    console.log('\n📊 Current connections state:');
    stats.rows.forEach(row => {
      console.log(`   ${row.request_status}: ${row.count}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
};

// Run migration
migrateConnections().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
