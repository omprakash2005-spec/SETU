# 📋 Student Signup - Quick Reference

## 🚀 Quick Setup (3 Steps)

### 1. Install
```bash
cd server && npm install
```

### 2. Configure Email in `.env`
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

Get App Password: https://myaccount.google.com/apppasswords

### 3. Start
```bash
npm run dev
```

---

## 📡 API Endpoints

**Base:** `http://localhost:5000/api/auth/student`

### 1. Send OTP
```bash
POST /send-otp
Body: {"email": "student@college.edu"}
```

### 2. Verify OTP
```bash
POST /verify-otp
Body: {"email": "student@college.edu", "otp": "123456"}
```

### 3. Signup
```bash
POST /signup
Content-Type: multipart/form-data
Fields:
- full_name
- email
- password (min 6 chars)
- roll_number
- department
- graduation_year
- student_id_card (file, optional, jpg/png/pdf, max 5MB)
```

### 4. Login
```bash
POST /login
Body: {"email": "student@college.edu", "password": "password123"}
```

---

## 🔥 Quick Test

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/student/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu"}'

# 2. Check email, get OTP

# 3. Verify OTP
curl -X POST http://localhost:5000/api/auth/student/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","otp":"123456"}'

# 4. Signup
curl -X POST http://localhost:5000/api/auth/student/signup \
  -F "full_name=John Doe" \
  -F "email=test@college.edu" \
  -F "password=password123" \
  -F "roll_number=2021CS001" \
  -F "department=Computer Science" \
  -F "graduation_year=2025"
```

---

## 📦 New Files

**Configuration:**
- `config/initStudentsDatabase.js` - DB init
- `config/schema_students.sql` - SQL schema

**Backend:**
- `controllers/studentAuthController.js` - Auth logic
- `routes/studentAuthRoutes.js` - Routes
- `utils/emailService.js` - Email/OTP

**Docs:**
- `STUDENT_SIGNUP_GUIDE.md` - Full guide
- `STUDENT_SIGNUP_TESTING.md` - Test guide
- `STUDENT_SIGNUP_DEPLOYMENT.md` - Deploy guide
- `STUDENT_SIGNUP_SUMMARY.md` - Summary
- `STUDENT_SIGNUP_QUICK_REFERENCE.md` - This file

---

## 🔧 Modified Files

- `config/multer.js` - Added PDF support
- `config/cloudinary.js` - Document upload
- `server.js` - Student routes
- `.env.example` - Email config
- `package.json` - Added nodemailer

---

## ✅ Features

- [x] OTP email verification (6-digit, 5-min expiry)
- [x] Student ID card upload (jpg/png/pdf, max 5MB)
- [x] Bcrypt password hashing
- [x] JWT authentication
- [x] Rate limiting (3 OTP/min)
- [x] Cloudinary integration
- [x] Email validation
- [x] Unique email/roll number
- [x] Production-ready
- [x] Collaboration-safe

---

## 🗄️ Database Tables

### `students`
- student_id (PK)
- full_name
- email (UNIQUE)
- password_hash
- roll_number (UNIQUE)
- department
- graduation_year
- student_id_card_url
- is_email_verified
- created_at, updated_at

### `student_email_otps`
- otp_id (PK)
- email
- otp_hash
- expires_at
- verified
- created_at

---

## 🐛 Troubleshooting

**Email not sending?**
- Check Gmail App Password (16 chars)
- Enable 2FA on Gmail
- Check spam folder

**Cloudinary error?**
- Verify credentials in `.env`
- Check file size < 5MB
- Ensure jpg/png/pdf format

**Database error?**
- Run: `node config/initStudentsDatabase.js`
- Check Neon connection
- Verify `DB_SSL=true`

---

## 📚 Full Documentation

- **Setup & API:** `STUDENT_SIGNUP_GUIDE.md`
- **Testing:** `STUDENT_SIGNUP_TESTING.md`
- **Deployment:** `STUDENT_SIGNUP_DEPLOYMENT.md`
- **Summary:** `STUDENT_SIGNUP_SUMMARY.md`

---

## 🎯 Status: ✅ READY

**Next:** Configure email → Test locally → Deploy

---

**Quick Reference v1.0 | January 2026**
