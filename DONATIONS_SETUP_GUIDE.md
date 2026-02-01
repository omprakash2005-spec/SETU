# 🎉 Donations System Setup Complete!

This document provides a comprehensive guide to set up and configure the Stripe donations system for the SETU Alumni Network.

---

## 📋 What Has Been Implemented

### ✅ Backend (Server)

1. **Database Schema** ([initDonationsDatabase.js](server/config/initDonationsDatabase.js))
   - Created `donations` table with all required fields
   - Added indexes for performance optimization
   - Automatic initialization on server startup

2. **Donation Model** ([donationModel.js](server/models/donationModel.js))
   - `createDonation()` - Create new donation record
   - `updateDonationStatus()` - Update payment status
   - `getRecentDonations()` - Fetch latest donations
   - `getTotalDonations()` - Get overall statistics
   - `getAlumniDonationTotal()` - Get alumni-specific stats

3. **Stripe Controller** ([donationController.js](server/controllers/donationController.js))
   - `/create-checkout-session` - Create Stripe payment session
   - `/webhook` - Handle Stripe payment confirmations (with signature verification)
   - `/verify/:sessionId` - Verify payment status
   - `/recent` - Get recent donations
   - `/analytics` - Get donation analytics
   - `/alumni/:alumniUid` - Get alumni donation history

4. **API Routes** ([donationRoutes.js](server/routes/donationRoutes.js))
   - All endpoints properly configured
   - Webhook endpoint accepts raw body (required by Stripe)
   - Protected routes require authentication

5. **Server Configuration** ([server.js](server/server.js))
   - Donation routes registered
   - Database initialization added
   - Webhook raw body parser configured

---

### ✅ Frontend (Client)

1. **Donation Service** ([donationService.js](client/src/services/donationService.js))
   - `createCheckoutSession()` - Initiate Stripe checkout
   - `verifyPayment()` - Verify payment completion
   - `getRecentDonations()` - Fetch recent donations
   - `getDonationAnalytics()` - Get analytics data

2. **Donations Page** ([Donations.jsx](client/src/pages/Donations.jsx))
   - **Alumni-Only Access** - Automatically redirects non-alumni users
   - **Custom Amount Input** - Alumni can enter any amount
   - **Stripe Integration** - Redirects to Stripe Checkout
   - **Real-Time Analytics** - Donut chart with actual data
   - **Recent Donations List** - Shows latest 5 donations
   - **Success/Cancel Messages** - User feedback after payment
   - **Loading States** - Proper UX during data fetch

---

## 🔧 Setup Instructions

### Step 1: Install Required Packages

#### Server Dependencies
```powershell
cd server
npm install stripe
```

#### Client Dependencies
```powershell
cd client
npm install @stripe/stripe-js
```

---

### Step 2: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Navigate to **Developers** → **API Keys**
4. Copy your keys:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

---

### Step 3: Configure Environment Variables

#### Server `.env` (c:\Users\DELL\Desktop\SETU\server\.env)

Add these lines to your existing `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Client URL
CLIENT_URL=http://localhost:5173
```

#### Client `.env` (c:\Users\DELL\Desktop\SETU\client\.env)

Create or update:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY
```

---

### Step 4: Set Up Stripe Webhook (For Production)

**For Development (Testing):**
You can test without webhooks initially. Donations will be marked as "pending" until webhook confirms them.

**For Production:**

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. Login to Stripe CLI:
```powershell
stripe login
```

3. Forward webhooks to local server:
```powershell
stripe listen --forward-to localhost:5000/api/donations/webhook
```

4. Copy the webhook signing secret (starts with `whsec_...`)

5. Add it to `server/.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**For Production Deployment:**
- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://yourdomain.com/api/donations/webhook`
- Select events: `checkout.session.completed`, `checkout.session.async_payment_failed`, `checkout.session.expired`
- Copy the signing secret to your production environment variables

---

### Step 5: Initialize Database

The donations table will be automatically created when you start the server.

```powershell
cd server
npm run dev
```

You should see:
```
🔧 Initializing donations database...
✅ Donations database initialized successfully
```

---

### Step 6: Test the System

