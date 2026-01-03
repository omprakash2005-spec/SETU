# Jobs Module - Quick Reference

## 🚀 Quick Start (3 Steps)

```bash
# 1. Initialize Database
cd server
node config/initJobsDatabase.js

# 2. Restart Server
npm start

# 3. Test API
curl http://localhost:5000/api/jobs -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📌 Most Common Endpoints

### Students
```javascript
// View all jobs
GET /api/jobs

// Apply for a job
POST /api/jobs/apply/:jobId
Body: { resume_url, cover_letter }

// View my applications
GET /api/jobs/my/applications
```

### Alumni
```javascript
// View all jobs
GET /api/jobs

// Request to post a job
POST /api/jobs/request
Body: { job_title, company, location, description, requirements }

// View my requests
GET /api/jobs/my/requests

// Apply for a job
POST /api/jobs/apply/:jobId
Body: { resume_url, cover_letter }

// View my applications
GET /api/jobs/my/applications
```

### Admin
```javascript
// Create job directly
POST /api/jobs/create
Body: { title, company, location, description, requirements }

// View pending requests
GET /api/jobs/pending/requests

// Approve request
POST /api/jobs/approve/:requestId

// Reject request
POST /api/jobs/reject/:requestId
Body: { rejection_reason } (optional)

// View applications for a job
GET /api/jobs/:jobId/applications

// Delete a job
DELETE /api/jobs/:jobId
```

---

## 🔑 Request Examples

### Create Job (Admin)
```json
POST /api/jobs/create
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "description": "Looking for experienced developer",
  "requirements": "5+ years experience"
}
```

### Request Job (Alumni)
```json
POST /api/jobs/request
{
  "job_title": "UI Designer",
  "company": "Design Co",
  "location": "Remote",
  "description": "Creative designer needed",
  "requirements": "3+ years experience"
}
```

### Apply for Job (Student/Alumni)
```json
POST /api/jobs/apply/12
{
  "resume_url": "https://example.com/resume.pdf",
  "cover_letter": "I am interested...",
  "additional_details": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.com"
  }
}
```

---

## 📋 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Job created successfully!",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error" (optional)
}
```

---

## 🔐 Authentication

All endpoints require JWT token:

**Header Method:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cookie Method:**
```
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request / Validation Error |
| 401  | Unauthorized / No Token |
| 403  | Forbidden / No Permission |
| 404  | Not Found |
| 409  | Conflict (e.g., duplicate) |
| 500  | Server Error |

---

## 🎯 Role Permissions Quick Check

```
Action                  Admin  Alumni  Student
─────────────────────────────────────────────
View Jobs                ✅     ✅      ✅
Create Job Directly      ✅     ❌      ❌
Request Job              ❌     ✅      ❌
Approve/Reject Jobs      ✅     ❌      ❌
Apply for Job            ❌     ✅      ✅
View Own Applications    ❌     ✅      ✅
View Own Requests        ❌     ✅      ❌
View Job Applications    ✅*    ❌      ❌
Delete Job               ✅*    ❌      ❌

* Admin or job poster
```

---

## 🗄️ Database Tables

### jobs
```sql
job_id, title, company, location, description, 
requirements, posted_by_user_id, posted_by_role,
created_at, updated_at
```

### pending_job_requests
```sql
request_id, alumni_user_id, job_title, company,
location, description, requirements, status,
created_at, reviewed_at, reviewed_by_admin_id,
rejection_reason
```

### job_applications
```sql
application_id, job_id, user_id, user_role,
resume_url, resume_text, additional_details,
cover_letter, applied_at, status
UNIQUE(job_id, user_id)
```

---

## 🔄 Common Workflows

### Admin Posts Job
```
1. POST /api/jobs/create
2. Job appears immediately in job list
3. Users can apply
```

### Alumni Posts Job
```
1. POST /api/jobs/request
2. Goes to pending list
3. Admin: GET /api/jobs/pending/requests
4. Admin: POST /api/jobs/approve/:id
5. Job appears in job list
6. Users can apply
```

### User Applies for Job
```
1. Browse: GET /api/jobs
2. View details: GET /api/jobs/:id
3. Apply: POST /api/jobs/apply/:id
4. Check status: GET /api/jobs/my/applications
```

---

## 🛠️ Troubleshooting

### "Access denied. No token provided"
→ Add Authorization header or cookie

### "Access denied. Admin privileges required"
→ User role is not 'admin'

### "You have already applied for this job"
→ Duplicate application (expected behavior)

### "Pending job request not found"
→ Request ID invalid or already processed

### Database error
→ Run: `node config/initJobsDatabase.js`

---

## 📁 File Locations

```
server/
├── config/initJobsDatabase.js    # DB schema
├── controllers/jobController.js   # Business logic
├── routes/jobRoutes.js            # API endpoints
├── JOBS_MODULE.md                 # Full docs
├── JOBS_SETUP.md                  # Setup guide
└── JOBS_ARCHITECTURE.md           # Architecture
```

---

## 🧪 Test Commands

```bash
# Test authentication
curl http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create job (admin)
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"title":"Test Job","company":"Test Co","location":"Remote","description":"Test description","requirements":"Test req"}'

# Request job (alumni)
curl -X POST http://localhost:5000/api/jobs/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALUMNI_TOKEN" \
  -d '{"job_title":"Test Job","company":"Test Co","location":"Remote","description":"Test description","requirements":"Test req"}'

# Apply for job (student/alumni)
curl -X POST http://localhost:5000/api/jobs/apply/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d '{"resume_url":"https://example.com/resume.pdf","cover_letter":"Test cover letter"}'
```

---

## 💡 Tips

1. **Duplicate Prevention**: Built-in at database level
2. **Cascading Deletes**: Deleting job removes all applications
3. **Alumni Workflow**: All alumni jobs need admin approval
4. **Search**: Use query params for filtering (`?company=tech&location=remote`)
5. **Pagination**: Use `limit` and `offset` for large datasets

---

## 📚 Full Documentation

- **API Reference**: See `JOBS_MODULE.md`
- **Setup Guide**: See `JOBS_SETUP.md`
- **Architecture**: See `JOBS_ARCHITECTURE.md`

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: January 1, 2026
