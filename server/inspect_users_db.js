import pool from './config/database.js';
import fs from 'fs';

const inspectSchema = async () => {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);
        fs.writeFileSync('users_schema_dump.json', JSON.stringify(result.rows, null, 2));
        console.log('Schema written to users_schema_dump.json');
        process.exit(0);
    } catch (error) {
        console.error('Error inspecting schema:', error);
        process.exit(1);
    }
};

inspectSchema();
