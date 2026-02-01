import pool from './database.js';

/**
 * This script clears the name and pronouns fields for all users
 * so they can fill them in fresh on their profile page
 */

const clearProfileNames = async () => {
    try {
        console.log('🧹 Clearing name and pronouns fields for all users...\n');

        // Update all users to have empty name and default pronouns
        const result = await pool.query(`
      UPDATE users 
      SET 
        name = '',
        pronouns = NULL
      WHERE name IS NOT NULL OR pronouns IS NOT NULL
      RETURNING id, email
    `);

        console.log(`✅ Cleared profile names for ${result.rows.length} users:\n`);

        result.rows.forEach(user => {
            console.log(`   - User ID ${user.id} (${user.email})`);
        });

        console.log('\n✅ Done! Users can now fill in their names and pronouns on the profile page.');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
};

// Run when file is executed
const run = async () => {
    try {
        await clearProfileNames();
        process.exit(0);
    } catch (error) {
        console.error('Failed:', error);
        process.exit(1);
    }
};

run();

export default clearProfileNames;
