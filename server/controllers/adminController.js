import pool from '../config/database.js';
import { hashPassword, comparePassword, sanitizeUser, isValidEmail, isStrongPassword } from '../utils/helpers.js';
import { generateToken } from '../utils/jwt.js';
import csv from 'csv-parser';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';

// Admin login
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find admin
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const admin = result.rows[0];

    // Check if admin is active
    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    // Remove password from response
    const adminResponse = sanitizeUser(admin);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful!',
      data: {
        admin: adminResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create admin (only super admin can do this)
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, is_super_admin } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Validate password
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An admin with this email already exists.',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const result = await pool.query(
      `INSERT INTO admins (name, email, password, is_super_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email.toLowerCase(), hashedPassword, is_super_admin || false]
    );

    const admin = result.rows[0];
    const adminResponse = sanitizeUser(admin);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully!',
      data: {
        admin: adminResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get admin profile
export const getAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM admins WHERE id = $1',
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found.',
      });
    }

    const admin = sanitizeUser(result.rows[0]);

    res.status(200).json({
      success: true,
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM users';
    const values = [];
    let paramCount = 1;

    if (role && (role === 'student' || role === 'alumni')) {
      query += ` WHERE role = $${paramCount++}`;
      values.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const users = result.rows.map(user => sanitizeUser(user));

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    const countValues = [];
    if (role && (role === 'student' || role === 'alumni')) {
      countQuery += ' WHERE role = $1';
      countValues.push(role);
    }
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get directory (alumni and students combined)
export const getDirectory = async (req, res, next) => {
  try {
    const { search = '', department = '', year = '', role = '', page = 1, limit = 100 } = req.query;

    // Build a single UNION query to fetch both alumni and students
    let query = `
      WITH combined_users AS (
        SELECT 
          id,
          name,
          email,
          'alumni' as role,
          department,
          batch_year as year,
          skills,
          current_company,
          current_position,
          location,
          linkedin_url,
          github_url,
          bio,
          profile_image,
          created_at
        FROM users
        WHERE role = 'alumni'
        
        UNION ALL
        
        SELECT 
          student_id as id,
          full_name as name,
          email,
          'student' as role,
          department,
          graduation_year as year,
          ARRAY[]::text[] as skills,
          NULL as current_company,
          NULL as current_position,
          NULL as location,
          NULL as linkedin_url,
          NULL as github_url,
          NULL as bio,
          NULL as profile_image,
          created_at
        FROM students
        WHERE is_email_verified = true
      )
      SELECT * FROM combined_users
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Add role filter
    if (role && role !== 'all') {
      query += ` AND role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    // Add search filter
    if (search) {
      query += ` AND (LOWER(name) LIKE $${paramCount} OR LOWER(email) LIKE $${paramCount})`;
      values.push(`%${search.toLowerCase()}%`);
      paramCount++;
    }

    // Add department filter
    if (department && department !== 'All') {
      query += ` AND department = $${paramCount}`;
      values.push(department);
      paramCount++;
    }

    // Add year filter
    if (year) {
      query += ` AND year = $${paramCount}`;
      values.push(parseInt(year));
      paramCount++;
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const offset = (page - 1) * limit;
    values.push(parseInt(limit), offset);

    // Execute the query
    const result = await pool.query(query, values);

    // Get total count for pagination (without LIMIT/OFFSET)
    let countQuery = `
      WITH combined_users AS (
        SELECT 
          id,
          name,
          email,
          'alumni' as role,
          department,
          batch_year as year,
          created_at
        FROM users
        WHERE role = 'alumni'
        
        UNION ALL
        
        SELECT 
          student_id as id,
          full_name as name,
          email,
          'student' as role,
          department,
          graduation_year as year,
          created_at
        FROM students
        WHERE is_email_verified = true
      )
      SELECT COUNT(*) FROM combined_users
      WHERE 1=1
    `;

    const countValues = [];
    let countParamCount = 1;

    // Apply same filters for count
    if (role && role !== 'all') {
      countQuery += ` AND role = $${countParamCount}`;
      countValues.push(role);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (LOWER(name) LIKE $${countParamCount} OR LOWER(email) LIKE $${countParamCount})`;
      countValues.push(`%${search.toLowerCase()}%`);
      countParamCount++;
    }

    if (department && department !== 'All') {
      countQuery += ` AND department = $${countParamCount}`;
      countValues.push(department);
      countParamCount++;
    }

    if (year) {
      countQuery += ` AND year = $${countParamCount}`;
      countValues.push(parseInt(year));
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    // Sanitize results (remove sensitive data)
    const sanitizedResults = result.rows.map(user => {
      const { password, password_hash, ...sanitized } = user;
      return sanitized;
    });

    res.status(200).json({
      success: true,
      data: {
        users: sanitizedResults,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error in getDirectory:', error);
    next(error);
  }
};

// Export directory as CSV
export const exportDirectoryCSV = async (req, res, next) => {
  try {
    // Fetch all directory data without pagination
    const alumniResult = await pool.query(`
      SELECT 
        name,
        email,
        'alumni' as role,
        department,
        batch_year as year,
        skills,
        current_company,
        current_position,
        location
      FROM users
      WHERE role = 'alumni'
      ORDER BY created_at DESC
    `);

    const studentsResult = await pool.query(`
      SELECT 
        full_name as name,
        email,
        'student' as role,
        department,
        graduation_year as year,
        ARRAY[]::text[] as skills,
        NULL as current_company,
        NULL as current_position,
        NULL as location
      FROM students
      WHERE is_email_verified = true
      ORDER BY created_at DESC
    `);

    const allUsers = [...alumniResult.rows, ...studentsResult.rows];

    // Create CSV content
    const headers = ['Name', 'Email', 'Role', 'Department', 'Year', 'Skills', 'Company', 'Position', 'Location'];
    const csvRows = [headers.join(',')];

    allUsers.forEach(user => {
      const row = [
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        `"${user.role || ''}"`,
        `"${user.department || ''}"`,
        `"${user.year || ''}"`,
        `"${Array.isArray(user.skills) ? user.skills.join('; ') : ''}"`,
        `"${user.current_company || ''}"`,
        `"${user.current_position || ''}"`,
        `"${user.location || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=directory_export.csv');

    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// Export directory as Excel (using CSV format with .xlsx extension for simplicity)
export const exportDirectoryExcel = async (req, res, next) => {
  try {
    // For simplicity, we'll use CSV format with .xlsx extension
    // In production, you'd want to use a library like 'exceljs' for proper Excel files
    const alumniResult = await pool.query(`
      SELECT 
        name,
        email,
        'alumni' as role,
        department,
        batch_year as year,
        skills,
        current_company,
        current_position,
        location
      FROM users
      WHERE role = 'alumni'
      ORDER BY created_at DESC
    `);

    const studentsResult = await pool.query(`
      SELECT 
        full_name as name,
        email,
        'student' as role,
        department,
        graduation_year as year,
        ARRAY[]::text[] as skills,
        NULL as current_company,
        NULL as current_position,
        NULL as location
      FROM students
      WHERE is_email_verified = true
      ORDER BY created_at DESC
    `);

    const allUsers = [...alumniResult.rows, ...studentsResult.rows];

    // Create CSV content (Excel can open CSV files)
    const headers = ['Name', 'Email', 'Role', 'Department', 'Year', 'Skills', 'Company', 'Position', 'Location'];
    const csvRows = [headers.join(',')];

    allUsers.forEach(user => {
      const row = [
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        `"${user.role || ''}"`,
        `"${user.department || ''}"`,
        `"${user.year || ''}"`,
        `"${Array.isArray(user.skills) ? user.skills.join('; ') : ''}"`,
        `"${user.current_company || ''}"`,
        `"${user.current_position || ''}"`,
        `"${user.location || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Set headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=directory_export.xlsx');

    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// Import directory from CSV
export const importDirectoryCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file.',
      });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let skippedCount = 0;

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer.toString());

    const parsePromise = new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    // Process each row
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and array is 0-indexed

      try {
        // Validate required fields
        if (!row.Name || !row.Email || !row.Role || !row.Department || !row.Year) {
          errors.push({
            row: rowNumber,
            data: row,
            error: 'Missing required fields (Name, Email, Role, Department, Year)',
          });
          continue;
        }

        // Validate email format
        if (!isValidEmail(row.Email)) {
          errors.push({
            row: rowNumber,
            data: row,
            error: 'Invalid email format',
          });
          continue;
        }

        // Validate role
        const role = row.Role.toLowerCase();
        if (role !== 'alumni' && role !== 'student') {
          errors.push({
            row: rowNumber,
            data: row,
            error: 'Role must be either "alumni" or "student"',
          });
          continue;
        }

        // Validate year
        const year = parseInt(row.Year);
        if (isNaN(year) || year < 1900 || year > 2100) {
          errors.push({
            row: rowNumber,
            data: row,
            error: 'Invalid year',
          });
          continue;
        }

        // Check for duplicate email in users table
        const emailCheck = await pool.query(
          'SELECT email FROM users WHERE email = $1',
          [row.Email.toLowerCase()]
        );

        if (emailCheck.rows.length > 0) {
          errors.push({
            row: rowNumber,
            data: row,
            error: 'Email already exists in database',
          });
          skippedCount++;
          continue;
        }

        // Parse skills if provided
        const skills = row.Skills ? row.Skills.split(';').map(s => s.trim()).filter(s => s) : [];

        // Insert based on role
        if (role === 'alumni') {
          // Generate a default password (should be changed by user)
          const defaultPassword = await hashPassword('changeme123');

          await pool.query(
            `INSERT INTO users (name, email, password, role, department, batch_year, skills, current_company, current_position, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              row.Name,
              row.Email.toLowerCase(),
              defaultPassword,
              'alumni',
              row.Department,
              year,
              skills,
              row.Company || null,
              row.Position || null,
              row.Location || null,
            ]
          );
        } else {
          // For students - insert into users table with role='student'
          const defaultPassword = await hashPassword('changeme123');

          await pool.query(
            `INSERT INTO users (name, email, password, role, college, batch_year, department, skills)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              row.Name,
              row.Email.toLowerCase(),
              defaultPassword,
              'student',
              'Academy of Technology',
              year,
              row.Department,
              skills,
            ]
          );
        }

        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          data: row,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed. ${successCount} records imported, ${skippedCount} skipped, ${errors.length} errors.`,
      data: {
        imported: successCount,
        skipped: skippedCount,
        errors: errors,
        totalRows: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Export directory as PDF
export const exportDirectoryPDF = async (req, res, next) => {
  try {
    // Fetch all directory data without pagination
    const alumniResult = await pool.query(`
      SELECT 
        name,
        email,
        'alumni' as role,
        department,
        batch_year as year,
        current_company,
        current_position,
        location
      FROM users
      WHERE role = 'alumni'
      ORDER BY created_at DESC
    `);

    const studentsResult = await pool.query(`
      SELECT 
        full_name as name,
        email,
        'student' as role,
        department,
        graduation_year as year,
        NULL as current_company,
        NULL as current_position,
        NULL as location
      FROM students
      WHERE is_email_verified = true
      ORDER BY created_at DESC
    `);

    const allUsers = [...alumniResult.rows, ...studentsResult.rows];

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=directory_export.pdf');

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).font('Helvetica-Bold').text('SETU Directory', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.fontSize(10).text(`Total Users: ${allUsers.length}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const tableTop = doc.y;
    const colWidths = {
      name: 120,
      email: 140,
      role: 50,
      department: 100,
      year: 40,
    };

    // Draw header row
    doc.fontSize(9).font('Helvetica-Bold');
    let xPos = 50;
    doc.text('Name', xPos, tableTop, { width: colWidths.name, continued: false });
    xPos += colWidths.name;
    doc.text('Email', xPos, tableTop, { width: colWidths.email, continued: false });
    xPos += colWidths.email;
    doc.text('Role', xPos, tableTop, { width: colWidths.role, continued: false });
    xPos += colWidths.role;
    doc.text('Department', xPos, tableTop, { width: colWidths.department, continued: false });
    xPos += colWidths.department;
    doc.text('Year', xPos, tableTop, { width: colWidths.year, continued: false });

    // Draw line under header
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.moveDown(0.5);

    // Add data rows
    doc.font('Helvetica').fontSize(8);
    let yPos = tableTop + 20;
    const rowHeight = 20;

    allUsers.forEach((user, index) => {
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      xPos = 50;

      // Truncate long text to fit in columns
      const name = (user.name || '').substring(0, 25);
      const email = (user.email || '').substring(0, 30);
      const role = user.role === 'alumni' ? 'Alumni' : 'Student';
      const dept = (user.department || '').substring(0, 20);
      const year = user.year || '';

      doc.text(name, xPos, yPos, { width: colWidths.name, continued: false });
      xPos += colWidths.name;
      doc.text(email, xPos, yPos, { width: colWidths.email, continued: false });
      xPos += colWidths.email;
      doc.text(role, xPos, yPos, { width: colWidths.role, continued: false });
      xPos += colWidths.role;
      doc.text(dept, xPos, yPos, { width: colWidths.department, continued: false });
      xPos += colWidths.department;
      doc.text(year.toString(), xPos, yPos, { width: colWidths.year, continued: false });

      yPos += rowHeight;

      // Draw separator line every 5 rows
      if ((index + 1) % 5 === 0) {
        doc.moveTo(50, yPos - 5).lineTo(550, yPos - 5).strokeOpacity(0.3).stroke().strokeOpacity(1);
      }
    });

    // Add footer
    doc.fontSize(8).text(
      `SETU - Alumni & Student Directory | Page ${doc.bufferedPageRange().count}`,
      50,
      750,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    next(error);
  }
};

// ==================== ANALYTICS ENDPOINTS ====================

/**
 * Get all key performance indicators
 */
export const getAnalyticsKPIs = async (req, res, next) => {
  try {
    // Get current week's start and end dates
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Total Users (students + alumni)
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsersLastWeek = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at < $1',
      [currentWeekStart]
    );
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    const totalUsersLast = parseInt(totalUsersLastWeek.rows[0].count);
    const totalUsersChange = totalUsersLast > 0
      ? (((totalUsers - totalUsersLast) / totalUsersLast) * 100).toFixed(1) + '%'
      : '0%';

    // Total Alumni
    const totalAlumniResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'alumni'"
    );
    const totalAlumni = parseInt(totalAlumniResult.rows[0].count);

    // Total Students
    const totalStudentsResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );
    const totalStudents = parseInt(totalStudentsResult.rows[0].count);

    // Total Events
    let totalEvents = 0;
    try {
      const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
      totalEvents = parseInt(eventsResult.rows[0].count);
    } catch (err) {
      console.warn('Events table may not exist:', err.message);
    }

    // Total Donations (placeholder for future implementation)
    let totalDonations = 0;
    try {
      const donationsResult = await pool.query('SELECT COUNT(*) as count FROM donations');
      totalDonations = parseInt(donationsResult.rows[0].count);
    } catch (err) {
      // Donations table doesn't exist yet - this is expected
      console.log('Donations table not found (this is expected)');
    }

    // Verified Alumni - check if verification_status column exists
    let verifiedAlumni = 0;
    try {
      const verifiedAlumniResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'alumni' AND verification_status = 'verified'"
      );
      verifiedAlumni = parseInt(verifiedAlumniResult.rows[0].count);
    } catch (err) {
      // Column doesn't exist, use is_verified instead
      try {
        const verifiedAlumniResult = await pool.query(
          "SELECT COUNT(*) as count FROM users WHERE role = 'alumni' AND is_verified = true"
        );
        verifiedAlumni = parseInt(verifiedAlumniResult.rows[0].count);
      } catch (err2) {
        console.warn('Verification status not available:', err2.message);
        verifiedAlumni = 0;
      }
    }

    // Posts This Week
    let postsThisWeek = 0;
    let postsLastWeek = 0;
    try {
      const postsThisWeekResult = await pool.query(
        'SELECT COUNT(*) as count FROM posts WHERE created_at >= $1',
        [currentWeekStart]
      );
      const postsLastWeekResult = await pool.query(
        'SELECT COUNT(*) as count FROM posts WHERE created_at >= $1 AND created_at < $2',
        [lastWeekStart, currentWeekStart]
      );
      postsThisWeek = parseInt(postsThisWeekResult.rows[0].count);
      postsLastWeek = parseInt(postsLastWeekResult.rows[0].count);
    } catch (err) {
      console.warn('Posts table may not exist:', err.message);
    }
    const postsChange = postsLastWeek > 0
      ? (((postsThisWeek - postsLastWeek) / postsLastWeek) * 100).toFixed(1) + '%'
      : '0%';

    // Jobs Posted
    let jobsPosted = 0;
    try {
      const jobsPostedResult = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE status = $1', ['active']);
      jobsPosted = parseInt(jobsPostedResult.rows[0].count);
    } catch (err) {
      console.warn('Jobs table may not exist:', err.message);
    }

    // Event Registrations
    let eventRegistrations = 0;
    try {
      const eventRegistrationsResult = await pool.query(
        'SELECT COUNT(*) as count FROM event_registrations WHERE registered_at >= $1',
        [currentWeekStart]
      );
      eventRegistrations = parseInt(eventRegistrationsResult.rows[0].count);
    } catch (err) {
      console.warn('Event registrations table may not exist:', err.message);
    }

    res.json({
      success: true,
      data: {
        totalUsers: {
          value: totalUsers,
          change: totalUsersChange,
          trend: totalUsers >= totalUsersLast ? 'up' : 'down'
        },
        totalAlumni: {
          value: totalAlumni,
          change: '0%',
          trend: 'neutral'
        },
        totalStudents: {
          value: totalStudents,
          change: '0%',
          trend: 'neutral'
        },
        totalEvents: {
          value: totalEvents,
          change: '0%',
          trend: 'neutral'
        },
        totalDonations: {
          value: totalDonations,
          change: '0%',
          trend: 'neutral'
        },
        verifiedAlumni: {
          value: verifiedAlumni,
          change: '0%',
          trend: 'neutral'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    next(error);
  }
};

/**
 * Get user registration trends
 */
export const getUserRegistrationsTrend = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily registrations for alumni and students
    const query = `
      SELECT 
        DATE(created_at) as date,
        role,
        COUNT(*) as count
      FROM users
      WHERE created_at >= $1 AND role IN ('alumni', 'student')
      GROUP BY DATE(created_at), role
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [startDate]);

    // Generate labels for all days in the period
    const labels = [];
    const alumniData = [];
    const studentData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      const alumniCount = result.rows.find(r => r.date.toISOString().split('T')[0] === dateStr && r.role === 'alumni');
      const studentCount = result.rows.find(r => r.date.toISOString().split('T')[0] === dateStr && r.role === 'student');

      alumniData.push(alumniCount ? parseInt(alumniCount.count) : 0);
      studentData.push(studentCount ? parseInt(studentCount.count) : 0);
    }

    res.json({
      success: true,
      data: {
        labels,
        datasets: [
          { label: 'Alumni', data: alumniData },
          { label: 'Students', data: studentData }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    next(error);
  }
};

/**
 * Get alumni distribution by department
 */
export const getAlumniByDepartment = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        department,
        COUNT(*) as count
      FROM users
      WHERE role = 'alumni' AND department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    const labels = result.rows.map(row => row.department || 'Unknown');
    const data = result.rows.map(row => parseInt(row.count));

    res.json({
      success: true,
      data: {
        labels,
        datasets: [{ label: 'Alumni Count', data }]
      }
    });
  } catch (error) {
    console.error('Error fetching alumni by department:', error);
    next(error);
  }
};

/**
 * Get user distribution by role
 */
export const getUsersByRole = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    const labels = result.rows.map(row => {
      const role = row.role || 'unknown';
      return role.charAt(0).toUpperCase() + role.slice(1);
    });
    const data = result.rows.map(row => parseInt(row.count));

    res.json({
      success: true,
      data: {
        labels,
        datasets: [{ label: 'Users', data }]
      }
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    next(error);
  }
};

/**
 * Get posts and comments activity over time
 */
export const getPostsActivity = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily posts
    const postsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get daily comments
    const commentsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM comments
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const [postsResult, commentsResult] = await Promise.all([
      pool.query(postsQuery, [startDate]),
      pool.query(commentsQuery, [startDate])
    ]);

    // Generate labels for all days in the period
    const labels = [];
    const postsData = [];
    const commentsData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      const postCount = postsResult.rows.find(r => r.date.toISOString().split('T')[0] === dateStr);
      const commentCount = commentsResult.rows.find(r => r.date.toISOString().split('T')[0] === dateStr);

      postsData.push(postCount ? parseInt(postCount.count) : 0);
      commentsData.push(commentCount ? parseInt(commentCount.count) : 0);
    }

    res.json({
      success: true,
      data: {
        labels,
        datasets: [
          { label: 'Posts', data: postsData },
          { label: 'Comments', data: commentsData }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching posts activity:', error);
    next(error);
  }
};

/**
 * Get alumni verification status distribution
 */
export const getAlumniVerificationStatus = async (req, res, next) => {
  try {
    let verified = 0;
    let pending = 0;
    let rejected = 0;
    let total = 0;

    // Try to get total alumni first
    const totalAlumniResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'alumni'"
    );
    total = parseInt(totalAlumniResult.rows[0].count);

    // Check if verification_status column exists
    try {
      const statusResult = await pool.query(
        `SELECT 
          verification_status,
          COUNT(*) as count
        FROM users
        WHERE role = 'alumni'
        GROUP BY verification_status`
      );

      statusResult.rows.forEach(row => {
        const status = row.verification_status?.toLowerCase();
        const count = parseInt(row.count);
        if (status === 'verified') verified = count;
        else if (status === 'pending') pending = count;
        else if (status === 'rejected') rejected = count;
        else pending += count; // Unknown status treated as pending
      });
    } catch (err) {
      // verification_status column doesn't exist, try is_verified
      try {
        const verifiedResult = await pool.query(
          "SELECT COUNT(*) as count FROM users WHERE role = 'alumni' AND is_verified = true"
        );
        verified = parseInt(verifiedResult.rows[0].count);
        pending = total - verified;
      } catch (err2) {
        // Neither column exists, all are pending
        pending = total;
      }
    }

    const labels = ['Verified', 'Pending', 'Rejected'];
    const data = [verified, pending, rejected];

    res.json({
      success: true,
      data: {
        labels,
        datasets: [{
          label: 'Alumni',
          data
        }],
        total: total,
        verified: verified,
        pending: pending,
        rejected: rejected
      }
    });
  } catch (error) {
    console.error('Error fetching alumni verification status:', error);
    next(error);
  }
};

/**
 * Get student skills/interests distribution
 */
export const getStudentSkills = async (req, res, next) => {
  try {
    // Get all students with skills
    const result = await pool.query(
      `SELECT skills, interests 
       FROM users 
       WHERE role = 'student' 
       AND (skills IS NOT NULL OR interests IS NOT NULL)`
    );

    // Count skills
    const skillsMap = new Map();

    result.rows.forEach(row => {
      // Process skills array
      if (row.skills && Array.isArray(row.skills)) {
        row.skills.forEach(skill => {
          if (skill && skill.trim()) {
            const skillName = skill.trim();
            skillsMap.set(skillName, (skillsMap.get(skillName) || 0) + 1);
          }
        });
      }

      // Process interests array
      if (row.interests && Array.isArray(row.interests)) {
        row.interests.forEach(interest => {
          if (interest && interest.trim()) {
            const interestName = interest.trim();
            skillsMap.set(interestName, (skillsMap.get(interestName) || 0) + 1);
          }
        });
      }
    });

    // Convert to array and sort by count
    const skillsArray = Array.from(skillsMap.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 skills

    const labels = skillsArray.map(s => s.skill);
    const data = skillsArray.map(s => s.count);

    res.json({
      success: true,
      data: {
        labels,
        datasets: [{
          label: 'Students',
          data
        }],
        totalSkills: skillsMap.size,
        topSkills: skillsArray
      }
    });
  } catch (error) {
    console.error('Error fetching student skills:', error);
    // Return empty data instead of error to prevent dashboard from breaking
    res.json({
      success: true,
      data: {
        labels: [],
        datasets: [{
          label: 'Students',
          data: []
        }],
        totalSkills: 0,
        topSkills: []
      }
    });
  }
};

