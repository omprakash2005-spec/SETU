import pool from '../config/database.js';

/* =========================
   CREATE JOB (ADMIN ONLY)
   ========================= */
export const createJob = async (req, res, next) => {
  try {
    const { title, company, location, description, requirements } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!title || !company || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, company, and description.',
      });
    }

    // Only admins can directly create and publish jobs
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create jobs directly. Alumni should use the request endpoint.',
      });
    }

    const query = `
      INSERT INTO jobs (title, company, location, description, requirements, posted_by_user_id, posted_by_role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [title, company, location || null, description, requirements || null, userId, userRole];
    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: 'Job created and published successfully!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create job.',
      error: error.message,
    });
  }
};

/* =========================
   REQUEST JOB POSTING (ALUMNI ONLY)
   ========================= */
export const requestJobPosting = async (req, res, next) => {
  try {
    const { job_title, company, location, description, requirements } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!job_title || !company || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job_title, company, and description.',
      });
    }

    // Only alumni can submit job requests
    if (userRole !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni can submit job posting requests.',
      });
    }

    const query = `
      INSERT INTO pending_job_requests (alumni_user_id, job_title, company, location, description, requirements, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;

    const values = [userId, job_title, company, location || null, description, requirements || null];
    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: 'Job posting request submitted successfully! It will be visible after admin approval.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error submitting job request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit job request.',
      error: error.message,
    });
  }
};

/* =========================
   APPROVE JOB REQUEST (ADMIN ONLY)
   ========================= */
export const approveJobRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;
    const userRole = req.user.role;

    // Only admins can approve requests
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve job requests.',
      });
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the pending request
      const requestQuery = `
        SELECT * FROM pending_job_requests 
        WHERE request_id = $1 AND status = 'pending'
      `;
      const requestResult = await client.query(requestQuery, [requestId]);

      if (requestResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Pending job request not found or already processed.',
        });
      }

      const request = requestResult.rows[0];

      // Create the job in the jobs table
      const createJobQuery = `
        INSERT INTO jobs (title, company, location, description, requirements, posted_by_user_id, posted_by_role)
        VALUES ($1, $2, $3, $4, $5, $6, 'alumni')
        RETURNING *
      `;
      const jobValues = [
        request.job_title,
        request.company,
        request.location,
        request.description,
        request.requirements,
        request.alumni_user_id,
      ];
      const jobResult = await client.query(createJobQuery, jobValues);

      // Update the request status to approved
      const updateRequestQuery = `
        UPDATE pending_job_requests 
        SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_admin_id = $1
        WHERE request_id = $2
        RETURNING *
      `;
      const updateResult = await client.query(updateRequestQuery, [adminId, requestId]);

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Job request approved and published successfully!',
        data: {
          job: jobResult.rows[0],
          request: updateResult.rows[0],
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error approving job request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve job request.',
      error: error.message,
    });
  }
};

/* =========================
   REJECT JOB REQUEST (ADMIN ONLY)
   ========================= */
export const rejectJobRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { rejection_reason } = req.body;
    const adminId = req.user.id;
    const userRole = req.user.role;

    // Only admins can reject requests
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reject job requests.',
      });
    }

    const query = `
      UPDATE pending_job_requests 
      SET status = 'rejected', 
          reviewed_at = CURRENT_TIMESTAMP, 
          reviewed_by_admin_id = $1,
          rejection_reason = $2
      WHERE request_id = $3 AND status = 'pending'
      RETURNING *
    `;

    const values = [adminId, rejection_reason || null, requestId];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending job request not found or already processed.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job request rejected successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error rejecting job request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject job request.',
      error: error.message,
    });
  }
};

/* =========================
   APPLY FOR JOB (STUDENTS & ALUMNI)
   ========================= */
export const applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { resume_url, resume_text, additional_details, cover_letter } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only students and alumni can apply
    if (userRole !== 'student' && userRole !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only students and alumni can apply for jobs.',
      });
    }

    // Validation - at least one form of resume required
    if (!resume_url && !resume_text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a resume URL or resume text.',
      });
    }

    // Check if job exists
    const jobCheck = await pool.query('SELECT job_id FROM jobs WHERE job_id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    // Check for duplicate application
    const duplicateCheck = await pool.query(
      'SELECT application_id FROM job_applications WHERE job_id = $1 AND user_id = $2',
      [jobId, userId]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job.',
      });
    }

    // Create application
    const query = `
      INSERT INTO job_applications 
      (job_id, user_id, user_role, resume_url, resume_text, additional_details, cover_letter, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
      RETURNING *
    `;

    const values = [
      jobId,
      userId,
      userRole,
      resume_url || null,
      resume_text || null,
      additional_details ? JSON.stringify(additional_details) : null,
      cover_letter || null,
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit application.',
      error: error.message,
    });
  }
};

/* =========================
   GET ALL APPROVED JOBS
   ========================= */
