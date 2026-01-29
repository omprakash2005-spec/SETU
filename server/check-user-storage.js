import pool from './config/database.js';

async function checkUserStorage() {
    try {
        console.log('🔍 Checking where the latest user was stored...\n');

        // Check users table
        console.log('📊 Checking USERS table:');
        const usersResult = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        );

        if (usersResult.rows.length > 0) {
            console.log(`Found ${usersResult.rows.length} recent users in USERS table:`);
            usersResult.rows.forEach((user, index) => {
                console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`);
            });
        } else {
            console.log('  ❌ No users found in USERS table');
        }

        console.log('\n📊 Checking STUDENTS table:');
        // Check students table
        const studentsResult = await pool.query(
            'SELECT student_id, full_name, email, created_at FROM students ORDER BY created_at DESC LIMIT 5'
        ).catch(err => {
            console.log('  ⚠️ STUDENTS table does not exist or error:', err.message);
            return { rows: [] };
        });

        if (studentsResult.rows.length > 0) {
            console.log(`Found ${studentsResult.rows.length} recent students in STUDENTS table:`);
            studentsResult.rows.forEach((student, index) => {
                console.log(`  ${index + 1}. ID: ${student.student_id}, Name: ${student.full_name}, Email: ${student.email}, Created: ${student.created_at}`);
            });
        } else {
            console.log('  ✅ No users found in STUDENTS table (this is good!)');
        }

        console.log('\n✅ Inspection complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking user storage:', error.message);
        process.exit(1);
    }
}

checkUserStorage();
