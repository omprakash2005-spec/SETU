import pool from './database.js';

const checkUserName = async () => {
    try {
        // Find user by email containing 'antara'
        const result = await pool.query(
            "SELECT id, name, email FROM users WHERE LOWER(email) LIKE '%antara%' OR LOWER(name) LIKE '%antara%'"
        );

        if (result.rows.length > 0) {
            console.log('\n📋 Found users matching "antara":');
            result.rows.forEach(user => {
                console.log(`\nUser ID: ${user.id}`);
                console.log(`Name in DB: "${user.name}"`);
                console.log(`Email: ${user.email}`);
            });
        } else {
            console.log('\n❌ No users found with "antara" in name or email');
            console.log('\nShowing all users:');
            const allUsers = await pool.query('SELECT id, name, email FROM users ORDER BY id');
            allUsers.rows.forEach(user => {
                console.log(`\nUser ID: ${user.id}`);
                console.log(`Name: "${user.name}"`);
                console.log(`Email: ${user.email}`);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

checkUserName();
