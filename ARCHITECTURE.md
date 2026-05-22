# 🏗️ System Architecture & Data Flow

This document describes the architecture of the College Q&A Platform.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Frontend (HTML/CSS/JavaScript)                            │ │
│  │  ├── Authentication Pages (Login/Signup)                  │ │
│  │  ├── Questions Section                                    │ │
│  │  ├── Answers & Discussion                                 │ │
│  │  ├── Rewards Shop                                         │ │
│  │  ├── Leaderboard                                          │ │
│  │  └── User Profile                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTP/REST API
                   │ JSON Requests/Responses
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes (43 Endpoints)                               │   │
│  │ ├── /api/auth (Register/Login/Password Reset)            │   │
│  │ ├── /api/questions (CRUD/Bookmark/Search/Pagination)     │   │
│  │ ├── /api/answers (Create/Vote/Mark Correct/Delete)      │   │
│  │ ├── /api/shop (View Items/Redeem)                       │   │
│  │ ├── /api/users (Profile/Leaderboard/Badges/Bookmarks)   │   │
│  │ └── /api/admin (Stats/Users/Questions/Answers/Shop)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware                                              │   │
│  │ ├── CORS Handler                                        │   │
│  │ ├── JWT Authentication                                  │   │
│  │ └── Request Validation                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Business Logic                                          │   │
│  │ ├── Points System                                       │   │
│  │ ├── User Authentication                                │   │
│  │ ├── Points Validation                                  │   │
│  │ └── Data Processing                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────────┘
                   │ SQL Queries
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tables (9 total)                                         │   │
│  │ ├── users (id, username, email, semester, points)      │   │
│  │ ├── questions (id, user_id, title, description, ...)   │   │
│  │ ├── answers (id, question_id, user_id, content, ...)   │   │
│  │ ├── shop_items (id, name, points_required, ...)        │   │
│  │ ├── purchases (id, user_id, item_id, points_spent)     │   │
│  │ ├── badges (id, user_id, badge_name, badge_key, ...)   │   │
│  │ ├── bookmarks (id, user_id, question_id)               │   │
│  │ ├── answer_votes (id, user_id, answer_id, vote_type)   │   │
│  │ └── password_resets (id, user_id, token, expires_at)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ File: college_qa.db (SQLite Database)                   │   │
│  │ Location: backend/college_qa.db                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### User Registration Flow

```
┌─────────────────┐
│  User Signup    │ (Enter credentials, semester)
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Validate Input                  │
│ ├── Check username unique       │
│ ├── Check email valid           │
│ └── Check all fields present    │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Hash Password (bcryptjs)        │
│ ├── Generate salt (10 rounds)   │
│ └── Create hash                 │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Store in Database               │
│ INSERT users table              │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Generate JWT Token              │
│ ├── Encode user data            │
│ └── Sign with secret            │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Return to Frontend              │
│ ├── Token (localStorage)        │
│ ├── User data                   │
│ └── Success message             │
└─────────────────────────────────┘
```

### Question & Answer Flow

```
┌──────────────────────────────────────────────────┐
│ User Creates Question                            │
│ ├── Title, Description, Semester, Subject       │
│ └── Requires: Authenticated user                │
└──────────────┬───────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────┐
│ Validate & Store Question                       │
│ ├── Extract user_id from JWT                    │
│ ├── Insert into questions table                 │
│ └── Return question_id                          │
└──────────────┬───────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────┐
│ Question Visible to All Users                   │
│ ├── Display with author name                    │
│ ├── Show semester                               │
│ └── Allow filtering                             │
└──────────────┬───────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────┐
│ Other Users View & Answer                       │
│ ├── Can post answer                             │
│ ├── Answer stored with user_id                  │
│ └── Linked to question_id                       │
└──────────────┬───────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────┐
│ Question Asker Reviews Answers                  │
│ ├── Click "Mark Correct"                        │
│ ├── Choose points to award (default: 50)        │
│ └── Confirm action                              │
└──────────────┬───────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────┐
│ Award Points to Answer Author                   │
│ ├── Set is_correct = 1                          │
│ ├── Set points_awarded = amount                 │
│ └── Add points to user's account                │
└──────────────┬───────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────┐
│ Answer Author Sees Points                       │
│ ├── In profile                                  │
│ ├── In leaderboard                              │
│ └── In shop (can redeem)                        │
└──────────────────────────────────────────────────┘
```

### Points & Redemption Flow

```
┌──────────────────────────────┐
│ User Earns Points            │
│ ├── Get answer marked correct│
│ ├── +50 points awarded       │
│ └── Update users.points      │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ View Shop Items              │
│ ├── GET /api/shop/items      │
│ ├── Display items            │
│ └── Show requirements        │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Select Item to Redeem        │
│ ├── Check points required    │
│ ├── Validate user has enough │
│ └── Click "Redeem Now"       │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Process Redemption           │
│ ├── Create purchase record   │
│ ├── Deduct points            │
│ └── Update user.points       │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ Confirm to User              │
│ ├── Show success             │
│ ├── Show points remaining    │
│ └── Update display           │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│ View Purchase History        │
│ ├── All redemptions          │
│ ├── Item names               │
│ ├── Points spent             │
│ └── Date redeemed            │
└──────────────────────────────┘
```

## Database Schema

### Users Table
```
users
├── id (INTEGER PRIMARY KEY)
├── username (TEXT UNIQUE)
├── email (TEXT UNIQUE)
├── password (TEXT - hashed)
├── semester (INTEGER 1-8)
├── points (INTEGER DEFAULT 0)
└── created_at (DATETIME)
```

