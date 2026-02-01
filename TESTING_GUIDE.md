# Map Feature Testing Guide

## Quick Testing Steps

Follow these steps to test the map feature:

### Step 1: Start the Backend

Open a terminal in the `server` folder and run:

```bash
cd server
npm start
```

**Expected Output:**
```
✅ Database connected successfully
🔄 Initializing user locations database schema...
✅ User locations table created/verified
✅ Indexes created/verified
✅ User locations database initialization complete!
🚀 SETU Server Running
📡 Port: 5001
```

**If you see errors:**
- Check if port 5001 is already in use
- Verify database connection in `.env` file
- Check that all dependencies are installed: `npm install`

### Step 2: Start the Frontend

Open a **NEW** terminal in the `client` folder and run:

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 3: Login to the Application

1. Open your browser and go to: `http://localhost:5173`
2. Login with your existing credentials
   - If you don't have an account, create one first

### Step 4: Navigate to the Map

1. After logging in, navigate to: `http://localhost:5173/map`
2. You should see the **"Set Your Location"** screen

### Step 5: Set Your Location

**Option A - Using GPS:**
1. Click **"Use GPS"** button
2. Click **"Get My Location"** button
3. Allow browser location access when prompted
4. Wait for location to be saved

**Option B - Using Manual Input:**
1. Click **"Manual Input"** button
2. Enter coordinates:
   - **Latitude**: `19.076` (Mumbai, India example)
   - **Longitude**: `72.8777`
3. Click **"Set Location"** button

### Step 6: View the Map

After setting your location, you should see:
- ✅ Interactive map
- ✅ Blue marker at your location
- ✅ 50km radius circle
- ✅ Info panel showing "0 connections within 50km" (if no connections have set locations yet)

### Step 7: Test with Multiple Users (Optional)

To see nearby connections on the map:

1. **Create/Login as User 2** in a different browser or incognito window
2. **Connect User 1 and User 2** using the existing connections feature
3. **Set User 2's location** (use coordinates close to User 1):
   - Latitude: `19.100`
   - Longitude: `72.900`
4. **Go back to User 1** and refresh the map
5. You should now see **User 2's green marker** on the map!

### Step 8: Click on a Marker

1. Click on any green marker (connected user)
2. You should see a **user details panel** with:
   - Profile picture
   - Name and role
   - Company and position
   - College information
   - Bio
   - Distance in kilometers

## Troubleshooting

### Server won't start

**Error: Port already in use**
```bash
# Kill the process using port 5001
netstat -ano | findstr :5001
taskkill /PID <PID_NUMBER> /F
```

**Error: Database connection failed**
- Check your `.env` file in the `server` folder
- Verify database credentials are correct
- Ensure database is accessible

### Frontend won't start

**Error: Module not found 'leaflet'**
```bash
cd client
npm install leaflet
```

### Map not displaying

1. Check browser console for errors (F12)
2. Verify you're logged in (check localStorage for token)
3. Clear browser cache and reload

### GPS not working

- Ensure you're using HTTPS or localhost
- Check browser location permissions
- Use manual input as alternative

### No nearby connections showing

This is normal if:
- You haven't connected with other users yet
- Connected users haven't set their locations
- Connected users are more than 50km away

## Testing with Postman

You can also test the API directly:

1. **Import the collection**: `Map_Feature_Postman_Collection.json`
2. **Login first** to get a token
3. **Set the token** in the {{token}} variable
4. **Test endpoints**:
   - Save Location
   - Get My Location
   - Get Nearby Connections

## Sample Test Data

### User 1 (Mumbai)
```json
{
  "latitude": 19.076,
  "longitude": 72.8777,
  "location_type": "manual"
}
```

### User 2 (Nearby - ~3km away)
```json
{
  "latitude": 19.100,
  "longitude": 72.900,
  "location_type": "manual"
}
```

### User 3 (Far - ~100km away - won't show)
```json
{
  "latitude": 20.000,
  "longitude": 73.000,
  "location_type": "manual"
}
```

## Success Checklist

- [ ] Backend server starts without errors
- [ ] Frontend starts without errors
- [ ] Can login to the application
- [ ] Can navigate to `/map` route
- [ ] Can set location via GPS or manual input
- [ ] Map displays with user marker
- [ ] Can see connected users (if any have set locations)
- [ ] Can click markers to see user details
- [ ] No console errors

## Need Help?

If you encounter issues:
1. Check the browser console (F12 → Console tab)
2. Check the server terminal for error messages
3. Review the documentation files:
   - `MAP_FEATURE_GUIDE.md` - Complete guide
   - `MAP_README.md` - User guide
   - `MAP_ARCHITECTURE.md` - Technical details

## Quick Commands Reference

```bash
# Start backend
cd server
npm start

# Start frontend (in new terminal)
cd client
npm run dev

# Check if leaflet is installed
cd client
npm list leaflet

# Install leaflet if missing
cd client
npm install leaflet

# View server logs
cd server
npm start

# Stop server
Ctrl + C
```

Happy Testing! 🗺️
