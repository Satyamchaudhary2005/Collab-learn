# Admin Panel Documentation

## Overview
The Admin Panel is a comprehensive database management system for the College Q&A Platform. It provides administrators with tools to manage users, questions, answers, shop items, and track redemptions.

## Access & Login

### URL
```
http://localhost:5000/admin.html
```

### Default Credentials
- **Email**: `admin@college.com`
- **Password**: `admin123`

### Changing Admin Credentials
Update the credentials in your backend `.env` file:
```
ADMIN_EMAIL=your_admin_email@college.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

## Features

### 1. Dashboard
- **Overview Statistics**: View total users, questions, answers, and redemptions
- Real-time stats update on page load
- Quick snapshot of platform activity

### 2. User Management
- **View all users** with username, email, semester, and points
- **Edit user points**: Adjust points manually for any user
- **Delete users**: Remove users from the system (with confirmation)
- **User creation date tracking**

**Actions**:
- Click "Edit" to modify user points
- Click "Delete" to remove a user

### 3. Question Management
- **View all questions** posted on the platform
- See question details: title, author, semester, number of answers
- **Delete questions**: Removes question and all related answers
- Sorted by most recent first

**Actions**:
- Click "Delete" to remove a question (confirms related answers will also be deleted)

### 4. Answer Management
- **View all answers** posted by users
- See answer details: question title, answerer, correctness status, points awarded
- **Delete answers**: Remove inappropriate or spam answers
- Track answer evaluation status

**Actions**:
- Click "Delete" to remove an answer

### 5. Shop Management
- **View all reward shop items**
- **Create new items**: Add custom rewards for users to purchase
- **Edit items**: Modify existing rewards (name, description, points, category)
- **Delete items**: Remove items from the shop

**Create/Edit Modal Fields**:
- **Name**: Item name (e.g., "Lab Access Pass")
- **Description**: Item details
- **Points Required**: Cost in points
- **Category**: Item classification (e.g., "Academic", "Dining", "Sports")

### 6. Redemption History
- **Track all purchases**: See what users have redeemed
- Includes: user name, item redeemed, points spent, redemption date
- Audit trail for accountability

## Features by Tab

| Tab | Functions | Access Level |
|-----|-----------|--------------|
| Dashboard | View stats | Admin only |
| Users | CRUD operations | Admin only |
| Questions | Delete, View | Admin only |
| Answers | Delete, View | Admin only |
| Shop | CRUD operations | Admin only |
| Purchases | View, Track | Admin only |

## API Endpoints

All endpoints require Bearer token authentication.

### Authentication
```
POST /api/admin/login
Body: { email, password }
Returns: { token, isAdmin, message }
```

### Stats
```
GET /api/admin/stats
Returns: { totalUsers, totalQuestions, totalAnswers, totalRedemptions }
```

### Users
```
GET /api/admin/users                    - Get all users
GET /api/admin/users/:id                - Get specific user
PUT /api/admin/users/:id/points         - Update user points
DELETE /api/admin/users/:id             - Delete user
```

### Questions
```
GET /api/admin/questions                - Get all questions
DELETE /api/admin/questions/:id         - Delete question & answers
```

### Answers
```
GET /api/admin/answers                  - Get all answers
DELETE /api/admin/answers/:id           - Delete answer
```

### Shop Items
```
GET /api/admin/shop                     - Get all items
POST /api/admin/shop                    - Create item
PUT /api/admin/shop/:id                 - Update item
DELETE /api/admin/shop/:id              - Delete item
```

### Purchases
```
GET /api/admin/purchases                - Get redemption history
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Change default admin credentials** immediately after setup
2. Use strong, unique passwords for admin accounts
3. Store JWT_SECRET in environment variables (not in code)
4. Use HTTPS in production to protect authentication tokens
5. Implement rate limiting for login attempts
6. Add admin IP whitelisting for extra security
7. Regular backup of database before major operations

## Mobile Responsiveness

The admin panel is fully responsive:
- **Desktop (>768px)**: Full sidebar navigation
- **Tablet (480-768px)**: Collapsible sidebar with toggle button
- **Mobile (<480px)**: Hamburger menu, optimized table layout

## Badge Tracking

The admin panel displays platform statistics including total badges awarded. Admins can review user activity that contributed to badge achievements.

## Keyboard Shortcuts (Future Enhancement)

Currently the panel supports:
- Tab navigation through all controls
- Enter to submit forms
- Escape to close modals

## Troubleshooting

### Cannot Login
- Verify credentials in backend `.env` file
- Check if backend server is running on port 5000
- Clear browser cache and cookies

### CORS Errors
- Ensure backend has CORS enabled
- Check `API_URL` in `admin.js` matches your backend URL

### Operations Not Working
- Verify admin token is valid and not expired
- Check browser console for error messages
- Ensure backend database is accessible

### Database Not Updating
- Verify database file exists at `backend/college_qa.db`
- Check file permissions on database
- Verify database tables are created

## Best Practices

1. **Regular Backups**: Backup database regularly before maintenance
2. **Audit Trail**: Review purchases and user activity regularly
3. **User Cleanup**: Remove inactive or spam users periodically
4. **Content Moderation**: Delete inappropriate questions/answers
5. **Points Management**: Monitor and adjust user points as needed
6. **Shop Updates**: Keep reward shop items fresh and relevant

## File Structure

```
frontend/
├── admin.html              - Admin panel UI
├── js/
│   └── admin.js           - Admin functionality & API calls
├── css/
│   └── admin.css          - Admin panel styling

backend/
├── routes/
│   └── admin.js           - Admin API endpoints
├── server.js              - Updated with admin routes
└── college_qa.db          - SQLite database
```

## Default Shop Items

The system comes with these default reward items:
1. Library Membership (1 Month) - 500 pts
2. Lab Access Pass - 750 pts
3. Canteen Voucher (500₹) - 300 pts
4. Sports Equipment Set - 600 pts
5. Exam Study Material - 400 pts
6. Wi-Fi Premium (1 Month) - 350 pts

You can edit or delete these and add custom items.

---

**Last Updated**: 2026-05-18
**Version**: 1.0