export const getAllJobs = async (req, res, next) => {
  try {
    const { company, location, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        j.*,
        COUNT(ja.application_id) as application_count
      FROM jobs j
      LEFT JOIN job_applications ja ON j.job_id = ja.job_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Apply filters
    if (company) {
      paramCount++;
      query += ` AND j.company ILIKE $${paramCount}`;
      params.push(`%${company}%`);
    }

    if (location) {
      paramCount++;
      query += ` AND j.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (j.title ILIKE $${paramCount} OR j.description ILIKE $${paramCount} OR j.company ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY j.job_id ORDER BY j.created_at DESC`;

    // Add pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM jobs WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (company) {
      countParamCount++;
      countQuery += ` AND company ILIKE $${countParamCount}`;
      countParams.push(`%${company}%`);
    }

    if (location) {
      countParamCount++;
      countQuery += ` AND location ILIKE $${countParamCount}`;
      countParams.push(`%${location}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR description ILIKE $${countParamCount} OR company ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalJobs = parseInt(countResult.rows[0].count);

    return res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully.',
      data: result.rows,
      pagination: {
        total: totalJobs,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < totalJobs,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve jobs.',
      error: error.message,
    });
  }
};

/* =========================
   GET JOB BY ID
   ========================= */
export const getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const query = `
      SELECT 
        j.*,
        COUNT(ja.application_id) as application_count
      FROM jobs j
      LEFT JOIN job_applications ja ON j.job_id = ja.job_id
      WHERE j.job_id = $1
      GROUP BY j.job_id
    `;

    const result = await pool.query(query, [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job retrieved successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job.',
      error: error.message,
    });
  }
};

/* =========================
   GET PENDING JOB REQUESTS (ADMIN ONLY)
   ========================= */
export const getPendingJobRequests = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    // Only admins can view pending requests
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view pending job requests.',
      });
    }

    const { status = 'pending' } = req.query;

    const query = `
      SELECT 
        pjr.*,
        COUNT(CASE WHEN pjr.status = 'pending' THEN 1 END) OVER() as total_pending
      FROM pending_job_requests pjr
      WHERE pjr.status = $1
      ORDER BY pjr.created_at DESC
    `;

    const result = await pool.query(query, [status]);

    return res.status(200).json({
      success: true,
      message: 'Pending job requests retrieved successfully.',
      data: result.rows,
      totalPending: result.rows.length > 0 ? parseInt(result.rows[0].total_pending) : 0,
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending job requests.',
      error: error.message,
    });
  }
};

/* =========================
   GET MY JOB APPLICATIONS
   ========================= */
export const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        ja.*,
        j.title as job_title,
        j.company,
        j.location,
        j.description as job_description
      FROM job_applications ja
      INNER JOIN jobs j ON ja.job_id = j.job_id
      WHERE ja.user_id = $1
      ORDER BY ja.applied_at DESC
    `;

    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      message: 'Your applications retrieved successfully.',
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications.',
      error: error.message,
    });
  }
};

/* =========================
   GET MY JOB REQUESTS (ALUMNI)
   ========================= */
export const getMyJobRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni can view their job requests.',
      });
    }

    const query = `
      SELECT * FROM pending_job_requests
      WHERE alumni_user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      message: 'Your job requests retrieved successfully.',
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching job requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job requests.',
      error: error.message,
    });
  }
};

/* =========================
   GET APPLICATIONS FOR A JOB (ADMIN/JOB POSTER)
   ========================= */
export const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if job exists and if user has permission to view applications
    const jobQuery = `
      SELECT * FROM jobs WHERE job_id = $1
    `;
    const jobResult = await pool.query(jobQuery, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    const job = jobResult.rows[0];

    // Only admin or the person who posted the job can view applications
    if (userRole !== 'admin' && job.posted_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view applications for this job.',
      });
    }

    const query = `
      SELECT 
        ja.*
      FROM job_applications ja
      WHERE ja.job_id = $1
      ORDER BY ja.applied_at DESC
    `;

    const result = await pool.query(query, [jobId]);

    return res.status(200).json({
      success: true,
      message: 'Job applications retrieved successfully.',
      data: result.rows,
      job: job,
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job applications.',
      error: error.message,
    });
  }
};

/* =========================
   DELETE JOB (ADMIN/JOB POSTER)
   ========================= */
export const deleteJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if job exists
    const jobQuery = `
      SELECT * FROM jobs WHERE job_id = $1
    `;
    const jobResult = await pool.query(jobQuery, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.',
      });
    }

    const job = jobResult.rows[0];

    // Authorization check:
    // Admin can delete any job
    // Alumni can only delete their own jobs (but this shouldn't happen for approved jobs)
    if (userRole === 'admin') {
      // Admin can delete any job
    } else if (userRole === 'alumni' && job.posted_by_user_id === userId) {
      // Alumni trying to delete their own approved job - should use pending requests instead
      return res.status(403).json({
        success: false,
        message: 'You cannot delete approved jobs. Please contact admin if needed.',
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this job.',
      });
    }

    const deleteQuery = `
      DELETE FROM jobs WHERE job_id = $1
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [jobId]);

    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job.',
      error: error.message,
    });
  }
};

/* =========================
   DELETE PENDING JOB REQUEST (ALUMNI ONLY - THEIR OWN PENDING REQUESTS)
   ========================= */
export const deletePendingJobRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if request exists
    const requestQuery = `
      SELECT * FROM pending_job_requests WHERE request_id = $1
    `;
    const requestResult = await pool.query(requestQuery, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job request not found.',
      });
    }

    const request = requestResult.rows[0];

    // Authorization: Alumni can only delete their own pending requests
    if (userRole === 'alumni' && request.alumni_user_id === userId && request.status === 'pending') {
      // Alumni can delete their own pending request
    } else if (userRole === 'admin') {
      // Admin can delete any pending request
    } else {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own pending job requests.',
      });
    }

    const deleteQuery = `
      DELETE FROM pending_job_requests WHERE request_id = $1
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [requestId]);

    return res.status(200).json({
      success: true,
      message: 'Job request deleted successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting job request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job request.',
      error: error.message,
    });
  }
};
