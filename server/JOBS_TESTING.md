# Jobs Module - Testing Guide

## 🧪 Complete Testing Guide

This guide provides step-by-step instructions to test all Jobs module functionality.

---

## Prerequisites

1. ✅ Server running on `http://localhost:5000`
2. ✅ Database initialized with Jobs tables
3. ✅ Valid JWT tokens for Admin, Alumni, and Student roles

---

## Getting Test Tokens

First, login as different users to get JWT tokens:

```bash
# Admin Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@setu.com","password":"your_password"}'

# Alumni Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alumni@setu.com","password":"your_password"}'

# Student Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@setu.com","password":"your_password"}'
```

Save the tokens from responses for testing.

---

## Test Suite 1: Admin Functionality

### Test 1.1: Admin Creates Job ✅

**Expected**: Success (201)

```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Senior Software Engineer",
    "company": "Tech Corporation",
    "location": "San Francisco, CA",
    "description": "We are looking for an experienced software engineer to join our team. You will work on cutting-edge technologies.",
    "requirements": "5+ years experience in React, Node.js, PostgreSQL. Strong problem-solving skills."
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job created and published successfully!",
  "data": {
    "job_id": 1,
    "title": "Senior Software Engineer",
    "posted_by_role": "admin",
    ...
  }
}
```

---

### Test 1.2: Non-Admin Cannot Create Job ❌

**Expected**: Forbidden (403)

