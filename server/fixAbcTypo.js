
import pool from './config/database.js';

const fixTypo = async () => {
    try {
        console.log('🔧 Fixing Typo in College Name...');

        const query = `
            UPDATE college_alumni_master
            SET college_name = 'ABC INSTITUTE OF ENGINEERING'
            WHERE college_name ILIKE '%Enginoloigy%' OR id = 8
        `;

        const res = await pool.query(query);
        console.log(`✅ Updated ${res.rowCount} rows. Typo fixed!`);

    } catch (err) {
        console.error('Error fixing typo:', err);
    } finally {
        pool.end();
    }
};

fixTypo();
