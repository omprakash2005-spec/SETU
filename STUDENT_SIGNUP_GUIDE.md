# Student Signup Backend - Complete Implementation Guide

## 📋 Overview

This implementation provides a complete student signup system with:
- ✅ OTP email verification (6-digit code, 5-minute expiry)
- ✅ Student ID card upload (images + PDFs to Cloudinary)
- ✅ Secure password hashing with bcrypt
- ✅ JWT authentication
- ✅ Rate limiting for OTP requests
- ✅ Production-ready, collaboration-safe (no disk storage)

---

## 🗂️ Files Created/Modified

### New Files:
1. `server/config/initStudentsDatabase.js` - Database schema initialization
2. `server/controllers/studentAuthController.js` - Student auth logic with OTP
3. `server/routes/studentAuthRoutes.js` - Student auth routes
4. `server/utils/emailService.js` - Email service for OTP sending

### Modified Files:
1. `server/config/multer.js` - Added ID card upload support (images + PDFs)
2. `server/config/cloudinary.js` - Added document upload function
3. `server/server.js` - Registered student routes and database init
4. `server/.env.example` - Added email configuration
5. `server/package.json` - Added nodemailer dependency

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

This will install the new `nodemailer` package along with existing dependencies.

### 2. Configure Environment Variables

Update your `server/.env` file with these new variables:

```env
# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Important for Gmail:**
1. Enable 2-factor authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password (NOT your regular Gmail password)

### 3. Initialize Database

The database tables will be created automatically when you start the server. Or run manually:

```bash
node config/initStudentsDatabase.js
```

This creates:
- `students` table (student profiles)
- `student_email_otps` table (OTP verification)
- Indexes for performance
- Triggers for auto-update timestamps

### 4. Start Server

```bash
npm run dev
```

The server will automatically initialize the student database on startup.

---

## 📡 API Endpoints

### Base URL: `/api/auth/student`

### 1. Send OTP

**Endpoint:** `POST /api/auth/student/send-otp`

**Request Body:**
```json
{
  "email": "student@college.edu"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email. Please check your inbox."
}
```

**Response (Error - Already Registered):**
```json
{
  "success": false,
  "message": "A student account with this email already exists. Please login instead."
}
```

**Response (Error - Rate Limited):**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please wait a minute before trying again."
}
```

---

### 2. Verify OTP

**Endpoint:** `POST /api/auth/student/verify-otp`

**Request Body:**
```json
{
  "email": "student@college.edu",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now complete your signup."
}
```

**Response (Error - Invalid OTP):**
```json
{
  "success": false,
  "message": "Invalid OTP. Please try again."
}
```

