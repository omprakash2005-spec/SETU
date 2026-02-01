import pool from './config/database.js';

// Check master database records
console.log('🔍 Checking Master Database...\n');

const checkMaster = async () => {
    try {
        const students = await pool.query('SELECT * FROM college_students_master');
        console.log('📚 Student Master Records:');
        console.log(students.rows);
        console.log('\n');

        // Check if Om Prakash Mishra is in master DB
        const omRecord = await pool.query(
            "SELECT * FROM college_students_master WHERE college_id = 'AOT/CSE/2023/081'"
        );
        console.log('🔎 Om Prakash Mishra Record:');
        console.log(omRecord.rows);
        console.log('\n');

        // Check users table for Om Prakash
        const users = await pool.query(
            "SELECT id, name, email, verification_status, is_verified FROM users WHERE name ILIKE '%om%prakash%'"
        );
        console.log('👤 Users matching "Om Prakash":');
        console.log(users.rows);
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkMaster();
