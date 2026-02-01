#!/bin/bash

# SETU Student Signup - Quick Test Script
# Tests the complete signup flow

echo "🧪 SETU Student Signup API Test"
echo "================================"
echo ""

# Configuration
BASE_URL="http://localhost:5000"
TEST_EMAIL="test.student@college.edu"

echo "📧 Test Email: $TEST_EMAIL"
echo "🔗 Base URL: $BASE_URL"
echo ""

# Test 1: Send OTP
echo "📤 Step 1: Sending OTP..."
SEND_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/student/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "Response: $SEND_OTP_RESPONSE"
echo ""

if echo "$SEND_OTP_RESPONSE" | grep -q '"success":true'; then
  echo "✅ OTP sent successfully!"
  echo "📬 Check your email for the OTP"
else
  echo "❌ Failed to send OTP"
  exit 1
fi

echo ""
echo "Please enter the OTP you received in your email:"
read -r OTP

# Test 2: Verify OTP
echo ""
echo "🔍 Step 2: Verifying OTP..."
VERIFY_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/student/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$OTP\"}")

echo "Response: $VERIFY_OTP_RESPONSE"
echo ""

if echo "$VERIFY_OTP_RESPONSE" | grep -q '"success":true'; then
  echo "✅ OTP verified successfully!"
else
  echo "❌ OTP verification failed"
  exit 1
fi

# Test 3: Signup
echo ""
echo "👤 Step 3: Creating student account..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/student/signup" \
  -F "full_name=Test Student" \
  -F "email=$TEST_EMAIL" \
  -F "password=testpass123" \
  -F "roll_number=TEST$(date +%s)" \
  -F "department=Computer Science" \
  -F "graduation_year=2025")

echo "Response: $SIGNUP_RESPONSE"
echo ""

if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Student account created successfully!"
  
  # Extract token (basic parsing)
  TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "🔑 JWT Token: ${TOKEN:0:50}..."
else
  echo "❌ Signup failed"
  exit 1
fi

# Test 4: Login
echo ""
echo "🔐 Step 4: Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/student/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"testpass123\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Login successful!"
else
  echo "❌ Login failed"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All tests passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ OTP email sending: WORKING"
echo "✅ OTP verification: WORKING"
echo "✅ Student signup: WORKING"
echo "✅ Student login: WORKING"
echo ""
echo "Student signup backend is ready! 🚀"
