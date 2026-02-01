# ⚡ Donations System - Quick Reference

## 🔑 Environment Variables You Need

### Server (.env in /server folder)
```env
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5173
```

### Client (.env in /client folder)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Stripe Test Card

```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any)
```

---

## 🚀 Start Development

```powershell
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client  
npm run dev
```

---

## 🔗 Key URLs

- **Frontend:** http://localhost:5173/donations
- **Backend API:** http://localhost:5000/api/donations
- **Stripe Dashboard:** https://dashboard.stripe.com/test/payments

---

## ✅ Feature Checklist

- [x] Database table created automatically
- [x] Stripe payment integration
- [x] Alumni-only access control
- [x] Real donation analytics
- [x] Recent donations list
- [x] Success/cancel messages
- [x] Webhook support
- [x] Loading states

---

## 📊 Data Flow

```
1. Alumni enters amount → Click "DONATE NOW"
2. Frontend calls: POST /api/donations/create-checkout-session
3. Backend creates Stripe session → Returns checkout URL
4. User redirected to Stripe Checkout
5. User pays with test card
6. Stripe redirects back → Shows success message
7. Stripe sends webhook → POST /api/donations/webhook
8. Backend updates donation status to "success"
9. Analytics & recent donations update automatically
```

---

## 🎯 What Each File Does

| File | Purpose |
|------|---------|
| `initDonationsDatabase.js` | Creates database table |
| `donationModel.js` | Database queries |
| `donationController.js` | Stripe API + business logic |
| `donationRoutes.js` | API endpoints |
| `donationService.js` | Frontend API calls |
| `Donations.jsx` | UI component |

---

## 🐛 Quick Fixes

**Problem:** Can't create checkout session  
**Fix:** Add `STRIPE_SECRET_KEY` to server/.env

**Problem:** Page shows "Only Alumni can access"  
**Fix:** Login with alumni account (role must be "alumni")

**Problem:** Webhook errors  
**Fix:** Run: `stripe listen --forward-to localhost:5000/api/donations/webhook`

**Problem:** Donations not showing  
**Fix:** Check `VITE_API_URL` in client/.env

---

## 📝 Testing Steps

1. ✅ Login as alumni user
2. ✅ Go to /donations
3. ✅ Enter amount: 1000
4. ✅ Click "DONATE NOW"
5. ✅ Use test card: 4242 4242 4242 4242
6. ✅ Complete payment
7. ✅ Verify success message
8. ✅ Check donation in "Recent Donations"
9. ✅ Verify analytics updated

---

## 🔐 Security Features

- ✅ Alumni-only access (redirects non-alumni)
- ✅ JWT authentication
- ✅ Webhook signature verification
- ✅ CORS protection
- ✅ Environment variables for secrets
- ✅ SQL injection prevention

---

**Ready to test! 🎉**
