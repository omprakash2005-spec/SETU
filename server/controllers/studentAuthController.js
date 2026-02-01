import pool from '../config/database.js';
import { hashPassword, comparePassword, isValidEmail } from '../utils/helpers.js';
import { generateToken } from '../utils/jwt.js';
import { uploadDocumentToCloudinary } from '../config/cloudinary.js';

/**
 * Student Auth Controller
 * Handles student signup with ID card upload
 */

/**
 * Student signup (direct registration without OTP)
 * POST /api/auth/student/signup
 */
export const studentSignup = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      roll_number,
      department,
      graduation_year,
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !roll_number || !department || !graduation_year) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: full_name, email, password, roll_number, department, graduation_year.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const lowerEmail = email.toLowerCase();

    // Check if user already exists in users table
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [lowerEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Validate graduation year
    const gradYear = parseInt(graduation_year);
    const currentYear = new Date().getFullYear();
    if (isNaN(gradYear) || gradYear < currentYear - 10 || gradYear > currentYear + 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid graduation year.',
      });
    }

    // Handle ID card upload
    let idCardUrl = null;
    if (req.file) {
      try {
        idCardUrl = await uploadDocumentToCloudinary(
          req.file.buffer,
          req.file.mimetype,
          'setu/student_ids'
        );
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload student ID card. Please try again.',
        });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create student account in users table
    const result = await pool.query(
      `INSERT INTO users (
        name, email, password, role, college, batch_year, 
        department, verification_document
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        full_name,
        lowerEmail,
        passwordHash,
        'student',
        'Academy of Technology',
        gradYear,
        department,
        idCardUrl
      ]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // --- START VERIFICATION PROCESS ---
    let verificationResult = { status: 'PENDING', isVerified: false };
    if (idCardUrl) {
      try {
        // Import dynamically if needed to avoid circular dep, or just use import at top
        const { verifyDocument } = await import('./verificationController.js');
        verificationResult = await verifyDocument(user.id, idCardUrl, 'student');

        // Update user object with fresh status
        user.verification_status = verificationResult.status;
        user.is_verified = verificationResult.isVerified;
      } catch (verError) {
        console.error('Verification process failed:', verError);
        // We don't fail the signup, just leave it as PENDING (default)
      }
    }
    // ----------------------------------

    res.status(201).json({
      success: true,
      message: 'Student account created successfully!',
      data: {
        user: {
          id: user.id,
          user_id: user.id, // Normalize ID field
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          batch_year: user.batch_year,
          department: user.department,
          verification_document: user.verification_document,
          verification_status: user.verification_status || 'PENDING',
          is_verified: user.is_verified || false,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error creating student account:', error);
    next(error);
  }
};

/**
 * Student login (separate from regular login)
 * POST /api/auth/student/login
 */
export const studentLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const lowerEmail = email.toLowerCase();

    // Find user with role='student'
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [lowerEmail, 'student']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data normalized to match app expectations
    const { password: _, ...userData } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: {
          ...userData,
          user_id: userData.id, // Normalize ID field
          verification_status: userData.verification_status,
          is_verified: userData.is_verified,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error during student login:', error);
    next(error);
  }
};
