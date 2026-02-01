# ⚡ START HERE - Donations System Setup

## 🎯 3-Minute Quick Start

Follow these steps to get your donations system working **right now**:

---

## Step 1: Get Your Stripe Keys (2 minutes)

1. **Sign up for Stripe** (if you haven't already)  
   👉 Go to: https://stripe.com
   
2. **Get API Keys**  
   - After signup, go to: **Developers** → **API Keys**
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

3. **Copy both keys** - You'll need them in the next step

---

## Step 2: Configure Environment Variables (1 minute)

### Server Configuration

1. **Open:** `c:\Users\DELL\Desktop\SETU\server\.env`

2. **Add these lines** (replace with your actual Stripe keys):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_paste_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_skip_this_for_now
CLIENT_URL=http://localhost:5173
```

### Client Configuration

1. **Create:** `c:\Users\DELL\Desktop\SETU\client\.env`

2. **Add these lines** (replace with your Stripe publishable key):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_paste_your_publishable_key_here
VITE_API_URL=http://localhost:5000/api
```

---

## Step 3: Start Your Servers

### Terminal 1 - Backend
```powershell
cd C:\Users\DELL\Desktop\SETU\server
npm run dev
```

**Wait for:** ✅ "Donations database initialized successfully"

### Terminal 2 - Frontend
```powershell
cd C:\Users\DELL\Desktop\SETU\client
npm run dev
```

**Wait for:** Server running at http://localhost:5173

---

## Step 4: Test Donation Flow! 🎉

1. **Open browser:** http://localhost:5173

2. **Login** as an alumni user  
   ⚠️ Important: User must have `role: "alumni"`

3. **Navigate to:** `/donations`

4. **Enter amount:** `1000` (or any amount you want)

5. **Click:** "DONATE NOW"

6. **On Stripe page, use test card:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```

7. **Click:** "Pay"

8. **Success!** You should see:
   - ✅ Success message
   - ✅ Donation appears in "Recent Donations"
   - ✅ Analytics chart updates

---

## 🎊 That's It!

Your donations system is now fully operational!

---

## 🐛 Quick Troubleshooting

### Problem: "Only Alumni can access the Donations page"

**Solution:** Your user account must have `role: "alumni"`

Check your user data:
```javascript
// In browser console on frontend
console.log(localStorage.getItem('user'));
```

It should show: `"role": "alumni"`

---

### Problem: "Failed to create checkout session"

**Solution:** Check that you added `STRIPE_SECRET_KEY` to `server/.env`

---

### Problem: Donations not showing up

**Solution:** 
1. Check that backend is running (Terminal 1)
2. Open browser console (F12) and check for errors
3. Verify `VITE_API_URL=http://localhost:5000/api` in `client/.env`

---

## 📚 Complete Documentation

For detailed information, see:

- **Full Setup Guide:** [DONATIONS_SETUP_GUIDE.md](DONATIONS_SETUP_GUIDE.md)
- **Quick Reference:** [DONATIONS_QUICK_REFERENCE.md](DONATIONS_QUICK_REFERENCE.md)
- **Testing Checklist:** [DONATIONS_TESTING_CHECKLIST.md](DONATIONS_TESTING_CHECKLIST.md)
- **Complete README:** [DONATIONS_README.md](DONATIONS_README.md)

---

## 🎯 What You Just Built

✅ Complete Stripe payment integration  
✅ Database storage for donations  
✅ Real-time analytics dashboard  
✅ Recent donations list  
✅ Alumni-only access control  
✅ Professional UI with success/error messages  

---

## 🚀 Next Steps

1. ✅ Test with more donation amounts
2. ✅ Test cancel flow (click back on Stripe page)
3. ⏳ Set up webhooks for production (optional for testing)
4. ⏳ Deploy to production when ready

---

**Your donations system is ready! 🎉**

**Need help?** Check the troubleshooting section above or see [DONATIONS_README.md](DONATIONS_README.md)
