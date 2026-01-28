# Map Feature - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SETU MAP FEATURE ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         Map.jsx Component                           │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  State Management:                                                 │    │
│  │  • step (check/input/map)                                          │    │
│  │  • userLocation                                                    │    │
│  │  • nearbyConnections                                               │    │
│  │  • selectedUser                                                    │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │   Step 1:    │  │   Step 2:    │  │   Step 3:    │            │    │
│  │  │    Check     │─▶│    Input     │─▶│     Map      │            │    │
│  │  │   Location   │  │   Location   │  │   Display    │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  Location Input Options:                                           │    │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                │    │
│  │  │   GPS Location      │  │  Manual Location    │                │    │
│  │  │  (navigator.geo)    │  │  (lat/lon input)    │                │    │
│  │  └─────────────────────┘  └─────────────────────┘                │    │
│  │                                                                     │    │
│  │  Map Display (Leaflet):                                            │    │
│  │  • User marker (blue)                                              │    │
│  │  • Connection markers (green)                                      │    │
│  │  • 50km radius circle                                              │    │
│  │  • User details popup on click                                     │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    │ Axios HTTP Requests                     │
│                                    ▼                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (REST)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Authentication Middleware (JWT)                                            │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │  protect() - Validates token, extracts user info            │            │
│  └────────────────────────────────────────────────────────────┘            │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │                    Location Routes                          │            │
│  │              /api/locations/*                               │            │
│  ├────────────────────────────────────────────────────────────┤            │
│  │                                                             │            │
│  │  POST   /api/locations         → saveUserLocation()        │            │
│  │  GET    /api/locations/me      → getMyLocation()           │            │
│  │  GET    /api/locations/nearby  → getNearbyConnections()    │            │
│  │  DELETE /api/locations/me      → deleteMyLocation()        │            │
│  │                                                             │            │
│  └────────────────────────────────────────────────────────────┘            │
│                                    │                                         │
│                                    ▼                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Node.js)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │              Location Controller                            │            │
│  │         (locationController.js)                             │            │
│  ├────────────────────────────────────────────────────────────┤            │
│  │                                                             │            │
│  │  • Validates input (coordinates, location_type)            │            │
│  │  • Handles business logic                                  │            │
│  │  • Calls location model functions                          │            │
│  │  • Returns formatted responses                             │            │
│  │                                                             │            │
│  └─────────────────────────┬──────────────────────────────────┘            │
│                            │                                                 │
│                            ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │               Location Model                                │            │
│  │          (locationModel.js)                                 │            │
│  ├────────────────────────────────────────────────────────────┤            │
│  │                                                             │            │
│  │  saveLocation(userId, locationData)                        │            │
│  │  • Upsert location (INSERT or UPDATE)                      │            │
│  │                                                             │            │
│  │  getUserLocation(userId)                                   │            │
│  │  • Fetch user's location                                   │            │
│  │                                                             │            │
│  │  getNearbyConnectedLocations(userId, lat, lon, radius)     │            │
│  │  • Join user_locations + users + mentor_connections        │            │
│  │  • Calculate distance (Haversine formula)                  │            │
│  │  • Filter by radius                                        │            │
│  │  • Return full user details                                │            │
│  │                                                             │            │
│  │  deleteLocation(userId)                                    │            │
│  │  • Remove user's location                                  │            │
│  │                                                             │            │
│  └─────────────────────────┬──────────────────────────────────┘            │
│                            │                                                 │
│                            │ SQL Queries                                     │
│                            ▼                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (PostgreSQL)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │                    user_locations                           │            │
│  ├────────────────────────────────────────────────────────────┤            │
│  │  location_id (PK)                                           │            │
│  │  user_id (FK → users.id) UNIQUE                             │            │
│  │  latitude (DECIMAL 10,8)                                    │            │
│  │  longitude (DECIMAL 11,8)                                   │            │
│  │  location_type (manual/gps)                                 │            │
│  │  address (TEXT)                                             │            │
│  │  created_at (TIMESTAMP)                                     │            │
│  │  updated_at (TIMESTAMP)                                     │            │
│  └────────────────────────────────────────────────────────────┘            │
│                            │                                                 │
│                            │ JOIN                                            │
│                            ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │                       users                                 │            │
│  ├────────────────────────────────────────────────────────────┤            │
│  │  id (PK)                                                    │            │
│  │  name, email, role                                          │            │
│  │  profile_image                                              │            │
│  │  college, batch_year, department                            │            │
│  │  current_company, current_position                          │            │
│  │  bio, skills                                                │            │
│  │  linkedin_url, github_url                                   │            │
│  │  is_active                                                  │            │
│  └────────────────────────────────────────────────────────────┘            │
│                            │                                                 │
│                            │ JOIN                                            │
│                            ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │                mentor_connections                           │            │
│  ├────────────────────────────────────────────────────────────┤            │
│  │  connection_id (PK)                                         │            │
│  │  user_id (FK → users.id)                                    │            │
│  │  mentor_identifier                                          │            │
│  │  mentor_name                                                │            │
│  │  created_at                                                 │            │
│  └────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  Indexes:                                                                    │
│  • idx_locations_user_id                                                    │
│  • idx_locations_coordinates                                                │
│  • idx_locations_updated_at                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DISTANCE CALCULATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Haversine Formula (in SQL):                                                │
│                                                                              │
│  distance_km = 6371 * acos(                                                 │
│    cos(radians(user_lat)) * cos(radians(location_lat)) *                    │
│    cos(radians(location_lon) - radians(user_lon)) +                         │
│    sin(radians(user_lat)) * sin(radians(location_lat))                      │
│  )                                                                           │
│                                                                              │
│  Where:                                                                      │
│  • 6371 = Earth's radius in kilometers                                      │
│  • Returns distance in kilometers                                           │
│  • Accurate for spherical Earth approximation                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW EXAMPLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User A (Mumbai): lat=19.076, lon=72.8777                                   │
│  User B (Nearby): lat=19.100, lon=72.900                                    │
│  User C (Far):    lat=20.000, lon=73.000                                    │
│                                                                              │
│  User A connects with both User B and User C                                │
│                                                                              │
│  When User A views map:                                                     │
│  1. GET /api/locations/nearby?radius=50                                     │
│  2. Backend calculates:                                                     │
│     • User B distance: ~3.5 km ✅ (within 50km)                             │
│     • User C distance: ~105 km ❌ (outside 50km)                            │
│  3. Returns only User B                                                     │
│  4. Map shows:                                                              │
│     • User A marker (blue) at 19.076, 72.8777                               │
│     • User B marker (green) at 19.100, 72.900                               │
│     • 50km radius circle around User A                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY & VALIDATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Authentication:                                                             │
│  • All endpoints require JWT token                                          │
│  • Token validated via protect() middleware                                 │
│  • User ID extracted from token                                             │
│                                                                              │
│  Input Validation:                                                           │
│  • Latitude: -90 to 90                                                      │
│  • Longitude: -180 to 180                                                   │
│  • location_type: 'manual' or 'gps' only                                    │
│  • Radius: positive number (default 50)                                     │
│                                                                              │
│  Data Privacy:                                                               │
│  • Users only see connected users                                           │
│  • Location data separate from profile                                      │
│  • Can delete location anytime                                              │
│                                                                              │
│  SQL Injection Prevention:                                                   │
│  • Parameterized queries ($1, $2, etc.)                                     │
│  • No string concatenation                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            FILE STRUCTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  server/                                                                     │
│  ├── config/                                                                 │
│  │   └── initLocationsDatabase.js    ← DB initialization                   │
│  ├── models/                                                                 │
│  │   └── locationModel.js            ← Data operations                      │
│  ├── controllers/                                                            │
│  │   └── locationController.js       ← Business logic                       │
│  ├── routes/                                                                 │
│  │   └── locationRoutes.js           ← API routes                           │
│  └── server.js                        ← Main server (updated)               │
│                                                                              │
│  client/                                                                     │
│  └── src/                                                                    │
│      └── pages/                                                              │
│          └── Map.jsx                  ← Map component                       │
│                                                                              │
│  Documentation/                                                              │
│  ├── MAP_FEATURE_GUIDE.md            ← Complete guide                       │
│  ├── MAP_QUICK_START.md              ← Quick start                          │
│  ├── MAP_IMPLEMENTATION_SUMMARY.md   ← Summary                              │
│  ├── MAP_ARCHITECTURE.md             ← This file                            │
│  └── Map_Feature_Postman_Collection.json ← API testing                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  React   │────▶│  Express │────▶│PostgreSQL│
│ Browser  │     │Component │     │  Server  │     │ Database │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                 │                 │
     │ 1. Open /map   │                 │                 │
     │───────────────▶│                 │                 │
     │                │ 2. Check loc    │                 │
     │                │────────────────▶│                 │
     │                │                 │ 3. Query        │
     │                │                 │────────────────▶│
     │                │                 │ 4. Result       │
     │                │                 │◀────────────────│
     │                │ 5. Response     │                 │
     │                │◀────────────────│                 │
     │ 6. Show input  │                 │                 │
     │◀───────────────│                 │                 │
     │                │                 │                 │
     │ 7. Set location│                 │                 │
     │───────────────▶│                 │                 │
     │                │ 8. Save loc     │                 │
     │                │────────────────▶│                 │
     │                │                 │ 9. Insert       │
     │                │                 │────────────────▶│
     │                │                 │ 10. Saved       │
     │                │                 │◀────────────────│
     │                │ 11. Success     │                 │
     │                │◀────────────────│                 │
     │                │ 12. Get nearby  │                 │
     │                │────────────────▶│                 │
     │                │                 │ 13. Complex     │
     │                │                 │     query       │
     │                │                 │────────────────▶│
     │                │                 │ 14. Results     │
     │                │                 │◀────────────────│
     │                │ 15. User list   │                 │
     │                │◀────────────────│                 │
     │ 16. Render map │                 │                 │
     │◀───────────────│                 │                 │
     │                │                 │                 │
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│              FRONTEND                        │
├─────────────────────────────────────────────┤
│ • React 19.1.1                              │
│ • React Router 7.8.2                        │
│ • Leaflet (latest)                          │
│ • React-Leaflet 5.0.0                       │
│ • Axios 1.13.2                              │
│ • React Icons 5.0.1                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              BACKEND                         │
├─────────────────────────────────────────────┤
│ • Node.js                                   │
│ • Express.js                                │
│ • JWT (jsonwebtoken)                        │
│ • pg (PostgreSQL driver)                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              DATABASE                        │
├─────────────────────────────────────────────┤
│ • PostgreSQL (Neon)                         │
│ • Haversine distance calculation            │
│ • Spatial indexing                          │
└─────────────────────────────────────────────┘
```
