# 🗺️ Map Feature - README

## Overview

The Map Feature allows users to view the locations of their connected users on an interactive map. Users can set their location either manually or via GPS, and see nearby connections within a 50km radius.

## ✨ Features

- 📍 **Dual Location Input**: GPS or manual coordinate entry
- 🗺️ **Interactive Map**: Powered by Leaflet
- 👥 **Connected Users Only**: Privacy-focused, shows only your connections
- 📏 **Distance Filtering**: 50km radius by default
- 👤 **User Details**: Click markers to see full profile information
- 🔒 **Secure**: JWT authentication required
- 💾 **Separate Storage**: Location data stored independently from user profiles

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- PostgreSQL database (Neon)
- Existing SETU application setup

### Installation

1. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install leaflet
   ```

2. **Start Backend**
   ```bash
   cd server
   npm start
   ```
   The server will automatically create the `user_locations` table.

3. **Start Frontend**
   ```bash
   cd client
   npm run dev
   ```

4. **Access Map**
   - Login to the application
   - Navigate to `/map`
   - Set your location
   - View nearby connections!

## 📖 User Guide

### Setting Your Location

When you first visit the map, you'll be prompted to set your location:

**Option 1: GPS Location**
1. Click "Use GPS"
2. Click "Get My Location"
3. Allow browser location access
4. Your location is automatically saved

**Option 2: Manual Location**
1. Click "Manual Input"
2. Enter latitude (e.g., 19.076)
3. Enter longitude (e.g., 72.8777)
4. Click "Set Location"

### Viewing the Map

Once your location is set:
- **Blue marker**: Your location
- **Green markers**: Connected users within 50km
- **Circle**: 50km radius around you
- **Info panel**: Shows count of nearby connections

### Viewing User Details

Click any green marker to see:
- Profile picture
- Name and role
- Current position/company
- College and batch year
- Bio
- Distance from you

## 🔧 Technical Details

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/locations` | Save/update location |
| GET | `/api/locations/me` | Get your location |
| GET | `/api/locations/nearby?radius=50` | Get nearby connections |
| DELETE | `/api/locations/me` | Delete your location |

### Database Schema

```sql
CREATE TABLE user_locations (
  location_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_type VARCHAR(20) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Distance Calculation

Uses the **Haversine formula** for accurate distance calculation on a sphere:

```
d = 2r × arcsin(√(sin²((φ₂ - φ₁)/2) + cos(φ₁) × cos(φ₂) × sin²((λ₂ - λ₁)/2)))
```

Where:
- `r` = Earth's radius (6371 km)
- `φ` = latitude in radians
- `λ` = longitude in radians

## 📁 File Structure

```
server/
├── config/
│   └── initLocationsDatabase.js    # Database initialization
├── models/
│   └── locationModel.js            # Data operations
├── controllers/
│   └── locationController.js       # API handlers
├── routes/
│   └── locationRoutes.js           # Route definitions
└── server.js                       # Main server (updated)

client/
└── src/
    └── pages/
        └── Map.jsx                 # Map component
```

## 🧪 Testing

### Manual Testing

1. **Create Test Users**
   - Create 2 users
   - Connect them via the connections feature

2. **Set Locations**
   - Login as User 1
   - Set location: `19.076, 72.8777`
   - Login as User 2
   - Set location: `19.100, 72.900` (nearby)

3. **View Map**
   - Login as User 1
   - Navigate to `/map`
   - Should see User 2 on the map!

### API Testing

Use the provided Postman collection:
- `Map_Feature_Postman_Collection.json`

Or use curl:
```bash
# Login first
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save location
curl -X POST http://localhost:5001/api/locations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":19.076,"longitude":72.8777,"location_type":"gps"}'

# Get nearby connections
curl -X GET http://localhost:5001/api/locations/nearby?radius=50 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Troubleshooting

### Issue: GPS not working
**Solution**: 
- Ensure you're using HTTPS or localhost
- Check browser location permissions
- Use manual input as fallback

### Issue: No nearby connections showing
**Possible causes**:
- No connections exist
- Connected users haven't set locations
- Connected users are too far away (>50km)

**Solution**:
- Verify connections in database
- Ask connected users to set their locations
- Check distance calculations

### Issue: Map not displaying
**Solution**:
- Verify leaflet is installed: `npm list leaflet`
- Check browser console for errors
- Ensure CSS is imported: `import "leaflet/dist/leaflet.css"`

## 📚 Documentation

For more detailed information, see:

- **[MAP_FEATURE_GUIDE.md](./MAP_FEATURE_GUIDE.md)** - Complete implementation guide
- **[MAP_QUICK_START.md](./MAP_QUICK_START.md)** - Quick start testing guide
- **[MAP_ARCHITECTURE.md](./MAP_ARCHITECTURE.md)** - Architecture diagrams
- **[MAP_IMPLEMENTATION_SUMMARY.md](./MAP_IMPLEMENTATION_SUMMARY.md)** - Implementation summary

## 🔒 Privacy & Security

- ✅ Only shows connected users
- ✅ Requires authentication
- ✅ Location data stored separately
- ✅ Users can delete their location anytime
- ✅ No tracking or history
- ✅ No live movement updates

## 🎯 Requirements Met

- ✅ Separate database table for locations
- ✅ Manual and GPS location input
- ✅ Backend API for saving/fetching locations
- ✅ Map displays connected users only
- ✅ Map displays users within 50km only
- ✅ Click marker shows user details
- ✅ Uses existing user data (no new fields)
- ✅ Clean, minimal UI
- ✅ No authentication changes
- ✅ No chat, tracking, or notifications

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the detailed documentation files
3. Check browser console for frontend errors
4. Check server logs for backend errors

## 🎉 Credits

Built with:
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [React-Leaflet](https://react-leaflet.js.org/) - React integration
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tiles

## 📝 License

Part of the SETU application.

---

**Happy Mapping! 🗺️**