### Questions Table
```
questions
├── id (INTEGER PRIMARY KEY)
├── user_id (FK → users.id)
├── title (TEXT)
├── description (TEXT)
├── semester (INTEGER 1-8)
├── subject (TEXT)
└── created_at (DATETIME)
```

### Answers Table
```
answers
├── id (INTEGER PRIMARY KEY)
├── question_id (FK → questions.id)
├── user_id (FK → users.id)
├── content (TEXT)
├── is_correct (BOOLEAN)
├── points_awarded (INTEGER)
└── created_at (DATETIME)
```

### Shop Items Table
```
shop_items
├── id (INTEGER PRIMARY KEY)
├── name (TEXT)
├── description (TEXT)
├── points_required (INTEGER)
├── image_url (TEXT)
└── category (TEXT)
```

### Purchases Table
```
purchases
├── id (INTEGER PRIMARY KEY)
├── user_id (FK → users.id)
├── item_id (FK → shop_items.id)
├── points_spent (INTEGER)
└── redeemed_at (DATETIME)
```

### Badges Table
```
badges
├── id (INTEGER PRIMARY KEY)
├── user_id (FK → users.id)
├── badge_name (TEXT)
├── badge_key (TEXT)
├── description (TEXT)
├── icon (TEXT)
└── awarded_at (DATETIME)
```

### Bookmarks Table
```
bookmarks
├── id (INTEGER PRIMARY KEY)
├── user_id (FK → users.id)
├── question_id (FK → questions.id)
├── created_at (DATETIME)
└── UNIQUE(user_id, question_id)
```

### Answer Votes Table
```
answer_votes
├── id (INTEGER PRIMARY KEY)
├── user_id (FK → users.id)
├── answer_id (FK → answers.id)
├── vote_type (TEXT CHECK: 'up' or 'down')
├── created_at (DATETIME)
└── UNIQUE(user_id, answer_id)
```

### Password Resets Table
```
password_resets
├── id (INTEGER PRIMARY KEY)
├── user_id (FK → users.id)
├── token (TEXT)
├── expires_at (DATETIME)
├── used (INTEGER DEFAULT 0)
└── created_at (DATETIME)
```

## API Request/Response Flow

### Example: Post Answer

**Request:**
```http
POST /api/answers
Content-Type: application/json
Authorization: Bearer [JWT_TOKEN]

{
    "question_id": 5,
    "content": "To solve this, you need to..."
}
```

**Backend Processing:**
1. Verify JWT token
2. Extract user_id from token
3. Validate question_id exists
4. Validate content is not empty
5. Insert into answers table
6. Return success response

**Response:**
```json
{
    "message": "Answer posted successfully",
    "answer": {
        "id": 12,
        "question_id": 5,
        "user_id": 3,
        "content": "To solve this...",
        "is_correct": 0
    }
}
```

## Security Flow

```
User Input → Validation → SQL Injection Prevention → Database
     ↓
  Sanitize
     ↓
  Escape
     ↓
  Parameterized Query
     ↓
  Safe to Database
```

### Authentication Flow

```
1. User enters credentials
   ↓
2. Frontend sends to /auth/login
   ↓
3. Backend looks up user
   ↓
4. Compare password with hash (bcryptjs)
   ↓
5. Password matches?
   ├─ YES → Generate JWT
   │         Return token
   │         Store in localStorage
   └─ NO  → Return error
```

### Token Verification

```
Request → Extract token from header
   ↓
Verify token signature
   ↓
Check token expiration
   ↓
Valid?
├─ YES → Extract user_id
│         Allow request
└─ NO  → Return 401 Unauthorized
```

## Leaderboard Ranking

```
All Users
   ↓
Query: SELECT * FROM users ORDER BY points DESC
   ↓
Sort by points (highest first)
   ↓
Assign ranks
├─ Rank 1 → Gold Badge (🥇)
├─ Rank 2 → Silver Badge (🥈)
├─ Rank 3 → Bronze Badge (🥉)
└─ Rank 4+ → Number only
   ↓
Display to user
```

## Performance Considerations

```
Frontend
├── LocalStorage caching
├── Lazy loading of data
├── Pagination for lists
└── Throttled API calls

Backend
├── Database indexing
├── Query optimization
├── Connection pooling
└── Rate limiting

Database
├── Indexed user lookups
├── Indexed question queries
├── Indexed answer lookups
└── Archive old records
```

## Scalability Path

```
Current (Single Server)
    ↓
Add: Database replication
    ↓
Add: Redis caching layer
    ↓
Add: Load balancer
    ↓
Add: Multiple backend instances
    ↓
Add: CDN for static files
    ↓
Production-Ready at Scale
```

## Error Handling

```
Request → Try to process
          ↓
        Error?
        ├─ Validation error (400)
        ├─ Authentication error (401)
        ├─ Authorization error (403)
        ├─ Not found error (404)
        └─ Server error (500)
        ↓
Return JSON error response
        ↓
Frontend shows notification
        ↓
User sees helpful message
```

## Module Dependencies

```
Backend
├── express (web framework)
├── cors (cross-origin)
├── sqlite3 (database driver)
├── bcryptjs (password hashing)
├── jsonwebtoken (authentication)
└── dotenv (environment config)

Frontend
├── No external dependencies!
└── Pure HTML/CSS/JavaScript
    ├── Fetch API (HTTP)
    └── LocalStorage (session)
```

---

This architecture ensures:
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ User Experience
