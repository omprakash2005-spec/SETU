import pool from './database.js';

export const initVerificationDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing verification database schema...');

    // 1. Add verification_status to users table if not exists
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_status') THEN
              ALTER TABLE users ADD COLUMN verification_status VARCHAR(20) DEFAULT 'PENDING';
          END IF;
      END $$;
    `);
    console.log('✅ users table updated with verification_status');

    // 2. Create college_students_master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS college_students_master (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        roll_number VARCHAR(50) UNIQUE,
        college_id VARCHAR(50) UNIQUE,
        college_name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ college_students_master table created');

    // 3. Create college_alumni_master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS college_alumni_master (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        roll_number VARCHAR(50),
        college_id VARCHAR(50),
        college_name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        passing_year INTEGER NOT NULL,
        registration_number VARCHAR(50),
        degree VARCHAR(100),
        university_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ college_alumni_master table created');

    // 4. Seeding Dummy Data for Testing (Idempotent insert)
    await client.query(`
      INSERT INTO college_students_master (full_name, roll_number, college_id, college_name, department)
      VALUES 
        ('Rahul Kumar', 'R12345', 'AOT123', 'ACADEMY OF TECHNOLOGY', 'CSE'),
        ('Priya Sharma', 'R67890', 'AOT124', 'ACADEMY OF TECHNOLOGY', 'ECE'),
        ('Om Prakash Mishra', '999999', 'AOT/CSE/2023/081', 'ACADEMY OF TECHNOLOGY', 'CSE')
      ON CONFLICT (roll_number) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO college_alumni_master (full_name, roll_number, college_id, college_name, department, passing_year, registration_number, degree, university_name)
      VALUES 
        ('Amit Verma', 'A11223', 'AID999', 'Academy of Technology', 'Electronics', 2023, NULL, NULL, NULL),
        ('Sneha Gupta', 'A44556', 'AID888', 'Academy of Technology', 'Computer Science', 2022, NULL, NULL, NULL),
        ('ARATRIK BANDYOPADHYAY', '16931121009', NULL, 'Academy of Technology', 'Computer Science & Engineering', 2025, '211690100110192', 'Bachelor of Technology', 'Maulana Abul Kalam Azad University of Technology, West Bengal')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Dummy master data seeded');

    console.log('✅ Verification database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing verification database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (process.argv[1].endsWith('initVerificationDB.js')) {
  initVerificationDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default initVerificationDatabase;
