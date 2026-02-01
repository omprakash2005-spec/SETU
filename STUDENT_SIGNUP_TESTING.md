# Student Signup API - Testing Guide

## 🧪 Testing with Postman

### Setup

1. **Install Postman** (if not already installed)
2. **Create a new collection** named "SETU Student Signup"
3. **Set base URL** as environment variable: `http://localhost:5000`

---

## Test Sequence

### Test 1: Send OTP

**Request:**
```
POST http://localhost:5000/api/auth/student/send-otp
Content-Type: application/json

{
  "email": "test.student@college.edu"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email. Please check your inbox."
}
```

**Check:**
- ✅ Email received with 6-digit OTP
- ✅ OTP is readable and formatted nicely
- ✅ Email contains expiry warning (5 minutes)

---

### Test 2: Verify OTP (Correct)

**Request:**
```
POST http://localhost:5000/api/auth/student/verify-otp
Content-Type: application/json

{
  "email": "test.student@college.edu",
  "otp": "123456"
}
```
*(Replace 123456 with actual OTP from email)*

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now complete your signup."
}
```

---

### Test 3: Student Signup (Complete)

**Request:**
```
POST http://localhost:5000/api/auth/student/signup
Content-Type: multipart/form-data

Form Data:
- full_name: John Doe
- email: test.student@college.edu
- password: password123
- roll_number: 2021CS001
- department: Computer Science
- graduation_year: 2025
- student_id_card: [Upload a JPG/PNG/PDF file]
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Student account created successfully!",
  "data": {
    "student": {
      "student_id": 1,
      "full_name": "John Doe",
      "email": "test.student@college.edu",
      "roll_number": "2021CS001",
      "department": "Computer Science",
      "graduation_year": 2025,
      "student_id_card_url": "https://res.cloudinary.com/...",
      "is_email_verified": true,
      "created_at": "2026-01-20T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Check:**
- ✅ Student record created in database
- ✅ ID card uploaded to Cloudinary
- ✅ JWT token returned
- ✅ Password not in response

---

### Test 4: Student Login

**Request:**
```
POST http://localhost:5000/api/auth/student/login
Content-Type: application/json

{
  "email": "test.student@college.edu",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "student": {
      "student_id": 1,
      "full_name": "John Doe",
      "email": "test.student@college.edu",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Error Case Testing

### Test 5: Invalid OTP

**Request:**
```
POST http://localhost:5000/api/auth/student/verify-otp
Content-Type: application/json

{
  "email": "test.student@college.edu",
  "otp": "000000"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

---

### Test 6: Expired OTP

**Steps:**
1. Send OTP
2. Wait 6 minutes
3. Try to verify OTP

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

---

### Test 7: Signup Without OTP Verification

**Request:**
```
POST http://localhost:5000/api/auth/student/signup
(Don't verify OTP first)

{
  "full_name": "Jane Doe",
  "email": "jane@college.edu",
  "password": "password123",
  ...
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email not verified. Please verify your email with OTP first."
}
```

---

### Test 8: Duplicate Email

**Request:**
```
POST http://localhost:5000/api/auth/student/send-otp

{
  "email": "test.student@college.edu"
}
```
*(Same email as already registered student)*

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "A student account with this email already exists. Please login instead."
}
```

---

### Test 9: Duplicate Roll Number

**Request:**
```
POST http://localhost:5000/api/auth/student/signup

{
  "full_name": "Another Student",
  "email": "different@college.edu",
  "password": "password123",
  "roll_number": "2021CS001",  // Same as existing
  ...
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "This roll number is already registered."
}
```

---

### Test 10: Invalid File Type

**Request:**
```
POST http://localhost:5000/api/auth/student/signup

Form Data:
- student_id_card: [Upload a .exe or .txt file]
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, and PDF files are allowed for ID cards."
}
```

---

### Test 11: File Too Large

**Request:**
```
POST http://localhost:5000/api/auth/student/signup

Form Data:
- student_id_card: [Upload a file > 5MB]
```

**Expected Response (400 Bad Request):**
Error from multer about file size

---

### Test 12: Rate Limiting (OTP)

**Steps:**
1. Send OTP request
2. Send OTP request again
3. Send OTP request again
4. Send OTP request (4th time)

**Expected Response on 4th request (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please wait a minute before trying again."
}
```

---

### Test 13: Invalid Email Format

**Request:**
```
POST http://localhost:5000/api/auth/student/send-otp

{
  "email": "not-an-email"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Please provide a valid email address."
}
```

---

### Test 14: Password Too Short

**Request:**
```
POST http://localhost:5000/api/auth/student/signup

{
  "password": "12345",  // Less than 6 characters
  ...
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long."
}
```

---

### Test 15: Invalid Graduation Year

**Request:**
```
POST http://localhost:5000/api/auth/student/signup

{
  "graduation_year": 2020,  // Year in the past
  ...
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Please provide a valid graduation year."
}
```

---

### Test 16: Login with Wrong Password

**Request:**
```
POST http://localhost:5000/api/auth/student/login

{
  "email": "test.student@college.edu",
  "password": "wrongpassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

## 🧪 Testing with cURL

### Complete Flow

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/student/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu"}'

# 2. Verify OTP (check your email for OTP)
curl -X POST http://localhost:5000/api/auth/student/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","otp":"123456"}'

# 3. Signup
curl -X POST http://localhost:5000/api/auth/student/signup \
  -F "full_name=John Doe" \
  -F "email=test@college.edu" \
  -F "password=password123" \
  -F "roll_number=2021CS001" \
  -F "department=Computer Science" \
  -F "graduation_year=2025" \
  -F "student_id_card=@/path/to/id-card.jpg"

# 4. Login
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","password":"password123"}'
```

---

## 📊 Database Verification

After testing, verify in PostgreSQL:

```sql
-- Check students table
SELECT * FROM students;

-- Check OTP records
SELECT * FROM student_email_otps;

-- Verify indexes
\d students
\d student_email_otps
```

---

## ✅ Test Checklist

- [ ] Send OTP - Success
- [ ] Receive email with OTP
- [ ] Verify OTP - Success
- [ ] Signup with all fields - Success
- [ ] ID card uploaded to Cloudinary
- [ ] Student login - Success
- [ ] JWT token received
- [ ] Invalid OTP - Error
- [ ] Expired OTP - Error
- [ ] Signup without verification - Error
- [ ] Duplicate email - Error
- [ ] Duplicate roll number - Error
- [ ] Invalid file type - Error
- [ ] File too large - Error
- [ ] OTP rate limiting - Works
- [ ] Invalid email format - Error
- [ ] Password too short - Error
- [ ] Invalid graduation year - Error
- [ ] Wrong password login - Error

---

## 🐛 Common Issues & Solutions

### Issue: Email not received

**Check:**
- Gmail App Password is correct
- Email in spam folder
- Email service credentials in `.env`
- Console logs for email errors

### Issue: OTP always invalid

**Check:**
- OTP entered is exactly 6 digits
- OTP hasn't expired (5 minutes)
- Email matches exactly (case-insensitive)

### Issue: File upload fails

**Check:**
- Cloudinary credentials in `.env`
- File format (jpg/png/pdf only)
- File size < 5MB
- Network connection to Cloudinary

### Issue: Database errors

**Check:**
- Database initialized (`initStudentsDatabase.js`)
- Neon connection active
- SSL enabled for Neon (`DB_SSL=true`)

---

**Testing Complete! 🎉**