```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d '{
    "title": "Test Job",
    "company": "Test",
    "location": "Test",
    "description": "Test"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

---

### Test 1.3: Admin Views Pending Requests ✅

**Expected**: Success (200)

```bash
curl http://localhost:5000/api/jobs/pending/requests \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Pending job requests retrieved successfully.",
  "data": [],
  "totalPending": 0
}
```

---

## Test Suite 2: Alumni Functionality

### Test 2.1: Alumni Requests Job Posting ✅

**Expected**: Success (201)

```bash
curl -X POST http://localhost:5000/api/jobs/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALUMNI_TOKEN" \
  -d '{
    "job_title": "UI/UX Designer",
    "company": "Design Studio Inc",
    "location": "Remote",
    "description": "Looking for a creative UI/UX designer with a passion for creating beautiful user experiences. You will work on various projects for our clients.",
    "requirements": "3+ years experience in Figma, Adobe XD. Strong portfolio required."
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job posting request submitted successfully! It will be visible after admin approval.",
  "data": {
    "request_id": 1,
    "status": "pending",
    ...
  }
}
```

---

### Test 2.2: Alumni Cannot Create Job Directly ❌

**Expected**: Forbidden (403)

```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALUMNI_TOKEN" \
  -d '{
    "title": "Test Job",
    "company": "Test",
    "location": "Test",
    "description": "Test"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Only admins can create jobs directly. Alumni should use the request endpoint."
}
```

---

### Test 2.3: Alumni Views Their Requests ✅

**Expected**: Success (200)

```bash
curl http://localhost:5000/api/jobs/my/requests \
  -H "Authorization: Bearer ALUMNI_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Your job requests retrieved successfully.",
  "data": [
    {
      "request_id": 1,
      "job_title": "UI/UX Designer",
      "status": "pending",
      ...
    }
  ]
}
```

---

## Test Suite 3: Approval Workflow

### Test 3.1: Admin Approves Alumni Request ✅

**Expected**: Success (200)

First, get the request_id from Test 2.1 or Test 1.3, then:

```bash
curl -X POST http://localhost:5000/api/jobs/approve/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job request approved and published successfully!",
  "data": {
    "job": {
      "job_id": 2,
      "title": "UI/UX Designer",
      "posted_by_role": "alumni",
      ...
    },
    "request": {
      "request_id": 1,
      "status": "approved",
      ...
    }
  }
}
```

---

### Test 3.2: Admin Rejects Alumni Request ❌

**Expected**: Success (200)

First, submit another request, then:

```bash
curl -X POST http://localhost:5000/api/jobs/reject/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "rejection_reason": "Job description needs more details about responsibilities and qualifications."
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job request rejected successfully.",
  "data": {
    "request_id": 2,
    "status": "rejected",
    "rejection_reason": "Job description needs more details...",
    ...
  }
}
```

---

### Test 3.3: Cannot Approve Already Processed Request ❌

**Expected**: Not Found (404)

```bash
curl -X POST http://localhost:5000/api/jobs/approve/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Pending job request not found or already processed."
}
```

---

## Test Suite 4: Job Browsing

### Test 4.1: Get All Jobs ✅

**Expected**: Success (200)

```bash
curl http://localhost:5000/api/jobs \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Jobs retrieved successfully.",
  "data": [
    {
      "job_id": 1,
      "title": "Senior Software Engineer",
      "company": "Tech Corporation",
      "application_count": "0",
      ...
    },
    {
      "job_id": 2,
      "title": "UI/UX Designer",
      "company": "Design Studio Inc",
      "application_count": "0",
      ...
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### Test 4.2: Filter Jobs by Company ✅

**Expected**: Success (200)

```bash
curl "http://localhost:5000/api/jobs?company=tech" \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

### Test 4.3: Search Jobs ✅

**Expected**: Success (200)

```bash
curl "http://localhost:5000/api/jobs?search=designer" \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

### Test 4.4: Get Job by ID ✅

**Expected**: Success (200)

```bash
curl http://localhost:5000/api/jobs/1 \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job retrieved successfully.",
  "data": {
    "job_id": 1,
    "title": "Senior Software Engineer",
    "company": "Tech Corporation",
    "description": "We are looking for...",
    "application_count": "0",
    ...
  }
}
```

---

## Test Suite 5: Job Applications

### Test 5.1: Student Applies for Job ✅

**Expected**: Success (201)

```bash
curl -X POST http://localhost:5000/api/jobs/apply/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d '{
    "resume_url": "https://example.com/resumes/john-doe.pdf",
    "cover_letter": "I am very interested in this position. I have 6 years of experience in full-stack development and would love to contribute to your team.",
    "additional_details": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "portfolio": "https://johndoe.dev",
      "availability": "Immediate",
      "expected_salary": "$120,000"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Application submitted successfully!",
  "data": {
    "application_id": 1,
    "job_id": 1,
    "user_role": "student",
    "status": "submitted",
    ...
  }
}
```

---

### Test 5.2: Alumni Applies for Job ✅

**Expected**: Success (201)

```bash
curl -X POST http://localhost:5000/api/jobs/apply/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALUMNI_TOKEN" \
  -d '{
    "resume_url": "https://example.com/resumes/jane-smith.pdf",
    "cover_letter": "As an alumnus with 4 years of design experience, I would be excited to join your team.",
    "additional_details": {
      "linkedin": "https://linkedin.com/in/janesmith",
      "portfolio": "https://janesmith.design"
    }
  }'
```

---

### Test 5.3: Duplicate Application Prevention ❌

**Expected**: Conflict (409)

Apply for the same job again:

```bash
curl -X POST http://localhost:5000/api/jobs/apply/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d '{
    "resume_url": "https://example.com/resumes/john-doe.pdf",
    "cover_letter": "Trying to apply again..."
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "You have already applied for this job."
}
```

---

### Test 5.4: Application Without Resume ❌

**Expected**: Bad Request (400)

```bash
curl -X POST http://localhost:5000/api/jobs/apply/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALUMNI_TOKEN" \
  -d '{
    "cover_letter": "No resume provided"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Please provide either a resume URL or resume text."
}
```

---

### Test 5.5: Admin Cannot Apply for Jobs ❌

**Expected**: Forbidden (403)

```bash
curl -X POST http://localhost:5000/api/jobs/apply/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "resume_url": "https://example.com/resume.pdf"
  }'
```

---

## Test Suite 6: View Applications

### Test 6.1: Student Views Their Applications ✅

**Expected**: Success (200)

```bash
curl http://localhost:5000/api/jobs/my/applications \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Your applications retrieved successfully.",
  "data": [
    {
      "application_id": 1,
      "job_id": 1,
      "job_title": "Senior Software Engineer",
      "company": "Tech Corporation",
      "status": "submitted",
      ...
    }
  ]
}
```

---

### Test 6.2: Admin Views Job Applications ✅

**Expected**: Success (200)

```bash
curl http://localhost:5000/api/jobs/1/applications \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job applications retrieved successfully.",
  "data": [
    {
      "application_id": 1,
      "user_id": 30,
      "user_role": "student",
      "resume_url": "https://example.com/resumes/john-doe.pdf",
      ...
    }
  ],
  "job": {
    "job_id": 1,
    "title": "Senior Software Engineer"
  }
}
```

---

### Test 6.3: Non-Admin Cannot View Job Applications ❌

**Expected**: Forbidden (403)

```bash
curl http://localhost:5000/api/jobs/1/applications \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

## Test Suite 7: Job Management

### Test 7.1: Admin Deletes Job ✅

**Expected**: Success (200)

```bash
curl -X DELETE http://localhost:5000/api/jobs/2 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job deleted successfully.",
  "data": {
    "job_id": 2,
    "title": "UI/UX Designer"
  }
}
```

---

### Test 7.2: Verify Applications Were Deleted (CASCADE) ✅

**Expected**: Applications for deleted job should be gone

```bash
curl http://localhost:5000/api/jobs/my/applications \
  -H "Authorization: Bearer ALUMNI_TOKEN"
```

The application for job_id 2 should not appear in the list.

---

### Test 7.3: Non-Admin Cannot Delete Job ❌

**Expected**: Forbidden (403)

```bash
curl -X DELETE http://localhost:5000/api/jobs/1 \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

## Test Suite 8: Error Handling

### Test 8.1: No Authentication Token ❌

**Expected**: Unauthorized (401)

```bash
curl http://localhost:5000/api/jobs
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### Test 8.2: Invalid Job ID ❌

**Expected**: Not Found (404)

```bash
curl http://localhost:5000/api/jobs/99999 \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Job not found."
}
```

---

### Test 8.3: Missing Required Fields ❌

**Expected**: Bad Request (400)

```bash
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Test Job"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Please provide title, company, and description."
}
```

---

## 📊 Testing Results Template

Use this checklist to track your testing:

```
✅ = Passed
❌ = Failed
⏭️ = Skipped

