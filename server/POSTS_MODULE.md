# 📱 POSTS MODULE - TECHNICAL DOCUMENTATION

## 🏗️ ARCHITECTURE OVERVIEW

### Technology Stack
- **Database:** PostgreSQL (Neon)
- **Image Storage:** Cloudinary CDN
- **Upload Handler:** Multer (memory storage)
- **Authentication:** JWT (existing middleware)
- **Backend:** Node.js + Express

### Data Flow
```
User → Frontend (FormData) → Express → Multer (Memory) → Cloudinary → Neon DB (URL)
                                                              ↓
                                                         Response
```

---

## 📊 DATABASE SCHEMA

### Tables

#### 1. posts
```sql
post_id         SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL
user_role       VARCHAR(20) CHECK IN ('student', 'alumni')
content         TEXT NOT NULL
image_url       TEXT (nullable)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**
- `idx_posts_user_id` - Fast user posts lookup
- `idx_posts_created_at` - Fast feed ordering (DESC)

---

#### 2. post_likes
```sql
like_id         SERIAL PRIMARY KEY
post_id         INTEGER REFERENCES posts(post_id) ON DELETE CASCADE
user_id         INTEGER NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(post_id, user_id) -- Prevents duplicate likes
```

**Indexes:**
- `idx_post_likes_post_id` - Fast like counts
- `idx_post_likes_user_id` - Fast user like checks

---

#### 3. post_comments
```sql
comment_id      SERIAL PRIMARY KEY
post_id         INTEGER REFERENCES posts(post_id) ON DELETE CASCADE
user_id         INTEGER NOT NULL
user_role       VARCHAR(20) CHECK IN ('student', 'alumni')
comment_text    TEXT NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**
- `idx_post_comments_post_id` - Fast comment retrieval
- `idx_post_comments_created_at` - Comment ordering

---

## 🛣️ API REFERENCE

### POST /api/posts
**Create a new post**

**Auth:** Required (Student/Alumni)

**Request (multipart/form-data):**
```
content: string (required, 1-5000 chars)
image: file (optional, JPEG/PNG/GIF/WebP, max 5MB)
```

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "post_id": 1,
    "user_id": 123,
    "user_role": "student",
    "content": "Post text...",
    "image_url": "https://res.cloudinary.com/...",
    "created_at": "2026-01-12T10:30:00Z",
    "likes_count": 0,
    "comments_count": 0,
    "is_liked": false
  }
}
```

---

### GET /api/posts
**Get paginated feed**

**Auth:** Required

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "posts": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 47,
    "hasMore": true
  }
}
```

---

### DELETE /api/posts/:postId
**Delete a post**

**Auth:** Required (Author or Admin)

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

**Notes:**
- Deletes image from Cloudinary
- Cascades to likes and comments

---

### POST /api/posts/:postId/like
**Like a post**

**Auth:** Required (Student/Alumni)

**Response:**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "likes_count": 5
}
```

**Errors:**
- 400: Already liked
- 404: Post not found

---

### DELETE /api/posts/:postId/like
**Unlike a post**

**Auth:** Required (Student/Alumni)

**Response:**
```json
{
  "success": true,
  "message": "Post unliked successfully",
  "likes_count": 4
}
```

---

### POST /api/posts/:postId/comments
**Add a comment**

**Auth:** Required (Student/Alumni)

**Request (JSON):**
```json
{
  "comment_text": "Great post!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "comment_id": 1,
    "post_id": 1,
    "user_id": 123,
    "user_role": "student",
    "comment_text": "Great post!",
    "created_at": "2026-01-12T10:35:00Z"
  }
}
```

---

### GET /api/posts/:postId/comments
**Get all comments for a post**

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "comment_id": 1,
      "post_id": 1,
      "user_id": 123,
      "user_role": "student",
      "comment_text": "Great post!",
      "created_at": "2026-01-12T10:35:00Z"
    }
  ]
}
```

---

## 🔐 AUTHENTICATION & PERMISSIONS

