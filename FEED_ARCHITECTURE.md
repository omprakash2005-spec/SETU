# 📊 SETU FEED SYSTEM - VISUAL ARCHITECTURE

## 🏗️ SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SETU FEED SYSTEM                             │
│                    (LinkedIn-Style Social Feed)                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│   Cloud Services     │
│  (React)     │◀─────│  (Express)   │◀─────│  (Neon + Cloudinary) │
└──────────────┘      └──────────────┘      └──────────────────────┘
```

---

## 📤 IMAGE UPLOAD FLOW

```
┌─────────────┐
│   Client    │  User selects image
│  (Browser)  │
└──────┬──────┘
       │
       │ FormData (text + image file)
       │ Authorization: Bearer JWT
       ▼
┌─────────────┐
│   Express   │  Receives request
│   Server    │
└──────┬──────┘
       │
       │ 1. Authenticate (JWT middleware)
       │ 2. Verify role (student/alumni)
       ▼
┌─────────────┐
│   Multer    │  Process upload
│  (Memory)   │  - Validate file type
└──────┬──────┘  - Check file size
       │         - Store in Buffer
       │
       │ Image Buffer (not saved to disk!)
       ▼
┌─────────────┐
│ Cloudinary  │  Upload to cloud
│     API     │  - Compress image
└──────┬──────┘  - Convert to WebP
       │         - Resize if needed
       │
       │ Secure Image URL
       │ https://res.cloudinary.com/...
       ▼
┌─────────────┐
│  Neon DB    │  Store post
│ (PostgreSQL)│  - user_id, content
└──────┬──────┘  - image_url (Cloudinary link)
       │         - created_at
       │
       │ Post object with URL
       ▼
┌─────────────┐
│   Client    │  Display post
│  (Browser)  │  <img src={post.image_url} />
└─────────────┘
```

**Key Points:**
- ✅ No filesystem interaction
- ✅ Image never saved locally
- ✅ Works with multiple developers
- ✅ Production-ready

---

## 📥 FEED RETRIEVAL FLOW

```
┌─────────────┐
│   Client    │  GET /api/posts?page=1&limit=10
│  (Browser)  │
└──────┬──────┘
       │
       │ Authorization: Bearer JWT
       ▼
┌─────────────┐
│   Express   │  1. Authenticate user
│   Server    │  2. Extract userId from token
└──────┬──────┘
       │
       │ Query with userId for 'is_liked'
       ▼
┌─────────────┐
│  Neon DB    │  Single optimized query:
│ (PostgreSQL)│
└─────────────┘
       │
       │ SELECT posts.*,
       │   COUNT(likes) AS likes_count,
       │   COUNT(comments) AS comments_count,
       │   EXISTS(user_liked) AS is_liked
       │ FROM posts
       │ LEFT JOIN likes ...
       │ LEFT JOIN comments ...
       │ GROUP BY post_id
       │ ORDER BY created_at DESC
       │ LIMIT 10 OFFSET 0
       │
       ▼
┌─────────────┐
│   Response  │  {
│    JSON     │    posts: [...],
└─────────────┘    pagination: {
                     currentPage: 1,
                     totalPages: 5,
                     hasMore: true
                   }
                 }
```

**Performance:**
- ✅ One query (no N+1 problem)
- ✅ Indexed for speed
- ✅ Pagination prevents overload

---

## 💙 LIKE/UNLIKE FLOW

```
┌─────────────┐
│   User      │  Clicks "Like" button
│   Action    │
└──────┬──────┘
       │
       │ POST /api/posts/1/like
       ▼
┌─────────────┐
│   Backend   │  1. Verify user is authenticated
│ Validation  │  2. Check post exists
└──────┬──────┘  3. Check not already liked
       │
       ├─ Already liked? → Return 400 error
       │
       │ Insert into post_likes
       ▼
┌─────────────┐
│  Database   │  INSERT INTO post_likes
│  Operation  │  (post_id, user_id)
└──────┬──────┘  VALUES (1, 123)
       │         ON CONFLICT → Error (prevented by UNIQUE)
       │
       │ Count new total
       ▼
