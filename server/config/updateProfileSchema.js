import pool from './database.js';

const updateProfileSchema = async () => {
    try {
        console.log('🔧 Updating users table for profile fields...');

        // Add new columns for profile data
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50),
      ADD COLUMN IF NOT EXISTS degree TEXT,
      ADD COLUMN IF NOT EXISTS experience TEXT[],
      ADD COLUMN IF NOT EXISTS education TEXT[],
      ADD COLUMN IF NOT EXISTS projects TEXT[];
    `);

        console.log('✅ Profile schema updated successfully!');
    } catch (error) {
        console.error('❌ Error updating profile schema:', error);
        throw error;
    }
};

// Run when file is executed
const runUpdate = async () => {
    try {
        await updateProfileSchema();
        process.exit(0);
    } catch (error) {
        console.error('Profile schema update failed:', error);
        process.exit(1);
    }
};

runUpdate();

export default updateProfileSchema;
