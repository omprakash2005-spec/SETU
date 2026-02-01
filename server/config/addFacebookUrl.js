import pool from './database.js';

const addFacebookUrl = async () => {
    try {
        console.log('🔧 Adding facebook_url column to users table...');

        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500);
    `);

        console.log('✅ facebook_url column added successfully!');
    } catch (error) {
        console.error('❌ Error adding facebook_url column:', error);
        throw error;
    }
};

const run = async () => {
    try {
        await addFacebookUrl();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();

export default addFacebookUrl;
