# Jobs Module - Complete Documentation

## Overview

The Jobs module enables job posting and application workflows in the SETU platform with strict role-based access control.

### Role-Based Capabilities

| Role | Post Jobs | Request Jobs | Apply for Jobs | Approve Jobs |
|------|-----------|--------------|----------------|--------------|
| **Admin** | ✅ Directly | ❌ | ❌ | ✅ |
| **Alumni** | ❌ | ✅ Needs Approval | ✅ | ❌ |
| **Student** | ❌ | ❌ | ✅ | ❌ |

---

## Database Schema

### Table 1: `jobs` (Approved and Visible Jobs)

```sql
CREATE TABLE jobs (
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
```

### Table 2: `pending_job_requests` (Alumni Submissions Awaiting Approval)

```sql
CREATE TABLE pending_job_requests (
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
```

### Table 3: `job_applications` (Applications from Students/Alumni)

```sql
CREATE TABLE job_applications (
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
```

---

## API Endpoints

### Base URL
All endpoints are prefixed with: `/api/jobs`

### Authentication
All endpoints require authentication. Include the JWT token in the request:
- **Header**: `Authorization: Bearer <token>`
- **Cookie**: `token=<token>`

---

## 1. Admin Endpoints

### 1.1 Create Job (Admin Only)

**POST** `/api/jobs/create`

Creates and publishes a job directly without approval.

**Access**: Admin only

**Request Body**:
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "description": "We are looking for an experienced software engineer...",
  "requirements": "5+ years experience in React, Node.js, PostgreSQL"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Job created and published successfully!",
  "data": {
    "job_id": 1,
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "description": "We are looking for an experienced software engineer...",
    "requirements": "5+ years experience in React, Node.js, PostgreSQL",
    "posted_by_user_id": 10,
    "posted_by_role": "admin",
    "created_at": "2026-01-01T10:30:00.000Z",
    "updated_at": "2026-01-01T10:30:00.000Z"
  }
}
```

**Error Response (403)**:
```json
{
  "success": false,
  "message": "Only admins can create jobs directly. Alumni should use the request endpoint."
}
```

---

### 1.2 Get Pending Job Requests (Admin Only)

**GET** `/api/jobs/pending/requests`

Retrieves all job posting requests submitted by alumni awaiting approval.

**Access**: Admin only

**Query Parameters**:
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`). Default: `pending`

**Example Request**:
```
GET /api/jobs/pending/requests?status=pending
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Pending job requests retrieved successfully.",
  "data": [
    {
      "request_id": 5,
      "alumni_user_id": 25,
      "job_title": "UI/UX Designer",
      "company": "Design Studio",
      "location": "Remote",
      "description": "Looking for a creative UI/UX designer...",
      "requirements": "3+ years experience in Figma, Adobe XD",
      "status": "pending",
      "created_at": "2026-01-01T09:00:00.000Z",
      "reviewed_at": null,
      "reviewed_by_admin_id": null,
      "rejection_reason": null
    }
  ],
  "totalPending": 3
}
```

---

### 1.3 Approve Job Request (Admin Only)

**POST** `/api/jobs/approve/:requestId`

Approves an alumni job request and publishes it to the jobs list.

**Access**: Admin only

**URL Parameters**:
- `requestId`: The ID of the pending job request

**Example Request**:
```
POST /api/jobs/approve/5
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Job request approved and published successfully!",
  "data": {
    "job": {
      "job_id": 12,
      "title": "UI/UX Designer",
      "company": "Design Studio",
      "location": "Remote",
      "description": "Looking for a creative UI/UX designer...",
      "requirements": "3+ years experience in Figma, Adobe XD",
      "posted_by_user_id": 25,
      "posted_by_role": "alumni",
      "created_at": "2026-01-01T11:00:00.000Z"
    },
    "request": {
      "request_id": 5,
      "alumni_user_id": 25,
      "status": "approved",
      "reviewed_at": "2026-01-01T11:00:00.000Z",
      "reviewed_by_admin_id": 10
    }
  }
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "Pending job request not found or already processed."
}
```

---

### 1.4 Reject Job Request (Admin Only)

**POST** `/api/jobs/reject/:requestId`

Rejects an alumni job request.

**Access**: Admin only

**URL Parameters**:
- `requestId`: The ID of the pending job request

