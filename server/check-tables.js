import pool from './config/database.js';

const checkTables = async () => {
    const client = await pool.connect();

    try {
        const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'messages', 'message_attachments')
      ORDER BY table_name
    `);

        console.log('\n=== MESSAGING TABLES CHECK ===\n');

        const tables = result.rows.map(r => r.table_name);
        const required = ['conversations', 'messages', 'message_attachments'];

        required.forEach(table => {
            if (tables.includes(table)) {
                console.log(`✅ ${table} - EXISTS`);
            } else {
                console.log(`❌ ${table} - MISSING`);
            }
        });

        if (tables.length === 0) {
            console.log('\n⚠️  MESSAGING TABLES NOT CREATED YET');
            console.log('\nThe server needs to be restarted to initialize messaging tables.');
            console.log('The initMessagingDatabase() function runs on server startup.\n');
        } else if (tables.length === 3) {
            console.log('\n✅ All messaging tables exist!\n');
        } else {
            console.log('\n⚠️  Some messaging tables are missing. Restart the server.\n');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
};

checkTables();
