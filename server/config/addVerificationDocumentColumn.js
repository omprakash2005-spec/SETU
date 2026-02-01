import pool from './database.js';

const addVerificationDocumentColumn = async () => {
  try {
    console.log('🔧 Adding verification_document column to users table...');

    // Add verification_document column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS verification_document VARCHAR(500);
    `);

    console.log('✅ verification_document column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
};

addVerificationDocumentColumn();