**Request Body** (optional):
```json
{
  "rejection_reason": "Job description needs more details about responsibilities."
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Job request rejected successfully.",
  "data": {
    "request_id": 5,
    "alumni_user_id": 25,
    "status": "rejected",
    "reviewed_at": "2026-01-01T11:00:00.000Z",
    "reviewed_by_admin_id": 10,
    "rejection_reason": "Job description needs more details about responsibilities."
  }
}
```

---

## 2. Alumni Endpoints

### 2.1 Request Job Posting (Alumni Only)

**POST** `/api/jobs/request`

Submits a job posting request that goes to pending approval list.

**Access**: Alumni only

**Request Body**:
```json
{
  "job_title": "Frontend Developer",
  "company": "Startup Inc",
  "location": "New York, NY",
  "description": "We are seeking a talented frontend developer...",
  "requirements": "2+ years React experience, knowledge of TypeScript"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Job posting request submitted successfully! It will be visible after admin approval.",
  "data": {
    "request_id": 6,
    "alumni_user_id": 25,
    "job_title": "Frontend Developer",
    "company": "Startup Inc",
    "location": "New York, NY",
    "description": "We are seeking a talented frontend developer...",
    "requirements": "2+ years React experience, knowledge of TypeScript",
    "status": "pending",
    "created_at": "2026-01-01T12:00:00.000Z",
    "reviewed_at": null,
    "reviewed_by_admin_id": null,
    "rejection_reason": null
  }
}
```

**Error Response (403)**:
```json
{
  "success": false,
  "message": "Only alumni can submit job posting requests."
}
```

---

### 2.2 Get My Job Requests (Alumni Only)

**GET** `/api/jobs/my/requests`

Retrieves all job posting requests submitted by the authenticated alumni user.

**Access**: Alumni only

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Your job requests retrieved successfully.",
  "data": [
    {
      "request_id": 6,
      "alumni_user_id": 25,
      "job_title": "Frontend Developer",
      "company": "Startup Inc",
      "location": "New York, NY",
      "description": "We are seeking a talented frontend developer...",
      "requirements": "2+ years React experience, knowledge of TypeScript",
      "status": "pending",
      "created_at": "2026-01-01T12:00:00.000Z",
      "reviewed_at": null,
      "reviewed_by_admin_id": null,
      "rejection_reason": null
    },
    {
      "request_id": 5,
      "alumni_user_id": 25,
      "job_title": "UI/UX Designer",
      "status": "approved",
      "reviewed_at": "2026-01-01T11:00:00.000Z"
    }
  ]
}
```

---

## 3. Student & Alumni Endpoints

### 3.1 Apply for Job

**POST** `/api/jobs/apply/:jobId`

Submit a job application. Users can only apply once per job.

**Access**: Students and Alumni only

**URL Parameters**:
- `jobId`: The ID of the job to apply for

**Request Body**:
```json
{
  "resume_url": "https://example.com/resume.pdf",
  "resume_text": "John Doe\nSoftware Engineer\n...",
  "cover_letter": "I am very interested in this position...",
  "additional_details": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.com",
    "availability": "Immediate"
  }
}
```

**Note**: Either `resume_url` OR `resume_text` is required. Both can be provided.

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Application submitted successfully!",
  "data": {
    "application_id": 42,
    "job_id": 12,
    "user_id": 30,
    "user_role": "student",
    "resume_url": "https://example.com/resume.pdf",
    "resume_text": "John Doe\nSoftware Engineer\n...",
    "cover_letter": "I am very interested in this position...",
    "additional_details": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "portfolio": "https://johndoe.com",
      "availability": "Immediate"
    },
    "applied_at": "2026-01-01T13:00:00.000Z",
    "status": "submitted"
  }
}
```

**Error Response (409) - Duplicate Application**:
```json
{
  "success": false,
  "message": "You have already applied for this job."
}
```

**Error Response (404) - Job Not Found**:
```json
{
  "success": false,
  "message": "Job not found."
}
```

---

### 3.2 Get My Applications

**GET** `/api/jobs/my/applications`

Retrieves all job applications submitted by the authenticated user.