### JWT Token Structure
```javascript
{
  userId: 123,
  role: 'student', // or 'alumni', 'admin'
  email: 'user@example.com'
}
```

### Permission Matrix

| Action | Student | Alumni | Admin |
|--------|---------|--------|-------|
| Create Post | ✅ | ✅ | ❌ |
| View Feed | ✅ | ✅ | ✅ |
| Like Post | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ❌ |
| Delete Own Post | ✅ | ✅ | N/A |
| Delete Any Post | ❌ | ❌ | ✅ |

---

## 🖼️ IMAGE HANDLING

### Upload Process
1. Client selects image
2. Multer receives file in memory (Buffer)
3. Buffer sent to Cloudinary
4. Cloudinary returns secure URL
5. URL stored in database
6. No filesystem interaction

### Cloudinary Transformations
```javascript
{
  width: 1200,
  height: 1200,
  crop: 'limit',
  quality: 'auto:good',
  fetch_format: 'auto' // WebP when supported
}
```

### Benefits
- Global CDN delivery
- Auto-compression
- Responsive images
- No server storage needed

### Deletion
- When post deleted → Cloudinary image deleted
- Async operation (doesn't block deletion)
- Best-effort (logs errors but continues)

---

## 📝 CODE STRUCTURE

### Controller Layer
**File:** `server/controllers/postController.js`

**Responsibilities:**
- Business logic
- Input validation
- Database queries
- Image upload coordination
- Error handling

**Functions:**
- `createPost()` - Create post with optional image
- `getPosts()` - Get paginated feed
- `deletePost()` - Delete post (author/admin)
- `likePost()` - Add like
- `unlikePost()` - Remove like
- `addComment()` - Add comment
- `getComments()` - Get all comments

---

### Route Layer
**File:** `server/routes/postRoutes.js`

**Responsibilities:**
- Endpoint definitions
- Middleware application
- Request routing

**Middleware Chain:**
```javascript
POST /api/posts
  → authenticate        // Verify JWT
  → isStudentOrAlumni  // Check role
  → upload.single()    // Process image
  → createPost         // Controller
```

---

### Configuration
**Files:**
- `server/config/cloudinary.js` - Cloudinary setup
- `server/config/multer.js` - Multer configuration
- `server/config/initPostsDatabase.js` - DB initialization

---

## 🔍 SQL QUERIES

### Get Feed (Optimized)
```sql
SELECT 
  p.post_id,
  p.user_id,
  p.user_role,
  p.content,
  p.image_url,
  p.created_at,
  COALESCE(COUNT(DISTINCT pl.like_id), 0)::int AS likes_count,
  COALESCE(COUNT(DISTINCT pc.comment_id), 0)::int AS comments_count,
  EXISTS(
    SELECT 1 FROM post_likes 
    WHERE post_id = p.post_id AND user_id = $1
  ) AS is_liked
FROM posts p
LEFT JOIN post_likes pl ON p.post_id = pl.post_id
LEFT JOIN post_comments pc ON p.post_id = pc.post_id
GROUP BY p.post_id
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3
```

**Benefits:**
- Single query (no N+1 problem)
- Aggregates likes/comments
- Checks user's like status
- Proper pagination

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Database
- **Indexes:** All common queries indexed
- **Pagination:** Limits data transfer
- **Single Query:** Avoids N+1 problem
- **Connection Pooling:** Reuses connections

### Images
- **CDN:** Cloudinary global edge network
- **Compression:** Auto-optimized quality
- **Format:** Auto WebP when supported
- **Lazy Loading:** Frontend responsibility

### API
- **Validation:** Early rejection of invalid requests
- **Error Handling:** Fast failure paths
- **Memory Storage:** No disk I/O for uploads

---

## 🛡️ SECURITY MEASURES

### Input Validation
```javascript
// Content length
if (content.length > 5000) return 400;

// File type
allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// File size
maxSize = 5 * 1024 * 1024; // 5MB
```

### SQL Injection Prevention
```javascript
// ✅ Always use parameterized queries
pool.query('SELECT * FROM posts WHERE post_id = $1', [postId]);

// ❌ Never concatenate
pool.query(`SELECT * FROM posts WHERE post_id = ${postId}`);
```

### Authorization Checks
```javascript
// Check post ownership
if (post.user_id !== userId && role !== 'admin') {
  return 403;
}
```

### XSS Prevention
- Backend stores raw text
- Frontend responsible for sanitization
- Never render HTML from user content directly

---

## 🐛 ERROR HANDLING

### Standard Error Format
```json
{
  "success": false,
  "message": "Clear error message"
}
```

### Error Codes
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (post doesn't exist)
- **500** - Internal Server Error

### Error Logging
```javascript
console.error('Error context:', error);
// Logs to server console for debugging
// Never exposes stack traces to client
```

---

## 🧪 TESTING GUIDE

### Unit Tests (Recommended)
```javascript
describe('createPost', () => {
  it('should create post with valid data', async () => {
    const req = {
      user: { userId: 1, role: 'student' },
      body: { content: 'Test post' },
      file: null
    };
    await createPost(req, res);
    expect(res.status).toBe(201);
  });
});
```

### Integration Tests
```javascript
describe('POST /api/posts', () => {
  it('should upload image to Cloudinary', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', './test.jpg')
      .field('content', 'Test');
    
    expect(res.body.post.image_url).toMatch(/cloudinary/);
  });
});
```

---

## 📚 DEPENDENCIES

### Production
- `multer` - File upload handling
- `cloudinary` - Cloud image storage
- `express` - Web framework (existing)
- `pg` - PostgreSQL client (existing)
- `jsonwebtoken` - JWT auth (existing)

### Installation
```bash
npm install multer cloudinary
```

---

## 🔄 MAINTENANCE

### Database Migrations
Currently auto-initializes. For production:
```bash
# Manual initialization
node server/config/initPostsDatabase.js

# Or run SQL directly
psql $DATABASE_URL -f server/config/schema_posts.sql
```

### Monitoring
**Key Metrics:**
- Post creation rate
- Image upload success rate
- Average feed load time
- Database query performance

**Recommended Tools:**
- PostgreSQL query logs
- Cloudinary dashboard
- Server logs
- Error tracking (Sentry, etc.)

---

## 🚀 DEPLOYMENT

### Environment Variables Required
```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
```

### Platform Compatibility
- ✅ Vercel
- ✅ Render
- ✅ Railway
- ✅ Heroku
- ✅ AWS (with serverless postgres)
- ✅ Any Node.js hosting

### Pre-Deploy Checklist
- [ ] Environment variables set
- [ ] Database initialized
- [ ] Cloudinary account configured
- [ ] CORS configured for production domain
- [ ] NODE_ENV=production

---

## 📖 ADDITIONAL RESOURCES

- [FEED_IMPLEMENTATION_GUIDE.md](../FEED_IMPLEMENTATION_GUIDE.md) - Full implementation guide
- [FEED_QUICK_REFERENCE.md](../FEED_QUICK_REFERENCE.md) - Quick API reference
- [FEED_API_TESTING.md](../FEED_API_TESTING.md) - Testing examples
- [FEED_BEST_PRACTICES.md](../FEED_BEST_PRACTICES.md) - Best practices

---

## 🤝 CONTRIBUTING

When modifying posts module:
1. Never store images on disk
2. Always use parameterized SQL queries
3. Validate inputs before processing
4. Test with Cloudinary before merging
5. Update documentation

---

## 📞 TROUBLESHOOTING

**Image upload fails:**
→ Check Cloudinary credentials in `.env`

**"Post not found" on valid ID:**
→ Check database connection and table existence

**Permission denied errors:**
→ Verify JWT token contains correct role

**Slow feed loading:**
→ Check database indexes are created

---

**Module Status:** ✅ Production Ready  
**Last Updated:** January 12, 2026  
**Version:** 1.0.0
