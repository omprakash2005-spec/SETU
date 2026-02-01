# 🎓 SETU Student Signup Module

> Complete backend implementation for student registration with OTP email verification and ID card upload

## ✨ Features

🔐 **Secure OTP Verification**
- 6-digit OTP sent via email
- 5-minute expiry time
- Hashed storage (bcrypt)
- Rate limiting (3 requests/minute)

📤 **ID Card Upload**
- Support for JPG, PNG, PDF
- 5MB size limit
- Cloudinary cloud storage
- Production-ready (no disk storage)

🔒 **Security**
- Bcrypt password hashing
- JWT authentication
- SQL injection prevention
- Input validation
- CORS protection

📧 **Email Service**
- Professional HTML templates
- Nodemailer integration
- Gmail/SendGrid support
- Error handling

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

This installs the new `nodemailer` package along with all existing dependencies.

### 2. Configure Environment

Add to `server/.env`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication first
3. Create new app password
4. Copy 16-character password (no spaces)
5. Paste into `EMAIL_PASS`

### 3. Start Server

```bash
npm run dev
```

Database tables will be created automatically on first run.

### 4. Test the API

```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/student/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu"}'
```

Check your email for the OTP!

---

## 📡 API Endpoints

### Base URL: `/api/auth/student`

#### 1. Send OTP
```http
POST /send-otp
Content-Type: application/json

{
  "email": "student@college.edu"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email. Please check your inbox."
}
```

---

#### 2. Verify OTP
```http
POST /verify-otp
Content-Type: application/json

{
  "email": "student@college.edu",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now complete your signup."
}
```

---

#### 3. Student Signup
```http
POST /signup
Content-Type: multipart/form-data

Fields:
- full_name: "John Doe"
- email: "student@college.edu"
- password: "password123"
- roll_number: "2021CS001"
- department: "Computer Science"
- graduation_year: 2025
- student_id_card: [file] (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Student account created successfully!",
  "data": {
    "student": {
      "student_id": 1,
      "full_name": "John Doe",
      "email": "student@college.edu",
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

#### 4. Student Login
```http
POST /login
Content-Type: application/json

{
  "email": "student@college.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "student": { /* student data */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🗄️ Database Schema

### `students` Table
| Column | Type | Constraints |
|--------|------|-------------|
| student_id | SERIAL | PRIMARY KEY |
| full_name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| roll_number | VARCHAR(100) | UNIQUE, NOT NULL |
| department | VARCHAR(100) | NOT NULL |
| graduation_year | INTEGER | NOT NULL |
| student_id_card_url | TEXT | |
| is_email_verified | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### `student_email_otps` Table
| Column | Type | Constraints |
|--------|------|-------------|
| otp_id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | NOT NULL |
| otp_hash | VARCHAR(255) | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| verified | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 📂 File Structure

```
server/
├── config/
│   ├── initStudentsDatabase.js    # Database initialization
│   ├── schema_students.sql         # SQL schema
│   ├── cloudinary.js               # Updated with document upload
│   └── multer.js                   # Updated with PDF support
├── controllers/
│   └── studentAuthController.js    # Student auth logic
├── routes/
│   └── studentAuthRoutes.js        # Student routes
├── utils/
│   └── emailService.js             # OTP email service
└── server.js                       # Updated with student routes

docs/
├── STUDENT_SIGNUP_GUIDE.md         # Complete guide
├── STUDENT_SIGNUP_TESTING.md       # Testing guide
├── STUDENT_SIGNUP_DEPLOYMENT.md    # Deployment checklist
├── STUDENT_SIGNUP_SUMMARY.md       # Implementation summary
└── STUDENT_SIGNUP_QUICK_REFERENCE.md  # Quick reference
```

---

## 🔒 Security Features

✅ **Password Security**
- Bcrypt hashing with salt rounds = 10
- Minimum 6 characters
- Never returned in API responses

✅ **OTP Security**
- Stored as bcrypt hash (not plain text)
- 5-minute expiry
- One-time use only
- Rate limiting (max 3/minute per email)

✅ **File Upload Security**
- File type whitelist (jpg, png, pdf only)
- Size limit (5MB max)
- Memory storage (no disk writes)
- Cloudinary secure HTTPS URLs

✅ **Database Security**
- Unique constraints on email and roll_number
- Parameterized queries (SQL injection prevention)
- Optimized indexes
- Connection pooling

---

## 🧪 Testing

### Postman Collection
Import `SETU_Student_Signup_Postman_Collection.json` into Postman for ready-to-use API tests.

### Manual Testing
```bash
# Complete signup flow
./test-student-signup.sh
```

See [STUDENT_SIGNUP_TESTING.md](./STUDENT_SIGNUP_TESTING.md) for comprehensive test cases.

---

## 🚀 Deployment

### Environment Variables Required

```env
# Database
DB_HOST=your-neon-host.neon.tech
DB_SSL=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT
JWT_SECRET=your-secret-key
```

### Production Recommendations

**Email Service:**
- Use SendGrid or Mailgun instead of Gmail
- Set up dedicated email domain
- Monitor delivery rates

**Monitoring:**
- Track OTP delivery success
- Monitor signup completion rates
- Alert on high error rates

See [STUDENT_SIGNUP_DEPLOYMENT.md](./STUDENT_SIGNUP_DEPLOYMENT.md) for complete deployment guide.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Quick Reference](./STUDENT_SIGNUP_QUICK_REFERENCE.md) | Quick setup and API reference |
| [Complete Guide](./STUDENT_SIGNUP_GUIDE.md) | Detailed implementation guide |
| [Testing Guide](./STUDENT_SIGNUP_TESTING.md) | API testing and error cases |
| [Deployment](./STUDENT_SIGNUP_DEPLOYMENT.md) | Production deployment checklist |
| [Summary](./STUDENT_SIGNUP_SUMMARY.md) | Implementation overview |

