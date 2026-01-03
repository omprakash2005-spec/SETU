import pool from './database.js';

/**
 * Initialize Jobs Module Database Tables
 * This script creates all necessary tables for the Jobs feature
 */

const initJobsDatabase = async () => {
  try {
    console.log('🔧 Initializing Jobs module database...');

    // Create jobs table (approved and visible jobs)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        job_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        description TEXT NOT NULL,
        requirements TEXT,
        posted_by_user_id INTEGER NOT NULL,
        posted_by_role VARCHAR(20) NOT NULL CHECK (posted_by_role IN ('admin', 'alumni')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Jobs table created/verified');

    // Create pending_job_requests table (alumni submissions awaiting approval)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_job_requests (
        request_id SERIAL PRIMARY KEY,
        alumni_user_id INTEGER NOT NULL,
        job_title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        description TEXT NOT NULL,
        requirements TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by_admin_id INTEGER,
        rejection_reason TEXT
      );
    `);
    console.log('✅ Pending job requests table created/verified');

    // Create job_applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        application_id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'alumni')),
        resume_url TEXT,
        resume_text TEXT,
        additional_details JSONB,
        cover_letter TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'rejected', 'accepted')),
        UNIQUE(job_id, user_id)
      );
    `);
    console.log('✅ Job applications table created/verified');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by_user_id, posted_by_role);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_requests_status ON pending_job_requests(status, created_at DESC);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pending_requests_alumni ON pending_job_requests(alumni_user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_applications_user ON job_applications(user_id, user_role);
    `);
    console.log('✅ Indexes created/verified');

    // Create trigger to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_jobs_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_jobs_updated_at ON jobs;
    `);

    await pool.query(`
      CREATE TRIGGER trigger_update_jobs_updated_at
      BEFORE UPDATE ON jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_jobs_updated_at();
    `);
    console.log('✅ Triggers created/verified');

    console.log('✨ Jobs module database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing jobs database:', error);
    throw error;
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initJobsDatabase()
    .then(() => {
      console.log('✅ Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

export default initJobsDatabase;
