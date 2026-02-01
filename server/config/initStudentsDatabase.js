import pool from './database.js';

/**
 * Initialize Students Database Schema
 * Creates tables for student signup with OTP verification
 * Safe for existing databases - uses IF NOT EXISTS
 */

export const initStudentsDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing students database schema...');

    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        roll_number VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        graduation_year INTEGER NOT NULL,
        student_id_card_url TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Students table created/verified');

    // Create student_email_otps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_email_otps (
        otp_id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_pending_otp UNIQUE (email, verified)
      );
    `);
    console.log('✅ Student OTP table created/verified');

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_email 
      ON students(email);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_roll_number 
      ON students(roll_number);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_otp_email_verified 
      ON student_email_otps(email, verified);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_otp_expires_at 
      ON student_email_otps(expires_at);
    `);

    console.log('✅ Indexes created/verified');

    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_students_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS students_updated_at_trigger ON students;
    `);

    await client.query(`
      CREATE TRIGGER students_updated_at_trigger
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE FUNCTION update_students_updated_at();
    `);

    console.log('✅ Triggers created/verified');

    console.log('✅ Students database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing students database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initStudentsDatabase()
    .then(() => {
      console.log('✅ Students database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Students database setup failed:', error);
      process.exit(1);
    });
}
