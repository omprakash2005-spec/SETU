import pool from './config/database.js';

const addUpdatedAtColumn = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding updated_at column...\n');
    
    await client.query(`
      ALTER TABLE mentor_connections 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    console.log('✅ updated_at column added successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

addUpdatedAtColumn();
