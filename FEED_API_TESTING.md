# FEED API TESTING GUIDE

## 🧪 Test the Feed System

This guide helps you test all feed endpoints before frontend integration.

---

## ✅ PREREQUISITES

1. **Server running:**
```bash
cd server
npm run dev
```

2. **Valid JWT token:**
   - Login as student or alumni
   - Copy the JWT token from response

3. **Set token variable (for testing):**
```bash
# Replace with your actual token
TOKEN="your-jwt-token-here"
```

---

## 📝 TEST SCENARIOS

### 1️⃣ Create Text-Only Post

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=This is my first post on SETU! Excited to connect with everyone."
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "post_id": 1,
    "user_id": 123,
    "user_role": "student",
    "content": "This is my first post on SETU!...",
    "image_url": null,
    "created_at": "2026-01-12T...",
    "likes_count": 0,
    "comments_count": 0,
    "is_liked": false
  }
}
```

---

### 2️⃣ Create Post with Image

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=Check out this amazing view!" \
  -F "image=@/path/to/your/image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "post_id": 2,
    "user_id": 123,
    "user_role": "student",
    "content": "Check out this amazing view!",
    "image_url": "https://res.cloudinary.com/demo/image/upload/v1234567/setu/posts/abc123.jpg",
    "created_at": "2026-01-12T...",
    "likes_count": 0,
    "comments_count": 0,
    "is_liked": false
  }
}
```

---

### 3️⃣ Get Feed (Paginated)

```bash
curl http://localhost:5000/api/posts?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "posts": [
    {
      "post_id": 2,
      "user_id": 123,
      "user_role": "student",
      "content": "Check out this amazing view!",
      "image_url": "https://res.cloudinary.com/...",
      "created_at": "2026-01-12T10:30:00Z",
      "likes_count": 0,
      "comments_count": 0,
      "is_liked": false
    },
    {
      "post_id": 1,
      "user_id": 123,
      "user_role": "student",
      "content": "This is my first post on SETU!...",
      "image_url": null,
      "created_at": "2026-01-12T10:25:00Z",
      "likes_count": 0,
      "comments_count": 0,
      "is_liked": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalPosts": 2,
    "hasMore": false
  }
}
```

---

### 4️⃣ Like a Post

```bash
curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "likes_count": 1
}
```

**Try liking again (should fail):**
```bash
curl -X POST http://localhost:5000/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Error:**
```json
{
  "success": false,
  "message": "You have already liked this post"
}
```

---

### 5️⃣ Unlike a Post

```bash
curl -X DELETE http://localhost:5000/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Post unliked successfully",
  "likes_count": 0
}
```

---

### 6️⃣ Add a Comment

```bash
curl -X POST http://localhost:5000/api/posts/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment_text": "Great post! Really inspiring."}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "comment_id": 1,
    "post_id": 1,
    "user_id": 123,
    "user_role": "student",
    "comment_text": "Great post! Really inspiring.",
    "created_at": "2026-01-12T10:35:00Z"
  }
}
```

---

### 7️⃣ Get Comments

```bash
curl http://localhost:5000/api/posts/1/comments \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "comments": [
    {
      "comment_id": 1,
      "post_id": 1,
      "user_id": 123,
      "user_role": "student",
      "comment_text": "Great post! Really inspiring.",
      "created_at": "2026-01-12T10:35:00Z"
    }
  ]
}
```

---

### 8️⃣ Delete a Post

```bash
curl -X DELETE http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

**If not the author:**
```json
{
  "success": false,
  "message": "You do not have permission to delete this post"
}
```

---

## 🔴 ERROR SCENARIOS

### Missing Token
```bash
curl http://localhost:5000/api/posts
```
**Response:** `401 - Access denied. No token provided.`

---

### Invalid Content
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "content="
```
**Response:** `400 - Post content is required`

---

### Invalid Image Type
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "content=Test" \
  -F "image=@document.pdf"
```
**Response:** `400 - Invalid file type`

---

### Post Not Found
```bash
curl http://localhost:5000/api/posts/99999/comments \
  -H "Authorization: Bearer $TOKEN"
```
**Response:** `404 - Post not found`

---

## 🧑‍💻 POSTMAN COLLECTION

### Create Post
- **Method:** POST
- **URL:** `http://localhost:5000/api/posts`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
- **Body (form-data):**
  - `content` (text): "Your post content"
  - `image` (file): Select image file

### Get Feed
- **Method:** GET
- **URL:** `http://localhost:5000/api/posts?page=1&limit=10`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

### Like Post
- **Method:** POST
- **URL:** `http://localhost:5000/api/posts/1/like`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

### Add Comment
- **Method:** POST
- **URL:** `http://localhost:5000/api/posts/1/comments`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "comment_text": "Great post!"
  }
  ```

---

## 📊 DATABASE VERIFICATION

Check data directly in Neon DB:

```sql
-- View all posts
SELECT * FROM posts ORDER BY created_at DESC;

-- View post with counts
SELECT 
  p.*,
  COUNT(DISTINCT pl.like_id) AS likes,
  COUNT(DISTINCT pc.comment_id) AS comments
FROM posts p
LEFT JOIN post_likes pl ON p.post_id = pl.post_id
LEFT JOIN post_comments pc ON p.post_id = pc.post_id
GROUP BY p.post_id;

-- View all likes
SELECT * FROM post_likes;

-- View all comments
SELECT * FROM post_comments ORDER BY created_at;
```

---

## ✅ COMPLETE TEST CHECKLIST

- [ ] Create text-only post
- [ ] Create post with image
- [ ] Verify image uploaded to Cloudinary
- [ ] Get paginated feed
- [ ] Like a post
- [ ] Unlike a post
- [ ] Prevent duplicate likes
- [ ] Add comment
- [ ] Get comments
- [ ] Delete own post
- [ ] Verify cascading delete (likes/comments removed)
- [ ] Test pagination (page 2, 3, etc.)
- [ ] Test as different users
- [ ] Test admin delete permissions
- [ ] Test invalid token
- [ ] Test missing required fields
- [ ] Test invalid file types

---

## 🎯 SUCCESS CRITERIA

✅ All endpoints return correct status codes  
✅ Image URLs are Cloudinary links (not local paths)  
✅ Feed ordered by newest first  
✅ Likes/comments counts accurate  
✅ `is_liked` reflects current user status  
✅ Cascading deletes work properly  
✅ Permissions enforced correctly  
✅ Error messages are clear and helpful  

---

**Ready for frontend integration!** 🚀
