# Map Feature - Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies (if not already done)
```bash
# Client
cd client
npm install leaflet

# Server (no new dependencies needed)
```

### 2. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 📍 Testing the Map Feature

### Scenario 1: First Time User

1. **Login** to the application
2. **Navigate** to `/map` route
3. You'll see **"Set Your Location"** screen
4. Choose one option:
   - **GPS**: Click "Use GPS" → "Get My Location" → Allow browser access
   - **Manual**: Click "Manual Input" → Enter coordinates → "Set Location"
     - Example: Latitude: `19.076`, Longitude: `72.8777`
5. Map loads with your location marked (blue marker)

### Scenario 2: Viewing Nearby Connections

**Prerequisites:**
- You must have connections (via the connections feature)
- Connected users must have set their locations
- Connected users must be within 50km

**Steps:**
1. Login as User A
2. Navigate to map
3. Set your location (if not already set)
4. You'll see:
   - Your location (blue marker)
   - Connected users within 50km (green markers)
   - 50km radius circle
   - Info panel showing count of nearby connections

### Scenario 3: Viewing User Details

1. On the map, **click any green marker**
2. User details panel appears showing:
   - Profile picture
   - Name and role
   - Current position/company
   - College information
   - Bio
   - Distance from you
3. Click **✕** to close the panel

## 🧪 Testing with Multiple Users

### Setup Test Environment:

**Step 1: Create Users**
```
User A: test1@example.com
User B: test2@example.com
```

**Step 2: Create Connection**
- Login as User A
- Connect with User B (via existing connection feature)

**Step 3: Set Locations**
- Login as User A
  - Set location: Lat `19.076`, Lon `72.8777`
- Login as User B
  - Set location: Lat `19.100`, Lon `72.900` (nearby)

**Step 4: View Map**
- Login as User A
- Navigate to map
- Should see User B on the map!

## 📡 API Endpoints

### Save Location
```bash
POST http://localhost:5001/api/locations
Headers: Authorization: Bearer <token>
Body:
{
  "latitude": 19.076,
  "longitude": 72.8777,
  "location_type": "gps"
}
```

### Get My Location
```bash
GET http://localhost:5001/api/locations/me
Headers: Authorization: Bearer <token>
```

### Get Nearby Connections
```bash
GET http://localhost:5001/api/locations/nearby?radius=50
Headers: Authorization: Bearer <token>
```

### Delete My Location
```bash
DELETE http://localhost:5001/api/locations/me
Headers: Authorization: Bearer <token>
```

## 🐛 Common Issues & Solutions

### Issue: "Please set your location first"
**Cause:** User hasn't set their location yet
**Solution:** Go through the location input flow

### Issue: No nearby connections showing
**Possible Causes:**
1. No connections exist
2. Connected users haven't set locations
3. Connected users are too far (>50km)

**Solution:**
- Check connections in database: `SELECT * FROM mentor_connections WHERE user_id = <your_id>;`
- Check locations: `SELECT * FROM user_locations;`
- Verify distance calculations

### Issue: GPS not working
**Cause:** Browser doesn't have location permission
**Solution:** 
- Check browser location settings
- Use HTTPS or localhost
- Use manual input as alternative

### Issue: Map not displaying
**Cause:** Leaflet CSS not loaded
**Solution:** Verify `import "leaflet/dist/leaflet.css";` in Map.jsx

## 📊 Database Queries for Testing

### Check if location exists for user
```sql
SELECT * FROM user_locations WHERE user_id = <user_id>;
```

### Check all locations
```sql
SELECT 
  ul.*,
  u.name,
  u.email
FROM user_locations ul
JOIN users u ON ul.user_id = u.id;
```

### Check connections
```sql
SELECT * FROM mentor_connections WHERE user_id = <user_id>;
```

### Manually insert test location
```sql
INSERT INTO user_locations (user_id, latitude, longitude, location_type)
VALUES (1, 19.076, 72.8777, 'manual');
```

### Calculate distance between two points
```sql
SELECT 
  6371 * acos(
    cos(radians(19.076)) * cos(radians(19.100)) * 
    cos(radians(72.900) - radians(72.8777)) + 
    sin(radians(19.076)) * sin(radians(19.100))
  ) AS distance_km;
```

## 🎯 Feature Checklist

- ✅ Separate `user_locations` table
- ✅ Manual location input
- ✅ GPS location input
- ✅ Backend API for saving location
- ✅ Backend API for fetching nearby connections
- ✅ Map displays user location
- ✅ Map displays connected users only
- ✅ Map displays users within 50km only
- ✅ Click marker shows user details
- ✅ User details from existing user table
- ✅ No authentication changes
- ✅ No new profile fields
- ✅ Clean, minimal UI
- ✅ No chat/tracking/notifications

## 📝 Sample Test Data

### User 1 (Mumbai, India)
```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "location_type": "gps"
}
```

### User 2 (Nearby - ~3km away)
```json
{
  "latitude": 19.1000,
  "longitude": 72.9000,
  "location_type": "manual"
}
```

### User 3 (Far - ~100km away - should NOT show)
```json
{
  "latitude": 20.0000,
  "longitude": 73.0000,
  "location_type": "manual"
}
```

## 🔍 Debugging Tips

1. **Check browser console** for API errors
2. **Check server logs** for backend errors
3. **Verify token** is being sent in headers
4. **Check database** for location entries
5. **Verify connections** exist in mentor_connections table
6. **Test API endpoints** directly with Postman/curl

## 📚 Related Files

**Backend:**
- `server/config/initLocationsDatabase.js` - DB setup
- `server/models/locationModel.js` - Data operations
- `server/controllers/locationController.js` - API handlers
- `server/routes/locationRoutes.js` - Route definitions
- `server/server.js` - Main server (updated)

**Frontend:**
- `client/src/pages/Map.jsx` - Map component

**Documentation:**
- `MAP_FEATURE_GUIDE.md` - Complete implementation guide

## 🎉 Success Criteria

You've successfully implemented the map feature when:
1. ✅ User can set location via GPS or manual input
2. ✅ Location is saved to `user_locations` table
3. ✅ Map displays with user's location
4. ✅ Map shows connected users within 50km
5. ✅ Clicking marker shows full user details
6. ✅ No errors in console or server logs