Admin Functionality:
[ ] Test 1.1: Admin Creates Job
[ ] Test 1.2: Non-Admin Cannot Create Job
[ ] Test 1.3: Admin Views Pending Requests

Alumni Functionality:
[ ] Test 2.1: Alumni Requests Job Posting
[ ] Test 2.2: Alumni Cannot Create Job Directly
[ ] Test 2.3: Alumni Views Their Requests

Approval Workflow:
[ ] Test 3.1: Admin Approves Alumni Request
[ ] Test 3.2: Admin Rejects Alumni Request
[ ] Test 3.3: Cannot Approve Already Processed Request

Job Browsing:
[ ] Test 4.1: Get All Jobs
[ ] Test 4.2: Filter Jobs by Company
[ ] Test 4.3: Search Jobs
[ ] Test 4.4: Get Job by ID

Job Applications:
[ ] Test 5.1: Student Applies for Job
[ ] Test 5.2: Alumni Applies for Job
[ ] Test 5.3: Duplicate Application Prevention
[ ] Test 5.4: Application Without Resume
[ ] Test 5.5: Admin Cannot Apply for Jobs

View Applications:
[ ] Test 6.1: Student Views Their Applications
[ ] Test 6.2: Admin Views Job Applications
[ ] Test 6.3: Non-Admin Cannot View Job Applications

Job Management:
[ ] Test 7.1: Admin Deletes Job
[ ] Test 7.2: Verify Applications Were Deleted (CASCADE)
[ ] Test 7.3: Non-Admin Cannot Delete Job

Error Handling:
[ ] Test 8.1: No Authentication Token
[ ] Test 8.2: Invalid Job ID
[ ] Test 8.3: Missing Required Fields
```

---

## 🔍 Database Verification

After testing, verify data in database:

```sql
-- Check jobs table
SELECT * FROM jobs;

-- Check pending requests
SELECT * FROM pending_job_requests;

-- Check applications
SELECT * FROM job_applications;

-- Verify unique constraint
SELECT job_id, user_id, COUNT(*) 
FROM job_applications 
GROUP BY job_id, user_id 
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check CASCADE delete worked
SELECT ja.* FROM job_applications ja
LEFT JOIN jobs j ON ja.job_id = j.job_id
WHERE j.job_id IS NULL;
-- Should return 0 rows (no orphaned applications)
```

---

## 🎯 Performance Testing

Test with larger datasets:

```bash
# Create 100 jobs (loop in bash)
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/jobs/create \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ADMIN_TOKEN" \
    -d "{\"title\":\"Job $i\",\"company\":\"Company $i\",\"location\":\"Location $i\",\"description\":\"Description $i\"}" &
done

# Test pagination
curl "http://localhost:5000/api/jobs?limit=10&offset=0" \
  -H "Authorization: Bearer STUDENT_TOKEN"

curl "http://localhost:5000/api/jobs?limit=10&offset=10" \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

## ✅ All Tests Passed?

If all tests pass:
- ✅ Jobs module is working correctly
- ✅ Role-based permissions are enforced
- ✅ Database constraints are working
- ✅ Error handling is proper
- ✅ Ready for production use!

---

**Testing Guide Version**: 1.0.0  
**Last Updated**: January 1, 2026