┌─────────────┐
│   Response  │  {
│             │    success: true,
└─────────────┘    likes_count: 5
                 }

┌─────────────┐
│   Unlike    │  DELETE /api/posts/1/like
│   Flow      │  → DELETE FROM post_likes
└─────────────┘    WHERE post_id=1 AND user_id=123
```

**Guarantees:**
- ✅ No duplicate likes (UNIQUE constraint)
- ✅ Fast counts (indexed)
- ✅ Immediate feedback

---

## 💬 COMMENT FLOW

```
┌─────────────┐
│   User      │  Types comment
│   Input     │  "Great post!"
└──────┬──────┘
       │
       │ POST /api/posts/1/comments
       │ { comment_text: "Great post!" }
       ▼
┌─────────────┐
│  Validation │  1. Check content length (1-1000 chars)
│             │  2. Verify post exists
└──────┬──────┘  3. Verify user role (student/alumni)
       │
       │ Insert comment
       ▼
┌─────────────┐
│  Database   │  INSERT INTO post_comments
│             │  (post_id, user_id, user_role, comment_text)
└──────┬──────┘  VALUES (1, 123, 'student', 'Great post!')
       │
       │ Return new comment
       ▼
┌─────────────┐
│   Response  │  {
│             │    comment_id: 42,
└─────────────┘    user_id: 123,
                   comment_text: "Great post!",
                   created_at: "2026-01-12T..."
                 }

┌─────────────┐
│  Get All    │  GET /api/posts/1/comments
│  Comments   │  → SELECT * FROM post_comments
└─────────────┘    WHERE post_id = 1
                   ORDER BY created_at ASC
```

---

## 🗑️ DELETE POST FLOW

```
┌─────────────┐
│   User      │  Clicks "Delete"
│   Action    │
└──────┬──────┘
       │
       │ DELETE /api/posts/1
       ▼
┌─────────────┐
│   Backend   │  1. Verify user is authenticated
│ Permission  │  2. Fetch post owner
└──────┬──────┘  3. Check if (user is owner OR admin)
       │
       ├─ Not authorized? → Return 403 error
       │
       │ Delete from Cloudinary
       ▼
┌─────────────┐
│ Cloudinary  │  DELETE image (if exists)
│     API     │  cloudinary.uploader.destroy(publicId)
└──────┬──────┘  (Best effort - logs errors but continues)
       │
       │ Delete from database
       ▼
┌─────────────┐
│  Database   │  DELETE FROM posts
│  Cascade    │  WHERE post_id = 1
└──────┬──────┘
       │         ↓ CASCADE triggers
       │         
       ├─────────▶ DELETE FROM post_likes WHERE post_id=1
       │
       └─────────▶ DELETE FROM post_comments WHERE post_id=1
       
       All related data cleaned up!
       
┌─────────────┐
│   Response  │  {
│             │    success: true,
└─────────────┘    message: "Post deleted"
                 }
```

**Safety:**
- ✅ Permissions enforced
- ✅ Cloudinary cleanup
- ✅ Cascading deletes (no orphans)

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────┐
│   Client    │  Any API request
│   Request   │  Authorization: Bearer eyJhbGc...
└──────┬──────┘
       │
       │ JWT Token
       ▼
┌─────────────┐
│   Auth      │  1. Extract token from header
│ Middleware  │  2. Verify signature with JWT_SECRET
└──────┬──────┘  3. Check expiration
       │
       ├─ Invalid/expired? → Return 401 error
       │
       │ Decoded token:
       │ { userId: 123, role: 'student' }
       ▼
┌─────────────┐
│  Attach to  │  req.user = {
│   Request   │    userId: 123,
└──────┬──────┘    role: 'student'
       │          }
       │
       │ Role-based middleware (if needed)
       ▼
┌─────────────┐
│   Check     │  isStudentOrAlumni?
│   Role      │  isAdmin?
└──────┬──────┘
       │
       ├─ Wrong role? → Return 403 error
       │
       │ Proceed to controller
       ▼
┌─────────────┐
│ Controller  │  Access req.user.userId
│   Logic     │  Access req.user.role
└─────────────┘
```

---

## 🗃️ DATABASE RELATIONSHIPS

