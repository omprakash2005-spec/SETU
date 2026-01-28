# 🚀 How to Run SETU Servers

This guide provides step-by-step instructions to run all three servers required for the SETU application.

---

## 📋 Prerequisites

Before running the servers, ensure you have:
- ✅ **Node.js** (v16 or higher)
- ✅ **Python** (v3.8 or higher)
- ✅ **npm** (comes with Node.js)
- ✅ **pip** (comes with Python)

---

## 🎯 Quick Start (All Servers)

You need to run **3 separate terminals** for the three servers:

### Terminal 1: Backend Server (Node.js)
### Terminal 2: Frontend Server (Vite)
### Terminal 3: AI Server (Flask)

---

## 📝 Step-by-Step Instructions

### 🔧 **Step 1: Backend Server (Port 5001)**

**Open Terminal 1:**

```powershell
# Navigate to the server directory
cd c:\Users\sarth\OneDrive\Desktop\SETU\server

# Install dependencies (only needed first time)
npm install

# Start the backend server
npm run dev
```

**Expected Output:**
```
Server running on port 5001
Database connected successfully
```

**Server URL:** `http://localhost:5001`

---

### 🎨 **Step 2: Frontend Server (Port 5173)**

**Open Terminal 2:**

```powershell
# Navigate to the client directory
cd c:\Users\sarth\OneDrive\Desktop\SETU\client

# Install dependencies (only needed first time)
npm install

# Start the frontend server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Server URL:** `http://localhost:5173`

---

### 🤖 **Step 3: AI Server (Port 8000)**

**Open Terminal 3:**

```powershell
# Navigate to the SETU directory
cd c:\Users\sarth\OneDrive\Desktop\SETU

# Install Python dependencies (only needed first time)
pip install flask flask-cors scikit-learn

# Start the AI server
python server\ai\mentor_model\mentor_api.py
```

**Expected Output:**
```
Mentor AI server starting...
 * Running on http://127.0.0.1:8000
Press CTRL+C to quit
```

**Server URL:** `http://127.0.0.1:8000`

---

## ✅ Verify All Servers Are Running

After starting all three servers, you should have:

| Server | Port | Status | URL |
|--------|------|--------|-----|
| Backend (Node.js) | 5001 | 🟢 Running | http://localhost:5001 |
| Frontend (Vite) | 5173 | 🟢 Running | http://localhost:5173 |
| AI Server (Flask) | 8000 | 🟢 Running | http://127.0.0.1:8000 |

---

## 🌐 Access the Application

Once all servers are running:

1. Open your browser
2. Go to: **http://localhost:5173**
3. You should see the SETU landing page

---

## 🛑 How to Stop Servers

To stop any server, go to its terminal and press:

```
CTRL + C
```

---

## 🔄 Restart Servers

If you need to restart a server:

1. Press `CTRL + C` to stop it
2. Run the start command again (e.g., `npm run dev` or `python server\ai\mentor_model\mentor_api.py`)

---

## 🐛 Troubleshooting

### ❌ Port Already in Use

**Error:** `Port 5001 is already in use`

**Solution:**
```powershell
# Find and kill the process using the port
netstat -ano | findstr :5001
taskkill /PID <PID_NUMBER> /F
```

### ❌ Module Not Found (Python)

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solution:**
```powershell
pip install flask flask-cors scikit-learn
```

### ❌ Module Not Found (Node.js)

**Error:** `Cannot find module 'express'`

**Solution:**
```powershell
cd server  # or cd client
npm install
```

### ❌ Connection Refused

**Error:** `Failed to fetch` or `Connection refused`

**Solution:**
- Make sure all three servers are running
- Check that the ports match:
  - Backend: 5001
  - Frontend: 5173
  - AI: 8000

---

## 📦 Environment Variables

### Backend (.env in `server/` directory)
```env
PORT=5001
NODE_ENV=development
DB_HOST=ep-small-cherry-a1jk5n7d-pooler.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_S8nocvWBk9xZ
JWT_SECRET=setu_secret_key_2025_change_in_production
CLIENT_URL=http://localhost:5173
```

### Frontend (.env in `client/` directory)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🎉 You're All Set!

All servers should now be running. You can:
- Access the frontend at http://localhost:5173
- The frontend will communicate with the backend at http://localhost:5001
- The backend will use the AI server at http://127.0.0.1:8000 for mentor recommendations

Happy coding! 🚀
