# College Q&A Platform

A full-stack web application for college students to ask questions, get answers, earn points, and redeem rewards.

## Features

✨ **Key Features:**
- **Ask & Answer Questions**: Post questions by semester and help fellow students
- **Points System**: Earn points for providing correct answers
- **Rewards Shop**: Redeem earned points for real rewards (canteen vouchers, library access, etc.)
- **Leaderboard**: Compete with peers and see top contributors
- **User Profiles**: Track your questions, answers, and points
- **Semester Filtering**: Filter questions by semester for better organization
- **Search**: Search questions by title, description, or subject
- **Pagination**: Navigate through questions and leaderboard with pagination
- **Answer Voting**: Upvote/downvote answers
- **Bookmarks**: Save questions to revisit later
- **Badges & Achievements**: Earn badges for contributions
- **Delete Your Questions**: Delete your own questions (cleans up all related data)
- **Delete Your Answers**: Delete your own answers
- **Password Reset**: Forgot password flow with secure token
- **Dark Mode**: Toggle dark/light theme
- **Sound Effects**: Audio feedback for actions
- **Admin Panel**: Full admin interface for managing users, questions, answers, and shop
- **Authentication**: Secure login and registration system

## Project Structure

```
college-qa-platform/
├── backend/
│   ├── server.js              # Main Express server
│   ├── package.json           # Node dependencies
│   ├── college_qa.db          # SQLite database (auto-created)
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── routes/
│       ├── auth.js            # Login & signup
│       ├── questions.js       # Questions CRUD
│       ├── answers.js         # Answers & points system
│       ├── shop.js            # Shop & redemptions
│       └── users.js           # User profiles & leaderboard
└── frontend/
    ├── index.html             # Main HTML file
    ├── css/
    │   └── styles.css         # All styling
    └── js/
        └── app.js             # Frontend logic
```

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Open the frontend:**
   - Open `frontend/index.html` in a web browser
   - Or use a local server (recommended for CORS):
     ```bash
     python -m http.server 8000
     ```
   Then visit `http://localhost:8000/frontend/`

## How to Use

### 1. **Authentication**
- Click "Sign Up" to create a new account
- Select your semester during registration
- Use "Login" to sign in with your credentials

### 2. **Ask a Question**
- Click "Ask New Question" in the Questions section
- Fill in the title, description, and select your semester
- Questions are visible to all users of your semester and others

### 3. **Answer Questions**
- Browse questions in the Questions section
- Click on any question to view details and answers
- Click "Post Answer" to provide your answer
- Help your peers get clarity!

### 4. **Earn Points**
- When you provide a correct answer, the question asker can mark it as "Correct"
- You receive 50 points (default) for each correct answer
- More points = higher ranking on the leaderboard!

### 5. **Redeem Rewards**
- Visit the "Rewards Shop" to see available items
- Each item requires a certain number of points
- Click "Redeem Now" to exchange your points for rewards
- View your redemption history anytime

### 6. **View Your Profile**
- Click your profile to see:
  - Total points earned
  - Number of questions asked
  - Number of answers given
  - All your questions and answers

### 7. **Check Leaderboard**
- See the top contributors across the platform
- Rankings are based on total points earned
- Gold, Silver, and Bronze badges for top 3

## API Endpoints (43 Total)

### Authentication (5)
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset token
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-reset-token/:token` - Check if reset token is valid

### Questions (7)
- `GET /api/questions` - Get all questions (with optional semester filter, search, pagination)
- `GET /api/questions/:id` - Get specific question with answers & vote counts
- `POST /api/questions` - Create new question (requires auth)
- `DELETE /api/questions/:id` - Delete question (requires auth, cleans up related data)
- `POST /api/questions/:id/bookmark` - Bookmark a question (requires auth)
- `DELETE /api/questions/:id/bookmark` - Remove bookmark (requires auth)
- `GET /api/questions/:id/bookmark/check` - Check if bookmarked

### Answers (6)
- `GET /api/answers` - Get all answers
- `POST /api/answers` - Post answer (requires auth)
- `PUT /api/answers/:id/mark-correct` - Mark answer as correct (requires auth)
- `DELETE /api/answers/:id` - Delete answer (requires auth)
- `POST /api/answers/:id/vote` - Vote on answer (up/down, requires auth)
- `GET /api/answers/:id/votes` - Get vote counts for an answer

### Shop (3)
- `GET /api/shop/items` - Get all shop items
- `POST /api/shop/redeem` - Redeem an item (requires auth)
- `GET /api/shop/history` - Get user's redemption history (requires auth)

### Users (7)
- `GET /api/users/profile` - Get current user profile (requires auth)
- `GET /api/users/questions` - Get user's questions (requires auth)
- `GET /api/users/answers` - Get user's answers (requires auth)
- `GET /api/users/leaderboard` - Get top contributors (with pagination)
- `GET /api/users/badges` - Get user's earned badges (requires auth)
- `GET /api/users/bookmarks` - Get user's bookmarked questions (requires auth)
- `POST /api/users/check-badges` - Manually check & award badges (requires auth)

### Admin (15)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get specific user
- `PUT /api/admin/users/:id/points` - Update user points
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/questions` - Get all questions
- `DELETE /api/admin/questions/:id` - Delete question & answers
- `GET /api/admin/answers` - Get all answers
- `DELETE /api/admin/answers/:id` - Delete answer
- `GET /api/admin/shop` - Get all shop items
- `POST /api/admin/shop` - Create shop item
- `PUT /api/admin/shop/:id` - Update shop item
- `DELETE /api/admin/shop/:id` - Delete shop item
- `GET /api/admin/purchases` - Get redemption history

## Default Shop Items

The following items are available in the shop:

| Item | Points Required | Category |
|------|-----------------|----------|
| Library Membership (1 Month) | 500 | Academic |
| Lab Access Pass | 750 | Academic |
| Canteen Voucher (500₹) | 300 | Dining |
| Sports Equipment Set | 600 | Sports |
| Exam Study Material | 400 | Academic |
| Wi-Fi Premium (1 Month) | 350 | Utilities |

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with responsive design
- **Vanilla JavaScript** - Interactivity

## Key Features Details

### Points System
- **Default Points**: 50 points per correct answer
- **Customizable**: Points can be adjusted when marking answers as correct
- **Transparent**: Users can see points awarded for each answer

### Security
- Passwords are hashed using bcryptjs
- JWT tokens for secure authentication
- User-specific data protection on all endpoints

### Responsive Design
- Mobile-friendly interface
- Optimized for all screen sizes
- Touch-friendly buttons and forms

## Troubleshooting

### Backend won't start
- Ensure Node.js is installed: `node --version`
- Check if port 5000 is available
- Try: `npm install` again to ensure all dependencies are installed

### CORS errors
- Backend CORS is enabled for frontend
- If using different ports, ensure they match the API_URL in app.js

### Database issues
- The database is auto-created on first run
- Delete `college_qa.db` to reset the database (WARNING: loses all data)

## Future Enhancements

- [ ] Email notifications for answered questions
- [ ] Real-time notifications
- [ ] Comment threads on answers
- [ ] User messaging system
- [ ] Mobile app version
- [ ] File/image uploads for questions
- [ ] Rich text editor for answers

## License

MIT License - Feel free to use and modify for your college

## Support

For issues or questions, please contact the development team or file an issue in the repository.

---

**Enjoy learning and helping others! 🎓**
