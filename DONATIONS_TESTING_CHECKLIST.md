# 🧪 Donations System - Complete Testing Checklist

## Pre-Testing Setup ✅

### Step 1: Environment Variables
- [ ] Server `.env` has `STRIPE_SECRET_KEY`
- [ ] Server `.env` has `STRIPE_WEBHOOK_SECRET` (optional for basic testing)
- [ ] Server `.env` has `CLIENT_URL=http://localhost:5173`
- [ ] Client `.env` has `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Client `.env` has `VITE_API_URL=http://localhost:5000/api`

### Step 2: Dependencies Installed
- [ ] Server: `npm install stripe` ✅ (Already done)
- [ ] Client: `npm install @stripe/stripe-js` ✅ (Already done)

### Step 3: Database Ready
- [ ] PostgreSQL running
- [ ] Database credentials in server `.env`
- [ ] Server can connect to database

### Step 4: Servers Running
- [ ] Backend running: `cd server && npm run dev`
- [ ] Frontend running: `cd client && npm run dev`
- [ ] No console errors on startup

---

## 🔐 Access Control Testing

### Test 1: Unauthenticated User
**Steps:**
1. Logout (if logged in)
2. Try to access `/donations`

**Expected Result:**
- [ ] Redirected to `/login`
- [ ] Cannot access donations page

### Test 2: Student User Access
**Steps:**
1. Login as student user (role: "student")
2. Navigate to `/donations`

**Expected Result:**
- [ ] Alert message: "Only Alumni can access the Donations page."
- [ ] Redirected to `/dashboard`
- [ ] Cannot make donations

### Test 3: Alumni User Access ✅
**Steps:**
1. Login as alumni user (role: "alumni")
2. Navigate to `/donations`

**Expected Result:**
- [ ] Page loads successfully
- [ ] Can see donation form
- [ ] Can see analytics section
- [ ] Can see recent donations section

---

## 💳 Payment Flow Testing

### Test 4: Donation Amount Validation
**Steps:**
1. Login as alumni
2. Go to `/donations`
3. Try to donate without entering amount
4. Click "DONATE NOW"

**Expected Result:**
- [ ] Alert: "Please enter a valid donation amount (minimum ₹1)"
- [ ] Payment does not proceed

### Test 5: Successful Donation
**Steps:**
1. Login as alumni
2. Enter amount: `1000`
3. Click "DONATE NOW"
4. Wait for Stripe redirect
5. On Stripe page, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
6. Complete payment

**Expected Result:**
- [ ] Loading state shows "Processing..."
- [ ] Redirected to Stripe Checkout
- [ ] Stripe checkout page shows ₹1000 donation
- [ ] After payment, redirected back to `/donations`
- [ ] Success message appears (green with checkmark)
- [ ] Success message auto-dismisses after 5 seconds

### Test 6: Cancelled Donation
**Steps:**
1. Login as alumni
2. Enter amount: `500`
3. Click "DONATE NOW"
4. On Stripe page, click "Back" or close window

**Expected Result:**
- [ ] Redirected back to `/donations?cancelled=true`
- [ ] Yellow cancel message appears
- [ ] Message: "Donation cancelled. You can try again anytime."
- [ ] No donation record created

### Test 7: Declined Payment
**Steps:**
1. Login as alumni
2. Enter amount: `100`
3. Click "DONATE NOW"
4. On Stripe page, use declined card: `4000 0000 0000 0002`

**Expected Result:**
- [ ] Payment declined by Stripe
- [ ] Error message shown
- [ ] Donation status remains "failed" (not "success")

---

## 📊 Analytics Testing

### Test 8: Empty State
**Steps:**
1. Fresh database (no donations)
2. Login as alumni
3. Go to `/donations`

**Expected Result:**
- [ ] Chart shows ₹0 for both "Net amount" and "Donated by you"
- [ ] Recent donations shows: "No donations yet. Be the first to donate!"

### Test 9: Analytics After Donation
**Steps:**
1. Make a successful donation (Test 5)
2. Refresh page or wait for auto-update

**Expected Result:**
- [ ] "Net amount donated" increases by donation amount
- [ ] "Donated by you" increases by donation amount
- [ ] Chart updates to show purple slice
- [ ] Numbers formatted correctly (₹1,000 format)

### Test 10: Recent Donations List
**Steps:**
1. Make multiple donations (3-5)
2. Check "Recent Donations" section

**Expected Result:**
- [ ] Latest donations appear at top
- [ ] Shows donor name (or "Anonymous")
- [ ] Shows amount with ₹ symbol
- [ ] Shows date in readable format
- [ ] Maximum 5 donations shown
- [ ] Sorted by newest first

---

## 🔗 API Endpoint Testing

### Test 11: Create Checkout Session (Protected)
**Request:**
```bash
POST http://localhost:5000/api/donations/create-checkout-session
Headers: { Authorization: "Bearer YOUR_JWT_TOKEN" }
Body: { 
  "amount": 1000,
  "alumniUid": "test-alumni-123",
  "alumniName": "Test Alumni",
  "alumniEmail": "test@alumni.com"
}
```

**Expected Result:**
- [ ] Returns `sessionId` and `url`
- [ ] Status 200
- [ ] Pending donation created in database

### Test 12: Get Recent Donations (Public)
**Request:**
```bash
GET http://localhost:5000/api/donations/recent?limit=5
```

