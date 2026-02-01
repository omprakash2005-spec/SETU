import pool from './database.js';

/**
 * This script will show you which user you're logged in as
 * and update their profile name if needed
 */

const fixUserName = async () => {
    try {
        console.log('🔍 Checking all users in database...\n');

        const result = await pool.query('SELECT id, name, email FROM users ORDER BY id');

        console.log('Found users:');
        console.log('═══════════════════════════════════════════════════════\n');

        result.rows.forEach((user, index) => {
            console.log(`${index + 1}. User ID: ${user.id}`);
            console.log(`   Name: "${user.name}"`);
            console.log(`   Email: ${user.email}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════\n');
        console.log('To fix a user\'s name:');
        console.log('1. Note the User ID from above');
        console.log('2. Login to your app as that user');
        console.log('3. Go to Profile page');
        console.log('4. Click "Edit Profile"');
        console.log('5. Change the name to the correct one');
        console.log('6. Click "Save"\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
};

fixUserName();