**Access**: Students and Alumni only

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Your applications retrieved successfully.",
  "data": [
    {
      "application_id": 42,
      "job_id": 12,
      "user_id": 30,
      "user_role": "student",
      "resume_url": "https://example.com/resume.pdf",
      "applied_at": "2026-01-01T13:00:00.000Z",
      "status": "submitted",
      "job_title": "UI/UX Designer",
      "company": "Design Studio",
      "location": "Remote",
      "job_description": "Looking for a creative UI/UX designer..."
    }
  ]
}
```

---

## 4. General Endpoints

### 4.1 Get All Jobs

**GET** `/api/jobs`

Retrieves all approved and visible jobs with optional filters and pagination.

**Access**: All authenticated users

**Query Parameters**:
- `company` (optional): Filter by company name (case-insensitive partial match)
- `location` (optional): Filter by location (case-insensitive partial match)
- `search` (optional): Search in title, description, and company (case-insensitive)
- `limit` (optional): Number of jobs per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request**:
```
GET /api/jobs?company=tech&location=remote&limit=10&offset=0
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Jobs retrieved successfully.",
  "data": [
    {
      "job_id": 12,
      "title": "UI/UX Designer",
      "company": "Design Studio",
      "location": "Remote",
      "description": "Looking for a creative UI/UX designer...",
      "requirements": "3+ years experience in Figma, Adobe XD",
      "posted_by_user_id": 25,
      "posted_by_role": "alumni",
      "created_at": "2026-01-01T11:00:00.000Z",
      "updated_at": "2026-01-01T11:00:00.000Z",
      "application_count": "5"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 4.2 Get Job by ID

**GET** `/api/jobs/:jobId`

Retrieves detailed information about a specific job.

**Access**: All authenticated users

**URL Parameters**:
- `jobId`: The ID of the job

**Example Request**:
```
GET /api/jobs/12
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Job retrieved successfully.",
  "data": {
    "job_id": 12,
    "title": "UI/UX Designer",
    "company": "Design Studio",
    "location": "Remote",
    "description": "Looking for a creative UI/UX designer with a passion for creating beautiful user experiences...",
    "requirements": "3+ years experience in Figma, Adobe XD, strong portfolio",
    "posted_by_user_id": 25,
    "posted_by_role": "alumni",
    "created_at": "2026-01-01T11:00:00.000Z",
    "updated_at": "2026-01-01T11:00:00.000Z",
    "application_count": "5"
  }
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "Job not found."
}
```

---

### 4.3 Get Job Applications

**GET** `/api/jobs/:jobId/applications`

Retrieves all applications for a specific job.

**Access**: Admin or the user who posted the job

**URL Parameters**:
- `jobId`: The ID of the job

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Job applications retrieved successfully.",
  "data": [
    {
      "application_id": 42,
      "job_id": 12,
      "user_id": 30,
      "user_role": "student",
      "resume_url": "https://example.com/resume.pdf",
      "resume_text": null,
      "additional_details": {
        "linkedin": "https://linkedin.com/in/johndoe"
      },
      "cover_letter": "I am very interested...",
      "applied_at": "2026-01-01T13:00:00.000Z",
      "status": "submitted"
    }
  ],
  "job": {
    "job_id": 12,
    "title": "UI/UX Designer",
    "company": "Design Studio"
  }
}
```

**Error Response (403)**:
```json
{
  "success": false,
  "message": "You do not have permission to view applications for this job."
}
```

---

### 4.4 Delete Job

**DELETE** `/api/jobs/:jobId`

Deletes a job posting. This will also delete all associated applications (CASCADE).

**Access**: Admin or the user who posted the job

**URL Parameters**:
- `jobId`: The ID of the job to delete

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Job deleted successfully.",
  "data": {
    "job_id": 12,
    "title": "UI/UX Designer",
    "company": "Design Studio"
  }
}
```

**Error Response (403)**:
```json
{
  "success": false,
  "message": "You do not have permission to delete this job."
}
```

---

## Frontend Integration Examples

### Example 1: Post Job Popup (Admin)

```javascript
// Admin creates job directly
const createJob = async (formData) => {
  try {
    const response = await fetch('http://localhost:5000/api/jobs/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        description: formData.description,
        requirements: formData.requirements
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Job posted successfully!');
      closeModal();
      refreshJobsList();
    }
  } catch (error) {
    console.error('Error posting job:', error);
  }
};
```

### Example 2: Request Job Posting Popup (Alumni)

```javascript
// Alumni submits job request
const requestJobPosting = async (formData) => {
  try {
    const response = await fetch('http://localhost:5000/api/jobs/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        job_title: formData.title,
        company: formData.company,
        location: formData.location,
        description: formData.description,
        requirements: formData.requirements
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Job request submitted! Awaiting admin approval.');
      closeModal();
    }
  } catch (error) {
    console.error('Error submitting job request:', error);
  }
};
```

### Example 3: Apply for Job Popup (Students/Alumni)

```javascript
// Student/Alumni applies for job
const applyForJob = async (jobId, formData) => {
  try {
    const response = await fetch(`http://localhost:5000/api/jobs/apply/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resume_url: formData.resumeUrl,
        cover_letter: formData.coverLetter,
        additional_details: {
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
          availability: formData.availability
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Application submitted successfully!');
      closeModal();
    } else if (response.status === 409) {
      alert('You have already applied for this job.');
    }
  } catch (error) {
    console.error('Error applying for job:', error);
  }
};
```

---

## Installation & Setup

### 1. Initialize Database Tables

Run the initialization script to create all required tables:

```bash
cd server
node config/initJobsDatabase.js
```

Or import and run programmatically in your database setup:

```javascript
import initJobsDatabase from './config/initJobsDatabase.js';

