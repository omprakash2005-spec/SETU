# SETU Student Signup - Quick Test Script (PowerShell)
# Tests the complete signup flow

Write-Host "🧪 SETU Student Signup API Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BaseURL = "http://localhost:5000"
$TestEmail = "test.student@college.edu"

Write-Host "📧 Test Email: $TestEmail" -ForegroundColor Yellow
Write-Host "🔗 Base URL: $BaseURL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Send OTP
Write-Host "📤 Step 1: Sending OTP..." -ForegroundColor Green
$sendOTPBody = @{
    email = $TestEmail
} | ConvertTo-Json

try {
    $sendOTPResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/student/send-otp" `
        -Method Post `
        -ContentType "application/json" `
        -Body $sendOTPBody
    
    Write-Host "Response:" ($sendOTPResponse | ConvertTo-Json) -ForegroundColor White
    
    if ($sendOTPResponse.success) {
        Write-Host "✅ OTP sent successfully!" -ForegroundColor Green
        Write-Host "📬 Check your email for the OTP" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to send OTP" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error sending OTP: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
$OTP = Read-Host "Please enter the OTP you received in your email"

# Test 2: Verify OTP
Write-Host ""
Write-Host "🔍 Step 2: Verifying OTP..." -ForegroundColor Green
$verifyOTPBody = @{
    email = $TestEmail
    otp = $OTP
} | ConvertTo-Json

try {
    $verifyOTPResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/student/verify-otp" `
        -Method Post `
        -ContentType "application/json" `
        -Body $verifyOTPBody
    
    Write-Host "Response:" ($verifyOTPResponse | ConvertTo-Json) -ForegroundColor White
    
    if ($verifyOTPResponse.success) {
        Write-Host "✅ OTP verified successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ OTP verification failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error verifying OTP: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Signup
Write-Host ""
Write-Host "👤 Step 3: Creating student account..." -ForegroundColor Green

$rollNumber = "TEST$(Get-Date -Format 'yyyyMMddHHmmss')"
$signupForm = @{
    full_name = "Test Student"
    email = $TestEmail
    password = "testpass123"
    roll_number = $rollNumber
    department = "Computer Science"
    graduation_year = "2025"
}

try {
    $signupResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/student/signup" `
        -Method Post `
        -Form $signupForm
    
    Write-Host "Response:" ($signupResponse | ConvertTo-Json) -ForegroundColor White
    
    if ($signupResponse.success) {
        Write-Host "✅ Student account created successfully!" -ForegroundColor Green
        $token = $signupResponse.data.token
        Write-Host "🔑 JWT Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Signup failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during signup: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Login
Write-Host ""
Write-Host "🔐 Step 4: Testing login..." -ForegroundColor Green
$loginBody = @{
    email = $TestEmail
    password = "testpass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/student/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    Write-Host "Response:" ($loginResponse | ConvertTo-Json) -ForegroundColor White
    
    if ($loginResponse.success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during login: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 All tests passed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ OTP email sending: WORKING" -ForegroundColor Green
Write-Host "✅ OTP verification: WORKING" -ForegroundColor Green
Write-Host "✅ Student signup: WORKING" -ForegroundColor Green
Write-Host "✅ Student login: WORKING" -ForegroundColor Green
Write-Host ""
Write-Host "Student signup backend is ready! 🚀" -ForegroundColor Cyan
