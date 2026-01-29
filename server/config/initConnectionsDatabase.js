import pool from './database.js';

export const initConnectionsDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing mentor connections database schema...');

    /* 1️⃣ Base table (safe) */
    await client.query(`
      CREATE TABLE IF NOT EXISTS mentor_connections (
        connection_id SERIAL PRIMARY KEY,
        requester_id INTEGER NOT NULL,
        requester_role VARCHAR(20) CHECK (requester_role IN ('student','alumni')),
        receiver_id INTEGER,
        receiver_role VARCHAR(20) CHECK (receiver_role IN ('student','alumni')),
        mentor_name VARCHAR(255),
        mentor_skill VARCHAR(500),
        mentor_avatar TEXT,
        match_score INTEGER DEFAULT 0,
        mentor_identifier VARCHAR(255),
        request_status VARCHAR(20) DEFAULT 'pending'
          CHECK (request_status IN ('pending','accepted','rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* 2️⃣ Add missing columns safely (THIS IS THE FIX) */
    await client.query(`
      ALTER TABLE mentor_connections
        ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255);
    `);

    /* 3️⃣ Indexes (safe) */
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_requester_id
      ON mentor_connections(requester_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_receiver_id
      ON mentor_connections(receiver_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_connections_status
      ON mentor_connections(request_status);
    `);

    console.log('✅ Mentor connections DB ready (idempotent)');
  } catch (error) {
    console.error('❌ Error initializing mentor connections database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default initConnectionsDatabase;