```
┌─────────────────────────────┐
│          POSTS              │
│─────────────────────────────│
│ post_id       (PK)          │
│ user_id                     │
│ user_role                   │
│ content                     │
│ image_url                   │
│ created_at                  │
└────────┬────────────────────┘
         │
         │ One-to-Many
         │
    ┌────┴─────┬──────────────┐
    │          │              │
    ▼          ▼              ▼
┌───────┐  ┌─────────┐  ┌──────────┐
│ LIKES │  │ COMMENTS│  │ (Future) │
│───────│  │─────────│  │ SHARES   │
│post_id│  │post_id  │  │post_id   │
│user_id│  │user_id  │  │user_id   │
│       │  │comment  │  │          │
└───────┘  └─────────┘  └──────────┘
    ▲          ▲
    │          │
    │ ON DELETE CASCADE
    │ (Delete post → Delete likes/comments)
    │
```

**Indexes:**
- `posts.created_at` (DESC) - Feed ordering
- `posts.user_id` - User's posts
- `post_likes.post_id` - Count likes
- `post_comments.post_id` - Fetch comments

---

## 🌐 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                     │
└─────────────────────────────────────────────────────────────┘

         ┌──────────────┐
         │   Vercel     │  (or Render/Railway)
         │   Frontend   │  React app
         └──────┬───────┘
                │
                │ HTTPS API calls
                │ /api/posts
                ▼
         ┌──────────────┐
         │   Vercel     │  (or Render/Railway)
         │   Backend    │  Node.js + Express
         └──┬───────┬───┘
            │       │
            │       └──────────────┐
            │                      │
            ▼                      ▼
    ┌──────────────┐      ┌──────────────┐
    │   Neon DB    │      │  Cloudinary  │
    │ (PostgreSQL) │      │     CDN      │
    └──────────────┘      └──────────────┘
         │                      │
         │                      │
         ▼                      ▼
    ┌──────────────┐      ┌──────────────┐
    │ Store:       │      │ Store:       │
    │ - posts      │      │ - images     │
    │ - likes      │      │              │
    │ - comments   │      │ Deliver:     │
    └──────────────┘      │ - Global CDN │
                          │ - WebP       │
                          │ - Optimized  │
                          └──────────────┘
```

**Benefits:**
- ✅ Stateless backend (scales horizontally)
- ✅ No filesystem (cloud storage)
- ✅ Global CDN (fast images)
- ✅ Managed services (Neon + Cloudinary)

---

## 📊 DATA FLOW SUMMARY

### Create Post
```
User Input → FormData → Express → Multer (Memory) → Cloudinary → Neon → Response
```

### Get Feed
```
Request → Express → Auth → Single SQL Query → Transform → JSON Response
```

### Like Post
```
Click → POST /like → Validate → Insert (UNIQUE) → Count → Update UI
```

### Delete Post
```
Request → Permissions → Cloudinary Delete → DB Delete (CASCADE) → Response
```

---

## 🎯 KEY DESIGN DECISIONS

### ✅ Memory Storage (Not Disk)
**Why:** Collaboration-safe, production-ready, no cleanup needed

### ✅ Cloudinary (Not Local)
**Why:** CDN delivery, auto-optimization, no server storage

### ✅ Single Feed Query
**Why:** Avoids N+1 problem, faster response times

### ✅ Cascading Deletes
**Why:** Automatic cleanup, data integrity

### ✅ Unique Constraint on Likes
**Why:** Prevents duplicate likes at database level

### ✅ Role Stored in Posts/Comments
**Why:** Avoids JOINs with users table on every feed load

---

## 🚀 SCALABILITY CONSIDERATIONS

### Current Implementation
- ✅ Pagination (limits data transfer)
- ✅ Indexed queries (fast lookups)
- ✅ CDN images (distributed load)
- ✅ Connection pooling (efficient DB usage)

### Future Optimizations
- Caching (Redis for hot posts)
- Read replicas (scale reads)
- Lazy loading (infinite scroll)
- Image lazy loading (defer below fold)

---

**Architecture Status:** ✅ PRODUCTION READY

This architecture supports thousands of concurrent users and scales horizontally.
