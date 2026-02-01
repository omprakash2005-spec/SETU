# Student Signup Backend - Deployment Checklist

## 📋 Pre-Deployment Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

**New dependency added:** `nodemailer@^6.9.7`

### 2. Configure Environment Variables

Add these to your `server/.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Gmail App Password Setup:**
1. Go to Google Account: https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate new password for "Mail"
5. Copy 16-character password (no spaces)
6. Paste in `EMAIL_PASS` in `.env`

### 3. Verify Other Required Variables

Ensure these are already in your `.env`:

```env
# Database
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_NAME=setu_db
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

---

## 🗄️ Database Setup

### Option 1: Automatic (Recommended)

The database tables will be created automatically when you start the server.

```bash
npm run dev
```

Look for this in console:
```
✅ Students table created/verified
✅ Student OTP table created/verified
✅ Indexes created/verified
✅ Triggers created/verified
✅ Students database initialization complete!
```

### Option 2: Manual

```bash
node config/initStudentsDatabase.js
```

### Option 3: Direct SQL

Run `server/config/schema_students.sql` directly in Neon SQL Editor.

---

## 🧪 Test the Implementation

### Quick Test

1. **Start server:**
```bash
cd server
npm run dev
```

2. **Send test OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/student/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

3. **Check email** - Should receive OTP within seconds

4. **Verify server logs** - Should see:
```
✅ OTP email sent successfully
```

---

## 🚀 Production Deployment

### Environment Variables to Add

For **Vercel**, **Render**, **Railway**, or **Heroku**:

Add these in your platform's dashboard:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password
```

**Important:**
- Use a dedicated email account for production
- Don't use personal email
- Consider using SendGrid/Mailgun for production instead of Gmail

### Alternative Email Services (Production)

#### SendGrid (Recommended for Production)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

Setup:
1. Sign up at https://sendgrid.com
2. Verify sender email
3. Create API key
4. Use API key as password

#### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

---

## 📂 File Changes Summary

### New Files Created:
1. `server/config/initStudentsDatabase.js` - Database initialization
2. `server/config/schema_students.sql` - SQL schema
3. `server/controllers/studentAuthController.js` - Student auth logic
4. `server/routes/studentAuthRoutes.js` - Student routes
5. `server/utils/emailService.js` - Email/OTP service
6. `STUDENT_SIGNUP_GUIDE.md` - Complete guide
7. `STUDENT_SIGNUP_TESTING.md` - Testing guide
8. `STUDENT_SIGNUP_DEPLOYMENT.md` - This file

### Files Modified:
1. `server/config/multer.js` - Added PDF support
2. `server/config/cloudinary.js` - Added document upload
3. `server/server.js` - Registered student routes
4. `server/.env.example` - Added email config
5. `server/package.json` - Added nodemailer

---

## ✅ Verification Checklist

Before going live, verify:

### Backend
- [ ] `npm install` completed successfully
- [ ] All environment variables set in `.env`
- [ ] Gmail App Password generated and working
- [ ] Database tables created (students, student_email_otps)
- [ ] Server starts without errors
- [ ] Test OTP email received
- [ ] Test signup flow works end-to-end

### Database
- [ ] Neon database accessible
- [ ] SSL enabled
- [ ] Tables created with correct schema
- [ ] Indexes created
- [ ] Triggers working

### Cloudinary
- [ ] Credentials valid
- [ ] Test upload works
- [ ] Folder `setu/student_ids` accessible
- [ ] File size limits configured (5MB)

### Email Service
- [ ] Email credentials valid
- [ ] Test email sends successfully
- [ ] Email formatting looks good
- [ ] OTP is readable
- [ ] Links and branding correct

### Security
- [ ] Passwords hashed with bcrypt
- [ ] OTPs stored as hash
- [ ] JWT secret is strong and secret
- [ ] No credentials in code
- [ ] `.env` in `.gitignore`
- [ ] Rate limiting works

### API Endpoints
- [ ] `POST /api/auth/student/send-otp` - Works
- [ ] `POST /api/auth/student/verify-otp` - Works
- [ ] `POST /api/auth/student/signup` - Works
- [ ] `POST /api/auth/student/login` - Works
- [ ] All error cases handled

---

## 🔍 Monitoring After Deployment

### Things to Monitor:

1. **Email Delivery Rate**
   - Check if OTPs are being delivered
   - Monitor spam rate
   - Track failed sends

2. **OTP Verification Rate**
   - How many users verify vs abandon
   - Common errors users face

3. **Signup Success Rate**
   - How many users complete signup
   - Common validation errors

4. **File Upload Success**
   - Cloudinary upload errors
   - File type/size issues

5. **Database Performance**
   - Query speeds
   - Index usage
   - Connection pool status

---

## 🐛 Common Deployment Issues

### Issue: Module 'nodemailer' not found

**Solution:**
```bash
cd server
npm install nodemailer
```

### Issue: Email sending fails in production

**Check:**
- Environment variables set correctly on platform
- Email service allows connections from server IP
- Port 587 not blocked by firewall
- Use SendGrid instead of Gmail for production

### Issue: Cloudinary upload fails

**Check:**
- Environment variables correct
- Cloudinary account not over quota
- Network connectivity to Cloudinary

### Issue: Database connection fails

**Check:**
- Neon IP whitelist updated
- SSL enabled (`DB_SSL=true`)
- Database credentials correct
- Connection string format

---

## 📞 Support Resources

### Documentation
- Nodemailer: https://nodemailer.com/
- SendGrid: https://docs.sendgrid.com/
- Cloudinary: https://cloudinary.com/documentation
- Neon: https://neon.tech/docs

### Testing Tools
- Postman: API testing
- MailHog: Local email testing
- Mailtrap: Email testing sandbox

---

## 🎉 Ready to Deploy!

Once all checkboxes are verified:

1. **Commit changes:**
```bash
git add .
git commit -m "Add student signup with OTP verification"
git push
```

2. **Deploy backend**

3. **Update frontend** to use new endpoints

4. **Test in production** with real email

5. **Monitor logs** for any issues

---

**Good luck with your deployment! 🚀**
