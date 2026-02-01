# Profile Update Debugging Guide

## Quick Debug Steps

### 1. Check Browser Console
1. Open your browser DevTools (F12)
2. Go to the **Console** tab
3. Try to update your profile
4. Look for error messages

**Common errors to look for:**
- `401 Unauthorized` - Token issue
- `500 Internal Server Error` - Backend issue
- Network errors - Connection issue

### 2. Check Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to update your profile
4. Look for the `PUT /api/auth/profile` request
5. Click on it and check:
   - **Request Headers**: Should have `Authorization: Bearer <token>`
   - **Request Payload**: Should show the data you're trying to update
   - **Response**: Should show the error message

### 3. Check Server Terminal
The server terminal should now show detailed error messages with:
- ❌ Profile update error: [error details]
- Error details: { message, stack, userId }

**Look for these common issues:**

#### Issue: "column does not exist"
**Cause**: Database migration didn't run properly
**Solution**:
```bash
cd server
node config/updateProfileSchema.js
```

#### Issue: "invalid input syntax for type"
**Cause**: Data type mismatch (e.g., sending object instead of array)
**Solution**: Check the request payload format

#### Issue: "null value in column violates not-null constraint"
**Cause**: Trying to set a required field to null
**Solution**: Ensure required fields have values

### 4. Test with Simple Update First

Try updating just ONE field at a time to isolate the issue:

**Test 1: Update name only**
```javascript
// In Profile.jsx, try this in console:
authAPI.updateProfile({ name: "Test Name" })
  .then(res => console.log("Success:", res))
  .catch(err => console.error("Error:", err));
```

**Test 2: Update bio only**
```javascript
authAPI.updateProfile({ bio: "Test bio" })
  .then(res => console.log("Success:", res))
  .catch(err => console.error("Error:", err));
```

**Test 3: Update array field**
```javascript
authAPI.updateProfile({ skills: ["JavaScript", "React"] })
  .then(res => console.log("Success:", res))
  .catch(err => console.error("Error:", err));
```

### 5. Verify Database Schema

Check if the new columns exist:

```sql
-- Connect to your PostgreSQL database
\d users

-- Or run this query:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('pronouns', 'degree', 'experience', 'education', 'projects');
```

Expected output:
- pronouns | character varying
- degree | text
- experience | ARRAY
- education | ARRAY
- projects | ARRAY

### 6. Check Authentication

Verify your token is valid:

```javascript
// In browser console:
console.log("Token:", localStorage.getItem("token"));
console.log("User:", JSON.parse(localStorage.getItem("user") || "{}"));
```

If token is missing or user is null:
1. Logout
2. Login again
3. Try updating profile

### 7. Common Fixes

#### Fix 1: Re-run Database Migration
```bash
cd server
node config/updateProfileSchema.js
```

#### Fix 2: Clear Browser Cache
1. Clear localStorage
2. Logout and login again
3. Try updating profile

#### Fix 3: Restart Server
```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

#### Fix 4: Check Environment Variables
Make sure your `.env` file in the server folder has:
```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Specific Error Messages & Solutions

### "Profile update failed"
**Check**: Browser console and server terminal for specific error

### "No fields to update"
**Cause**: All fields are undefined
**Solution**: Make sure you're sending at least one field in the request

### "User not found"
**Cause**: Invalid user ID in token
**Solution**: Logout and login again

### "Access denied. No token provided"
**Cause**: Token not being sent
**Solution**: Check if token exists in localStorage

### "Invalid or expired token"
**Cause**: Token expired or invalid
**Solution**: Logout and login again

## Step-by-Step Debugging Process

1. **Open Browser Console** (F12)
2. **Open Network Tab** (F12 → Network)
3. **Open Server Terminal** (where `npm run dev` is running)
4. **Try to update profile**
5. **Check all three places for errors**:
   - Browser Console: JavaScript errors
   - Network Tab: HTTP errors and request/response
   - Server Terminal: Backend errors

## What to Share if Still Failing

If the issue persists, please share:

1. **Browser Console Error** (screenshot or copy-paste)
2. **Network Tab Response** (screenshot of the failed request)
3. **Server Terminal Error** (copy-paste the error message)
4. **What you're trying to update** (which field/section)

## Quick Test Script

Run this in your browser console to test the API directly:

```javascript
// Test 1: Get Profile
fetch('http://localhost:5000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Get Profile:', d))
.catch(e => console.error('Get Profile Error:', e));

// Test 2: Update Profile
fetch('http://localhost:5000/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ bio: 'Test bio update' })
})
.then(r => r.json())
.then(d => console.log('Update Profile:', d))
.catch(e => console.error('Update Profile Error:', e));
```

This will show you exactly what the API is returning.