await initJobsDatabase();
```

### 2. Verify Routes Registration

The jobs routes are automatically registered in `server.js`:

```javascript
import jobRoutes from './routes/jobRoutes.js';
app.use('/api/jobs', jobRoutes);
```

### 3. Test the API

Start your server and test the health endpoint:

```bash
cd server
npm start
```

Test jobs endpoint:
```bash
curl http://localhost:5000/api/jobs
```

---

## Access Control Summary

### Permission Matrix

| Endpoint | Admin | Alumni | Student |
|----------|-------|--------|---------|
| POST /jobs/create | ✅ | ❌ | ❌ |
| POST /jobs/request | ❌ | ✅ | ❌ |
| POST /jobs/approve/:id | ✅ | ❌ | ❌ |
| POST /jobs/reject/:id | ✅ | ❌ | ❌ |
| POST /jobs/apply/:id | ❌ | ✅ | ✅ |
| GET /jobs | ✅ | ✅ | ✅ |
| GET /jobs/:id | ✅ | ✅ | ✅ |
| GET /jobs/pending/requests | ✅ | ❌ | ❌ |
| GET /jobs/my/applications | ❌ | ✅ | ✅ |
| GET /jobs/my/requests | ❌ | ✅ | ❌ |
| GET /jobs/:id/applications | ✅ + Poster | ❌ | ❌ |
| DELETE /jobs/:id | ✅ + Poster | ❌ | ❌ |

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request / Validation error |
| 401 | Unauthorized / No token |
| 403 | Forbidden / Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate application) |
| 500 | Server error |

---

## Important Notes

1. **Duplicate Prevention**: The system prevents users from applying to the same job twice using a UNIQUE constraint on `(job_id, user_id)`.

2. **Cascade Deletion**: When a job is deleted, all associated applications are automatically deleted due to the CASCADE constraint.

3. **Alumni Job Workflow**: 
   - Alumni submit job requests → Goes to `pending_job_requests` table
   - Admin approves → Job moves to `jobs` table
   - Admin rejects → Request status updated to 'rejected'

4. **Authentication Required**: All endpoints require valid JWT authentication.

5. **Role Validation**: Each endpoint validates the user's role before allowing access.

---

## Testing Checklist

- [ ] Initialize database tables successfully
- [ ] Admin can create jobs directly
- [ ] Alumni can submit job requests
- [ ] Admin can view pending requests
- [ ] Admin can approve alumni job requests
- [ ] Admin can reject alumni job requests
- [ ] Students can apply for jobs
- [ ] Alumni can apply for jobs
- [ ] Duplicate applications are prevented
- [ ] Users can view all approved jobs
- [ ] Users can view specific job details
- [ ] Students/Alumni can view their applications
- [ ] Alumni can view their job requests
- [ ] Admin/Poster can view job applications
- [ ] Admin/Poster can delete jobs
- [ ] All role-based permissions are enforced

---

## Support & Maintenance

For issues or questions about the Jobs module:
1. Check error messages in server logs
2. Verify database tables are initialized
3. Confirm authentication tokens are valid
4. Ensure user roles are correctly set
5. Review API endpoint permissions

---

**Version**: 1.0.0  
**Last Updated**: January 1, 2026  
**Module Status**: ✅ Production Ready
