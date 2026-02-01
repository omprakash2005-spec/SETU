import pool from './config/database.js';

async function checkRecentUsers() {
  try {
    console.log('🕐 Checking users created after 14:25 (2:25 PM)...\n');

    const usersResult = await pool.query(
      `SELECT id, name, email, role, created_at 
       FROM users 
       WHERE created_at > '2026-01-29 14:25:00'
       ORDER BY created_at DESC`
    );
    
    console.log('📊 USERS table (after 2:25 PM):');
    if (usersResult.rows.length > 0) {
      console.log(`✅ Found ${usersResult.rows.length} users:`);
      usersResult.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`);
      });
    } else {
      console.log('  ℹ️  No users created after 2:25 PM');
    }

    const studentsResult = await pool.query(
      `SELECT student_id, full_name, email, created_at 
       FROM students 
       WHERE created_at > '2026-01-29 14:25:00'
       ORDER BY created_at DESC`
    ).catch(() => ({ rows: [] }));

    console.log('\n📊 STUDENTS table (after 2:25 PM):');
    if (studentsResult.rows.length > 0) {
      console.log(`❌ Found ${studentsResult.rows.length} students (should be 0!):`);
      studentsResult.rows.forEach((student, index) => {
        console.log(`  ${index + 1}. Name: ${student.full_name}, Email: ${student.email}, Created: ${student.created_at}`);
      });
    } else {
      console.log('  ✅ No students created after 2:25 PM (this is correct!)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRecentUsers();