**Expected Result:**
- [ ] Returns array of donations
- [ ] Status 200
- [ ] Only shows successful donations
- [ ] Limited to 5 items

### Test 13: Get Analytics (Public)
**Request:**
```bash
GET http://localhost:5000/api/donations/analytics?alumniUid=test-alumni-123
```

**Expected Result:**
- [ ] Returns `totalDonations` and `alumniDonations`
- [ ] Status 200
- [ ] Numbers are correct

---

## 🪝 Webhook Testing (Optional but Recommended)

### Test 14: Webhook Integration
**Steps:**
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Run: `stripe listen --forward-to localhost:5000/api/donations/webhook`
4. Copy webhook secret to server `.env`
5. Make a test donation

**Expected Result:**
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Donation status updated to "success"
- [ ] No signature verification errors
- [ ] Console logs show "✅ Donation confirmed"

---

## 🎨 UI/UX Testing

### Test 15: Loading States
**Steps:**
1. Slow network simulation (if possible)
2. Click "DONATE NOW"

**Expected Result:**
- [ ] Button text changes to "Processing..."
- [ ] Button is disabled during processing
- [ ] Spinner shows while fetching data

### Test 16: Responsive Design
**Steps:**
1. Test on different screen sizes
2. Check mobile, tablet, desktop views

**Expected Result:**
- [ ] Grid layout adjusts properly
- [ ] Chart remains readable
- [ ] Donation form is accessible
- [ ] Recent donations list is readable

### Test 17: Data Formatting
**Steps:**
1. Check all displayed amounts and dates

**Expected Result:**
- [ ] Amounts show ₹ symbol
- [ ] Large numbers formatted with commas (₹1,00,000)
- [ ] Dates in format: "Jan 26, 2026"
- [ ] No NaN or undefined values

---

## 🗄️ Database Testing

### Test 18: Database Structure
**Query:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donations';
```

**Expected Result:**
- [ ] Table `donations` exists
- [ ] All columns present (donation_id, alumni_uid, amount, etc.)
- [ ] Proper data types (SERIAL, VARCHAR, DECIMAL, TIMESTAMP)
- [ ] Indexes created (check with `\d donations`)

### Test 19: Data Integrity
**Steps:**
1. Make a donation
2. Check database record

**Expected Result:**
- [ ] Record inserted with correct data
- [ ] `alumni_uid` matches logged-in user
- [ ] `amount` is correct
- [ ] `currency` is 'INR'
- [ ] `status` starts as 'pending'
- [ ] `stripe_session_id` is populated
- [ ] `created_at` timestamp is correct

### Test 20: Foreign Key Constraint
**Steps:**
1. Try to insert donation with non-existent `alumni_uid`

**Expected Result:**
- [ ] Foreign key constraint prevents insertion
- [ ] Error message about constraint violation

---

## 🔒 Security Testing

### Test 21: Unauthorized API Access
**Request:**
```bash
POST http://localhost:5000/api/donations/create-checkout-session
# (without Authorization header)
```

**Expected Result:**
- [ ] Status 401 Unauthorized
- [ ] Error: "Access denied. No token provided."

### Test 22: CORS Protection
**Steps:**
1. Try to call API from unauthorized origin
2. Check browser console

**Expected Result:**
- [ ] CORS error if origin not in allowlist
- [ ] Allowed origins: localhost:5173, localhost:5174

### Test 23: Webhook Signature Verification
**Request:**
```bash
POST http://localhost:5000/api/donations/webhook
# (with invalid signature)
```

**Expected Result:**
- [ ] Status 400
- [ ] Error: "Webhook signature verification failed"

---

## 🐛 Error Handling Testing

### Test 24: Network Error Handling
**Steps:**
1. Stop backend server
2. Try to make a donation from frontend

**Expected Result:**
- [ ] Error alert shown to user
- [ ] Message: "Failed to initiate payment. Please try again."
- [ ] No crash or blank screen

### Test 25: Invalid Amount Handling
**Steps:**
1. Enter negative amount: `-100`
2. Enter zero: `0`
3. Enter non-numeric: `abc`

**Expected Result:**
- [ ] Validation prevents submission
- [ ] Appropriate error message
- [ ] No API call made

---

## ✅ Final Integration Test

### Test 26: Complete User Journey
**Steps:**
1. Logout completely
2. Login as alumni user
3. Navigate to `/donations`
4. Verify analytics show current totals
5. Enter amount: `2500`
6. Click "DONATE NOW"
7. Complete Stripe payment with test card
8. Verify success message
9. Verify donation in recent donations list
10. Verify analytics updated
11. Refresh page
12. Verify data persists

**Expected Result:**
- [ ] All steps complete without errors
- [ ] Data persists across page refresh
- [ ] No console errors
- [ ] Professional user experience

---

## 📝 Testing Summary

**Total Tests:** 26  
**Tests Passed:** _____ / 26  
**Critical Issues:** _____  
**Minor Issues:** _____  

### Issues Found:
1. 
2. 
3. 

### Notes:
- 
- 
- 

---

**Testing completed by:** _____________  
**Date:** _____________  
**Status:** ⬜ All Pass ⬜ Some Failures ⬜ Major Issues  

---

## 🚀 Next Steps After Testing

- [ ] Fix any critical issues
- [ ] Set up production Stripe account
- [ ] Configure production webhooks
- [ ] Add production environment variables
- [ ] Deploy to production
- [ ] Test in production environment

**Your donations system is ready for launch! 🎉**