---

## 🎨 Frontend Integration

### React Example

```jsx
import { useState } from 'react';

function StudentSignup() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const sendOTP = async () => {
    const res = await fetch('http://localhost:5000/api/auth/student/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) setStep(2);
  };
  
  const verifyOTP = async () => {
    const res = await fetch('http://localhost:5000/api/auth/student/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (data.success) setStep(3);
  };
  
  const signup = async (formData) => {
    const res = await fetch('http://localhost:5000/api/auth/student/signup', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      // Redirect to dashboard
    }
  };
  
  // Render forms based on step...
}
```

See [STUDENT_SIGNUP_GUIDE.md](./STUDENT_SIGNUP_GUIDE.md#frontend-integration) for complete examples.

---

## 🐛 Troubleshooting

### Email Not Sending
- Verify Gmail App Password (16 characters)
- Enable 2FA on Gmail account
- Check spam folder
- Review server logs for errors

### Cloudinary Upload Fails
- Verify credentials in `.env`
- Check file size < 5MB
- Ensure correct file format (jpg/png/pdf)
- Check Cloudinary quota

### Database Errors
- Run: `node config/initStudentsDatabase.js`
- Verify Neon connection
- Ensure `DB_SSL=true`

See [Troubleshooting Guide](./STUDENT_SIGNUP_GUIDE.md#troubleshooting) for more solutions.

---

## ✅ Implementation Status

- [x] Database schema with migrations
- [x] OTP generation and email sending
- [x] OTP verification with expiry
- [x] Rate limiting for OTP requests
- [x] Student signup with validation
- [x] ID card upload to Cloudinary
- [x] Password hashing with bcrypt
- [x] JWT token generation
- [x] Student login endpoint
- [x] Comprehensive error handling
- [x] Production-ready deployment
- [x] Complete documentation
- [x] Postman collection
- [x] Test cases

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting Guide](./STUDENT_SIGNUP_GUIDE.md#troubleshooting)
2. Review [Testing Guide](./STUDENT_SIGNUP_TESTING.md)
3. Verify environment variables
4. Check server logs

---

## 📝 License

Part of the SETU Alumni Network Platform

---

## 🎉 Credits

**Implemented:** January 20, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0

---

**Happy Coding! 🚀**
