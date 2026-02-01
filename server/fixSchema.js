import pool from './config/database.js';

const fixSchema = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing mentor_connections table constraints...\n');
    
    await client.query('BEGIN');
    
    // First, migrate existing data
    console.log('📝 Migrating existing data...');
    await client.query(`
      UPDATE mentor_connections 
      SET 
        requester_id = COALESCE(requester_id, user_id),
        requester_role = COALESCE(requester_role, user_role),
        requester_name = COALESCE(requester_name, mentor_name),
        request_status = COALESCE(request_status, 'accepted')
      WHERE requester_id IS NULL
    `);
    console.log('✅ Existing data migrated');
    
    // Remove NOT NULL constraints from old columns
    console.log('📝 Removing NOT NULL constraints from legacy columns...');
    await client.query(`
      ALTER TABLE mentor_connections 
        ALTER COLUMN user_id DROP NOT NULL,
        ALTER COLUMN user_role DROP NOT NULL,
        ALTER COLUMN mentor_name DROP NOT NULL
    `);
    console.log('✅ Constraints removed');
    
    // Ensure requester_id is NOT NULL
    console.log('📝 Setting requester_id as NOT NULL...');
    await client.query(`
      ALTER TABLE mentor_connections 
        ALTER COLUMN requester_id SET NOT NULL
    `);
    console.log('✅ requester_id is now NOT NULL');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Schema fix completed successfully!');
    console.log('📋 You can now create connection requests\n');
    
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

fixSchema();