**Response (Error - Expired):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
```

---

### 3. Student Signup

**Endpoint:** `POST /api/auth/student/signup`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `full_name` (string, required)
- `email` (string, required)
- `password` (string, required, min 6 chars)
- `roll_number` (string, required)
- `department` (string, required)
- `graduation_year` (number, required)
- `student_id_card` (file, optional, jpg/png/pdf, max 5MB)

**Example using JavaScript Fetch:**
```javascript
const formData = new FormData();
formData.append('full_name', 'John Doe');
formData.append('email', 'john@college.edu');
formData.append('password', 'password123');
formData.append('roll_number', '2021CS001');
formData.append('department', 'Computer Science');
formData.append('graduation_year', '2025');
formData.append('student_id_card', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/auth/student/signup', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Student account created successfully!",
  "data": {
    "student": {
      "student_id": 1,
      "full_name": "John Doe",
      "email": "john@college.edu",
      "roll_number": "2021CS001",
      "department": "Computer Science",
      "graduation_year": 2025,
      "student_id_card_url": "https://res.cloudinary.com/...",
      "is_email_verified": true,
      "created_at": "2026-01-20T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - Email Not Verified):**
```json
{
  "success": false,
  "message": "Email not verified. Please verify your email with OTP first."
}
```

**Response (Error - Duplicate Roll Number):**
```json
{
  "success": false,
  "message": "This roll number is already registered."
}
```

---

### 4. Student Login

**Endpoint:** `POST /api/auth/student/login`

**Request Body:**
```json
{
  "email": "student@college.edu",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "student": {
      "student_id": 1,
      "full_name": "John Doe",
      "email": "john@college.edu",
      "roll_number": "2021CS001",
      "department": "Computer Science",
      "graduation_year": 2025,
      "student_id_card_url": "https://res.cloudinary.com/...",
      "is_email_verified": true,
      "created_at": "2026-01-20T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🔐 Security Features

### 1. OTP Security
- ✅ OTP stored as bcrypt hash (not plain text)
- ✅ 5-minute expiry
- ✅ Rate limiting: Max 3 OTP requests per email per minute
- ✅ Auto-cleanup of verified OTPs after signup

### 2. Password Security
- ✅ Bcrypt hashing with salt rounds = 10
- ✅ Minimum 6 characters
- ✅ Never returned in API responses

### 3. File Upload Security
- ✅ File type validation (only jpg, png, pdf)
- ✅ File size limit: 5MB
- ✅ Memory storage (collaboration-safe)
- ✅ Cloudinary secure URLs with HTTPS

### 4. Database Security
- ✅ Unique constraints on email and roll_number
- ✅ SQL injection prevention via parameterized queries
- ✅ Proper indexes for query performance

---

## 🧪 Testing the Implementation

### Test Flow 1: Complete Signup

1. **Send OTP**
```bash
curl -X POST http://localhost:5000/api/auth/student/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@college.edu"}'
```

2. **Check your email** for the 6-digit OTP

3. **Verify OTP**
```bash
curl -X POST http://localhost:5000/api/auth/student/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@college.edu", "otp": "123456"}'
```

4. **Complete Signup**
```bash
curl -X POST http://localhost:5000/api/auth/student/signup \
  -F "full_name=John Doe" \
  -F "email=test@college.edu" \
  -F "password=password123" \
  -F "roll_number=2021CS001" \
  -F "department=Computer Science" \
  -F "graduation_year=2025" \
  -F "student_id_card=@/path/to/id-card.jpg"
```

5. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@college.edu", "password": "password123"}'
```

### Test Flow 2: Error Cases

**Test duplicate email:**
```bash
# Try signing up with same email twice
```

**Test OTP expiry:**
```bash
# Wait 6 minutes after sending OTP, then try to verify
```

**Test rate limiting:**
```bash
# Send 4 OTP requests in quick succession
```

---

## 📊 Database Schema

### `students` Table
```sql
CREATE TABLE students (
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
```

### `student_email_otps` Table
```sql
CREATE TABLE student_email_otps (
  otp_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_pending_otp UNIQUE (email, verified)
);
```

---

## 🔧 Troubleshooting

### Email Not Sending

**Problem:** OTP emails not being delivered

**Solutions:**
1. Check Gmail App Password is correct (16 characters, no spaces)
2. Verify 2FA is enabled on Gmail account
3. Check spam folder
4. Test email connection:
```javascript
import { testEmailConnection } from './utils/emailService.js';
await testEmailConnection();
```

### Cloudinary Upload Failing

**Problem:** ID card upload returns error

**Solutions:**
1. Verify Cloudinary credentials in `.env`
2. Check file size < 5MB
3. Ensure file format is jpg/png/pdf
4. Check Cloudinary dashboard for quota limits

### Database Connection Issues

**Problem:** Cannot connect to Neon database

**Solutions:**
1. Verify `DB_SSL=true` for Neon
2. Check database credentials
3. Ensure IP is whitelisted in Neon dashboard
4. Test connection:
```bash
node config/database.js
```

---

## 🎨 Frontend Integration Example

### React Component Example

```jsx
import { useState } from 'react';

function StudentSignup() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: signup
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    roll_number: '',
    department: '',
    graduation_year: '',
  });
  const [idCard, setIdCard] = useState(null);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/auth/student/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (data.success) {
      setStep(2);
      alert('OTP sent to your email!');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:5000/api/auth/student/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (data.success) {
      setStep(3);
      alert('Email verified!');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('full_name', formData.full_name);
    form.append('email', email);
    form.append('password', formData.password);
    form.append('roll_number', formData.roll_number);
    form.append('department', formData.department);
    form.append('graduation_year', formData.graduation_year);
    if (idCard) form.append('student_id_card', idCard);

    const response = await fetch('http://localhost:5000/api/auth/student/signup', {
      method: 'POST',
      body: form,
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      alert('Signup successful!');
      // Redirect to dashboard
    }
  };

  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleSendOTP}>
          <input
            type="email"
            placeholder="College Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
          />
          <button type="submit">Verify OTP</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Roll Number"
            value={formData.roll_number}
            onChange={(e) => setFormData({...formData, roll_number: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Department"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Graduation Year"
            value={formData.graduation_year}
            onChange={(e) => setFormData({...formData, graduation_year: e.target.value})}
            required
          />
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setIdCard(e.target.files[0])}
          />
          <button type="submit">Complete Signup</button>
        </form>
      )}
    </div>
  );
}

export default StudentSignup;
```

---

## ✅ Implementation Checklist

- [x] Database schema for students and OTPs
- [x] OTP generation and email sending
- [x] OTP verification with expiry
- [x] Rate limiting for OTP requests
- [x] Student signup with all validations
- [x] ID card upload to Cloudinary
- [x] Password hashing with bcrypt
- [x] JWT token generation
- [x] Student login endpoint
- [x] Email uniqueness validation
- [x] Roll number uniqueness validation
- [x] Graduation year validation
- [x] File type and size validation
- [x] Error handling and status codes
- [x] Environment variables configuration
- [x] Production-ready (no disk storage)

---

## 🚀 Next Steps

1. **Install nodemailer:** `cd server && npm install`
2. **Configure Gmail App Password** in `.env`
3. **Test the flow** using Postman or curl
4. **Build the frontend** signup form
5. **Deploy to production** with proper environment variables

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check server logs for detailed error messages
4. Ensure database tables are created properly

---

**Implementation completed successfully! ✅**