1. **Start Server:**
```powershell
cd server
npm run dev
```

2. **Start Client:**
```powershell
cd client
npm run dev
```

3. **Login as Alumni** (make sure your test user has `role: "alumni"`)

4. **Navigate to Donations Page:**
   - Go to `/donations`
   - Enter a donation amount (e.g., 100)
   - Click "DONATE NOW"
   - You'll be redirected to Stripe Checkout (test mode)

5. **Test Payment:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

6. **Verify Success:**
   - After payment, you'll be redirected back
   - Success message appears
   - Donation appears in "Recent Donations"
   - Analytics update automatically

---

## 🛡️ Security Features Implemented

✅ **Alumni-Only Access** - Non-alumni users are automatically redirected  
✅ **Webhook Signature Verification** - Prevents fake payment notifications  
✅ **Protected API Routes** - Requires authentication  
✅ **Environment Variables** - Secret keys never exposed to frontend  
✅ **SQL Injection Protection** - Parameterized queries  
✅ **CORS Configuration** - Only allowed origins can access API  

---

## 📊 Database Schema

```sql
CREATE TABLE donations (
  donation_id SERIAL PRIMARY KEY,
  alumni_uid VARCHAR(255) NOT NULL,
  alumni_name VARCHAR(255),
  alumni_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'success', 'failed'
  stripe_payment_intent_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/donations/create-checkout-session` | Create Stripe checkout | ✅ Yes |
| POST | `/api/donations/webhook` | Stripe webhook handler | ❌ No (Stripe signature) |
| GET | `/api/donations/verify/:sessionId` | Verify payment status | ✅ Yes |
| GET | `/api/donations/recent?limit=10` | Get recent donations | ❌ No |
| GET | `/api/donations/analytics?alumniUid=xxx` | Get donation analytics | ❌ No |
| GET | `/api/donations/alumni/:alumniUid` | Get alumni donation history | ✅ Yes |

---

## 🧪 Testing Checklist

- [ ] Database table created successfully
- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Environment variables configured
- [ ] Alumni user can access /donations
- [ ] Student user is redirected from /donations
- [ ] Donation amount input works
- [ ] Stripe checkout session created
- [ ] Redirected to Stripe Checkout page
- [ ] Test payment successful
- [ ] Redirected back to success page
- [ ] Success message displayed
- [ ] Donation appears in database
- [ ] Donation appears in "Recent Donations"
- [ ] Analytics chart updates
- [ ] Webhook receives payment confirmation
- [ ] Donation status updated to "success"

---

## 🐛 Troubleshooting

### Issue: "Failed to create checkout session"
**Solution:** Check that `STRIPE_SECRET_KEY` is set in `server/.env`

### Issue: "Webhook signature verification failed"
**Solution:** Make sure `STRIPE_WEBHOOK_SECRET` is correct and Stripe CLI is running

### Issue: "Only Alumni can access"
**Solution:** Ensure your user has `role: "alumni"` in the database/UserContext

### Issue: Donations not appearing
**Solution:** Check browser console for API errors. Verify API_URL in `client/.env`

### Issue: Payment successful but status still "pending"
**Solution:** Webhook not configured. Set up Stripe CLI or webhook endpoint

---

## 🚀 Production Deployment

Before deploying to production:

1. **Update Environment Variables:**
   - Replace test keys with live Stripe keys
   - Update `CLIENT_URL` to production domain
   - Update `VITE_API_URL` to production API URL

2. **Set Up Production Webhook:**
   - Add webhook endpoint in Stripe Dashboard
   - Update `STRIPE_WEBHOOK_SECRET` with production secret

3. **Database:**
   - Ensure production database is configured
   - Run database initialization

4. **Security:**
   - Enable HTTPS for webhook endpoint
   - Update CORS origins to production domains
   - Review and update JWT_SECRET

---

## 📞 Support

If you encounter any issues:
1. Check the console for errors
2. Verify all environment variables are set
3. Check Stripe Dashboard for payment events
4. Review server logs for detailed error messages

---

**Implementation Complete! 🎉**

Your Donations page is now fully functional with Stripe integration, real-time analytics, and alumni-only access control.
