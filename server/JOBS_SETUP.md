# Jobs Module - Quick Setup Guide

## 🚀 Installation Steps

### Step 1: Initialize the Database

The Jobs module requires three new database tables. Run the initialization script:

```bash
cd server
node config/initJobsDatabase.js
```

**Expected Output:**
```
🔧 Initializing Jobs module database...
✅ Jobs table created/verified
✅ Pending job requests table created/verified
✅ Job applications table created/verified
✅ Indexes created/verified
✅ Triggers created/verified
✨ Jobs module database initialization complete!
✅ Database setup complete
```

### Step 2: Verify Server Integration

The Jobs routes are already integrated into your server. Restart your server:

```bash
cd server
npm start
```

### Step 3: Test the API

Visit the root endpoint to verify jobs routes are registered:

```bash
curl http://localhost:5000/
```

You should see:
```json
{
  "success": true,
  "message": "SETU API Server is running!",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "admin": "/api/admin",
    "events": "/api/events",
    "jobs": "/api/jobs"
  }
}
```

---

## 🧪 Quick API Tests

### Test 1: Admin Creates a Job

```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "description": "Looking for experienced developer",
    "requirements": "5+ years experience"
  }'
```

### Test 2: Alumni Submits Job Request

```bash
curl -X POST http://localhost:5000/api/jobs/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ALUMNI_TOKEN" \
  -d '{
    "job_title": "UI Designer",
    "company": "Design Studio",
    "location": "Remote",
    "description": "Creative designer needed",
    "requirements": "3+ years experience"
  }'
```

### Test 3: Get All Jobs

```bash
curl http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Student Applies for Job

```bash
curl -X POST http://localhost:5000/api/jobs/apply/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{
    "resume_url": "https://example.com/resume.pdf",
    "cover_letter": "I am interested in this position..."
  }'
```

---

## 📁 Files Added

The Jobs module consists of these new files:

1. **Database Schema**: `server/config/initJobsDatabase.js`
   - Creates tables: jobs, pending_job_requests, job_applications
   - Sets up indexes and triggers

2. **Controller**: `server/controllers/jobController.js`
   - All business logic for job operations
   - Role-based validation and access control

3. **Routes**: `server/routes/jobRoutes.js`
   - API endpoint definitions
   - Middleware configuration

4. **Documentation**: 
   - `server/JOBS_MODULE.md` - Complete API documentation
   - `server/JOBS_SETUP.md` - This quick setup guide

5. **Updated File**: `server/server.js`
   - Added jobs routes registration

---

## 🔐 Role-Based Access Summary

### Admin Can:
- ✅ Create jobs directly (published immediately)
- ✅ View pending job requests from alumni
- ✅ Approve alumni job requests
- ✅ Reject alumni job requests
- ✅ View all job applications
- ✅ Delete any job

### Alumni Can:
- ✅ Submit job posting requests (requires admin approval)
- ✅ Apply for approved jobs
- ✅ View their own job requests and status
- ✅ View their own applications
- ✅ Delete their own approved jobs

### Students Can:
- ✅ Apply for approved jobs
- ✅ View their own applications

---

## 🎯 Workflow Examples

### Workflow 1: Admin Posts Job
1. Admin clicks "Post Job" button
2. Popup form opens
3. Admin fills: title, company, location, description, requirements
4. Submit → **POST /api/jobs/create**
5. Job is immediately visible to all users

### Workflow 2: Alumni Posts Job
1. Alumni clicks "Post Job" button
2. Popup form opens
3. Alumni fills: job_title, company, location, description, requirements
4. Submit → **POST /api/jobs/request**
5. Request goes to pending list
6. Admin reviews and approves → **POST /api/jobs/approve/:requestId**
7. Job becomes visible to all users

### Workflow 3: Student/Alumni Applies for Job
1. User clicks "Apply" on a job listing
2. Application popup opens
3. User fills: resume_url/resume_text, cover_letter, additional details
4. Submit → **POST /api/jobs/apply/:jobId**
5. Application is submitted
6. System prevents duplicate applications

---

## ⚠️ Important Notes

1. **No Existing Features Modified**: This module only adds new functionality. All existing features remain unchanged.

2. **Authentication Required**: All endpoints require JWT authentication via the existing auth system.

3. **Duplicate Prevention**: Users cannot apply for the same job twice (enforced by database constraint).

4. **Cascade Deletion**: When a job is deleted, all applications for that job are automatically deleted.

5. **Alumni Approval Workflow**: Alumni cannot publish jobs directly. All their job postings must be approved by an admin first.

---

## 🔍 Troubleshooting

### Database Tables Not Created?

Run the initialization script again:
```bash
node config/initJobsDatabase.js
```

### Routes Not Found (404)?

Verify server.js has the jobs routes imported:
```javascript
import jobRoutes from './routes/jobRoutes.js';
app.use('/api/jobs', jobRoutes);
```

### Permission Denied (403)?

Check:
- User is authenticated (valid JWT token)
- User has the correct role for the endpoint
- Token includes `role` field

### Duplicate Application Error?

This is expected behavior. Users can only apply once per job.

---

## 📊 Database Verification

Check if tables were created successfully:

```sql
-- Connect to your database
psql -U postgres -d setu_db

-- Verify tables exist
\dt

-- Check jobs table
SELECT * FROM jobs;

-- Check pending requests
SELECT * FROM pending_job_requests;

-- Check applications
SELECT * FROM job_applications;
```

---

## 🎉 You're All Set!

The Jobs module is now fully integrated and ready to use. 

**Next Steps:**
1. Test the API endpoints using the examples above
2. Build your frontend components to interact with the API
3. Refer to `JOBS_MODULE.md` for complete API documentation

**Need Help?**
- Review the complete documentation in `JOBS_MODULE.md`
- Check the controller implementations in `jobController.js`
- Verify database schema in `initJobsDatabase.js`

---

**Module Version**: 1.0.0  
**Compatible with**: Node.js + Express + PostgreSQL  
**Status**: ✅ Production Ready
