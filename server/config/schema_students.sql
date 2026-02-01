-- ============================================
-- SETU Student Signup Database Schema
-- ============================================
-- For Neon PostgreSQL
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- 1. Create students table
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

-- 2. Create student_email_otps table
CREATE TABLE IF NOT EXISTS student_email_otps (
  otp_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_pending_otp UNIQUE (email, verified)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_otp_email_verified ON student_email_otps(email, verified);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON student_email_otps(expires_at);

-- 4. Create function for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS students_updated_at_trigger ON students;

CREATE TRIGGER students_updated_at_trigger
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_students_updated_at();

-- ============================================
-- Sample Queries for Testing
-- ============================================

-- View all students
-- SELECT * FROM students ORDER BY created_at DESC;

-- View pending OTPs
-- SELECT email, expires_at, verified, created_at 
-- FROM student_email_otps 
-- WHERE verified = FALSE 
-- ORDER BY created_at DESC;

-- Clean up expired OTPs
-- DELETE FROM student_email_otps 
-- WHERE expires_at < NOW() AND verified = FALSE;

-- Count students by department
-- SELECT department, COUNT(*) as student_count 
-- FROM students 
-- GROUP BY department 
-- ORDER BY student_count DESC;

-- Count students by graduation year
-- SELECT graduation_year, COUNT(*) as student_count 
-- FROM students 
-- GROUP BY graduation_year 
-- ORDER BY graduation_year;

-- ============================================
-- Schema Complete! ✅
-- ============================================
