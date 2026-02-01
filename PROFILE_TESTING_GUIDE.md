# Profile Backend Testing Guide

## Quick Test Steps

### 1. Login to Your Application
- Navigate to your login page
- Login with your credentials
- You should be redirected to the dashboard/home page

### 2. Navigate to Profile Page
- Click on the Profile link in the navigation
- The page should load with a "Loading profile..." message briefly
- Then your profile data should appear

### 3. Test Profile Data Loading
**Expected Behavior:**
- If you're a new user (never filled profile before):
  - Name field shows your login name
  - All other fields are empty with placeholder text
  - Experience, Skills, Education, Projects show "No [field] added yet"
  
- If you've filled profile before:
  - All previously saved data should appear
  - Profile picture should show if uploaded

### 4. Test Profile Picture Upload
1. Hover over the profile picture
   - A camera icon should appear with a dark overlay
2. Click on the profile picture
   - File picker should open
3. Select an image file (JPEG, PNG, GIF, or WebP)
   - Image should upload
   - "Profile picture updated successfully!" alert should appear
   - New image should display immediately
4. Refresh the page
   - New profile picture should still be there (persisted)

### 5. Test Top Section Editing (Name, Pronouns, Degree, Bio)
1. Click "Edit Profile" button
2. Edit any of the fields:
   - Name
   - Pronouns (dropdown)
   - Degree
   - Bio
3. Click "Save"
   - Changes should save
   - Edit mode should close
   - New values should display
4. Refresh the page
   - Changes should still be there (persisted)

### 6. Test List Fields (Experience, Skills, Education, Projects)
1. Click "Edit" on any card (e.g., Experience)
2. Modal should open
3. Add new entries:
   - Click "Add New" button
   - Type in the textarea
   - Add multiple entries
4. Remove entries:
   - Click the trash icon on any entry
5. Click "Save"
   - Modal should close
   - New entries should display in the card
6. Refresh the page
   - Changes should still be there (persisted)

### 7. Test Empty State
1. If you have data, clear it:
   - Edit each section
   - Remove all entries
   - Save
2. Cards should show:
   - "No experience added yet"
   - "No skills added yet"
   - etc.

### 8. Test New User Flow
To test as a completely new user:
1. Register a new account
2. Login with the new account
3. Navigate to Profile
4. All fields should be empty
5. Fill in all fields from scratch
6. Save each section
7. Refresh page
8. All data should persist

## Common Issues & Solutions

### Issue: Profile data not loading
**Solution:**
- Check browser console for errors
- Verify you're logged in (token in localStorage)
- Check server terminal for backend errors
- Verify database connection

### Issue: Profile picture upload fails
**Solution:**
- Check file size (must be < 5MB)
- Check file type (must be JPEG, PNG, GIF, or WebP)
- Verify Cloudinary credentials in server/.env
- Check server terminal for upload errors

### Issue: Changes not persisting after refresh
**Solution:**
- Check browser console for API errors
- Verify server is running
- Check database connection
- Look for errors in server terminal

### Issue: "No fields to update" error
**Solution:**
- Make sure you're actually changing values
- Check that fields are not undefined
- Verify request payload in Network tab

## API Testing with Browser DevTools

### Check Network Requests
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Perform actions (edit profile, upload picture, etc.)
4. Look for these requests:
   - `GET /api/auth/profile` - Should return 200 with user data
   - `PUT /api/auth/profile` - Should return 200 with updated data
   - `POST /api/auth/profile/upload-picture` - Should return 200 with image URL

### Check Request/Response
For each request:
- **Request Headers**: Should include `Authorization: Bearer <token>`
- **Request Body**: Should contain the fields you're updating
- **Response**: Should have `success: true` and updated user data

### Check Console Logs
- No errors should appear in console
- If errors appear, they should be helpful (not cryptic)

## Database Verification (Optional)

If you want to verify data is actually in the database:

```sql
-- Connect to your PostgreSQL database
-- Run this query to see your profile data

SELECT 
  id,
  name,
  pronouns,
  degree,
  bio,
  profile_image,
  experience,
  skills,
  education,
  projects
FROM users
WHERE email = 'your-email@example.com';
```

## Success Criteria

✅ Profile loads data from backend on mount
✅ Logged-in user's name displays correctly
✅ All fields can be edited and saved
✅ Profile picture can be uploaded and displays
✅ Changes persist after page refresh
✅ New users see empty fields with placeholders
✅ Array fields (experience, skills, etc.) can be managed
✅ No errors in browser console
✅ No errors in server terminal
✅ Other pages remain unchanged

## Next Steps After Testing

If everything works:
1. Test with different user accounts
2. Test edge cases (very long text, special characters, etc.)
3. Test on different browsers
4. Consider adding more profile fields if needed

If something doesn't work:
1. Check the error messages
2. Review the implementation summary
3. Check server logs
4. Verify database schema
5. Test API endpoints individually
