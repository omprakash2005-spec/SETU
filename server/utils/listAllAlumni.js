
import pool from '../config/database.js';
import fs from 'fs';

const listAll = async () => {
    try {
        console.log('🔍 Dumping ALL Alumni records...');

        // Query ALL alumni
        const res = await pool.query("SELECT * FROM college_alumni_master");
        console.log(`Found ${res.rows.length} total records.`);

        fs.writeFileSync('db_record_full_alumni.json', JSON.stringify(res.rows, null, 2));
        console.log('✅ Wrote all records to db_record_full_alumni.json');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

listAll();
