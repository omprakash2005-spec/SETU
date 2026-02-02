
import pool from './config/database.js';
import fs from 'fs';

const checkStudent = async () => {
    try {
        console.log('🔍 Searching for AOT Alumni...');

        // Query for Academy of Technology alumni
        const res = await pool.query("SELECT * FROM college_alumni_master WHERE college_name ILIKE '%Academy of Technology%'");
        console.log(`Found ${res.rows.length} records.`);

        fs.writeFileSync('db_record_alumni.json', JSON.stringify(res.rows, null, 2));
        console.log('✅ Wrote records to db_record_alumni.json');
        console.log('Written to db_record.json');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

checkStudent();
