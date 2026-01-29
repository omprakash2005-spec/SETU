import pool from './config/database.js';

const checkSchema = async () => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mentor_connections'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 mentor_connections table schema:');
    console.log('=====================================');
    result.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log('=====================================\n');
    
    // Also check if there are any existing records
    const count = await pool.query('SELECT COUNT(*) FROM mentor_connections');
    console.log(`Total records: ${count.rows[0].count}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkSchema();
