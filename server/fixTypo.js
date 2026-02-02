
import pool from './config/database.js';

const fixTypo = async () => {
    try {
        console.log('🔧 Fixing typo in college name...');

        // Correct 'Academy of Tehcnology' to 'Academy of Technology'
        const res = await pool.query(
            "UPDATE college_students_master SET college_name = 'Academy of Technology' WHERE college_name = 'Academy of Tehcnology'"
        );

        console.log(`✅ Updated ${res.rowCount} records: Fixed 'Tehcnology' -> 'Technology'`);

    } catch (err) {
        console.error('Error fixing typo:', err);
    } finally {
        pool.end();
    }
};

fixTypo();
