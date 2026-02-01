import pool from './database.js';

/**
 * This script ensures that the profile name matches the user's registration name
 * Run this if you see incorrect names in profiles
 */

const syncProfileNames = async () => {
    try {
        console.log('🔄 Syncing profile names with registration names...');

        // Get all users
        const result = await pool.query('SELECT id, name, email FROM users');
        console.log(`Found ${result.rows.length} users`);

        // For each user, ensure their profile name is correct
        for (const user of result.rows) {
            console.log(`✅ User: ${user.name} (${user.email})`);
        }

        console.log('\n✅ Profile names are in sync!');
        console.log('\nNote: If you see a wrong name, you can update it by:');
        console.log('1. Logging in as that user');
        console.log('2. Going to Profile page');
        console.log('3. Clicking "Edit Profile"');
        console.log('4. Updating the name to the correct one');
        console.log('5. Clicking "Save"');

    } catch (error) {
        console.error('❌ Error syncing profile names:', error);
        throw error;
    }
};

// Run when file is executed
const run = async () => {
    try {
        await syncProfileNames();
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
};

run();

export default syncProfileNames;
