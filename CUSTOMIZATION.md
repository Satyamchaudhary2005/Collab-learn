# Customization Guide

This guide helps you customize the College Q&A Platform for your specific needs.

## Backend Customization

### Database Location

Edit `backend/server.js` line with `dbPath`:

```javascript
const dbPath = path.join(__dirname, 'college_qa.db');
// Change to:
const dbPath = '/custom/path/to/database.db';
```

### Port Configuration

Edit `backend/.env`:

```env
PORT=5000
# Change to:
PORT=3000
```

Or edit `backend/server.js`:

```javascript
const PORT = process.env.PORT || 5000;
// Change to:
const PORT = process.env.PORT || 3000;
```

### Points per Correct Answer

Edit `backend/routes/answers.js` in the `markCorrect` route:

```javascript
const pointsToAward = points || 50; // Default 50 points
// Change to:
const pointsToAward = points || 100; // 100 points per correct answer
```

### Sound Effects

Sound effects can be enabled/disabled by editing `frontend/js/app.js`:

```javascript
const soundEnabled = true; // Change to false to disable
```

You can also replace the sound files in `frontend/sounds/` with your own `.mp3` files.

### Dark Mode Default

To change the default theme, edit `frontend/js/app.js`:

```javascript
// Change default from 'light' to 'dark'
if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'light'); // Change to 'dark'
}
```

### Badge Thresholds

Badge requirements are defined in `backend/controllers/badge.js`. To customize:

```javascript
// Edit threshold values
const BADGE_THRESHOLDS = {
    FIRST_QUESTION: 1,
    QUESTION_MASTER: 5,
    QUESTION_GURU: 10,
    FIRST_ANSWER: 1,
    ANSWER_PRO: 10,
    ANSWER_EXPERT: 25,
    // ... change any thresholds here
};
```

### Custom Shop Items

Edit `backend/server.js` in function `insertDefaultShopItems()`:

```javascript
const items = [
    { name: 'Item Name', description: 'Description', points: 300, category: 'Category' },
    // Add more items here
];
```

**Example Custom Items:**

```javascript
const items = [
    { name: 'Free Coaching Class', description: 'One-on-one tutoring session', points: 400, category: 'Academic' },
    { name: 'Laptop Rental (1 Day)', description: 'Borrow a laptop for 24 hours', points: 800, category: 'Equipment' },
    { name: 'Exam Pass Mark Guarantee', description: 'Exam preparation package', points: 1000, category: 'Academic' },
    { name: 'Project Help Package', description: 'Get help with semester project', points: 600, category: 'Academic' },
    { name: 'Senior Mentoring (1 Month)', description: 'Monthly mentoring sessions', points: 900, category: 'Mentoring' },
];
```

### Semester Options

Currently set to 1-8. To change, edit `frontend/index.html`:

Search for:
```html
<option value="1">Semester 1</option>
<option value="2">Semester 2</option>
<!-- etc... -->
```

Change to:
```html
<option value="1">Year 1 - Term 1</option>
<option value="2">Year 1 - Term 2</option>
<!-- etc... -->
```

## Frontend Customization

### Change API URL

Edit `frontend/js/app.js` line 1:

```javascript
const API_URL = 'http://localhost:5000/api';
// Change to:
const API_URL = 'http://your-domain.com/api';
```

### Change Website Title

Edit `frontend/index.html`:

```html
<title>College Q&A - Ask & Learn Together</title>
<!-- Change to: -->
<title>Your College Name Q&A Platform</title>
```

### Change College Name

Edit `frontend/index.html` and search for:

```html
<h1>🎓 College Q&A Platform</h1>
<!-- Change to: -->
<h1>🎓 XYZ College Q&A Platform</h1>
```

Also in `frontend/js/app.js`:

```javascript
showNotification('Login successful!', 'success');
<!-- Add college name anywhere you'd like -->
```

### Change Colors

Edit `frontend/css/styles.css`:

```css
:root {
    --primary-color: #3498db;      /* Blue */
    --secondary-color: #2ecc71;    /* Green */
    --danger-color: #e74c3c;       /* Red */
    --warning-color: #f39c12;      /* Orange */
    --dark-color: #2c3e50;         /* Dark Gray */
    --light-color: #ecf0f1;        /* Light Gray */
    --text-color: #34495e;         /* Text Gray */
    --border-color: #bdc3c7;       /* Border Gray */
}
```

**Color Suggestions:**

Professional (Blue):
```css
--primary-color: #003f87;      /* Dark Blue */
--secondary-color: #0066cc;    /* Bright Blue */
```

Energetic (Orange/Purple):
```css
--primary-color: #ff6b35;      /* Orange */
--secondary-color: #a8dadc;    /* Light Purple */
```

Green (Environmental):
```css
--primary-color: #2d6a4f;      /* Dark Green */
--secondary-color: #40916c;    /* Medium Green */
```

### Change Logo/Branding

Replace emoji with actual logo. Edit `frontend/index.html`:

```html
<h1>🎓 College Q&A Platform</h1>
<!-- Change to: -->
<h1><img src="assets/logo.png" alt="Logo"> College Q&A Platform</h1>
```

Then add your logo image to `frontend/assets/` folder.

### Change Button Text

Edit relevant text throughout `frontend/index.html`:

```html
<button id="loginBtn" class="btn btn-primary">Login</button>
<!-- Change to: -->
<button id="loginBtn" class="btn btn-primary">Sign In</button>
```

### Add Navigation Links

Edit `frontend/index.html` navbar section:

```html
<a href="#home" class="nav-link">Home</a>
<a href="#questions" class="nav-link">Questions</a>
<!-- Add new link: -->
<a href="https://college.edu" class="nav-link" target="_blank">College Site</a>
```

## Database Customization

### Add New Fields to Users

Edit `backend/server.js` and modify the users table creation:

```javascript
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    semester INTEGER,
    points INTEGER DEFAULT 0,
    roll_number TEXT,           // Add new field
    department TEXT,            // Add new field
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
```

Then update the signup/login routes accordingly.

### Add New Shop Categories

Edit `backend/server.js` in `insertDefaultShopItems()`:

```javascript
const items = [
    // ... existing items ...
    { name: 'New Item', description: 'Description', points: 500, category: 'NewCategory' },
];
```

## Email Integration (Optional)

To add email notifications, install nodemailer:

```bash
npm install nodemailer
```

Then add to `backend/server.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

## Deployment Configuration

### Production Environment

Create `.env.production`:

```env
PORT=80
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production
DATABASE_URL=/var/lib/college-qa/database.db
```

### HTTPS Configuration

Use a reverse proxy like Nginx:

```nginx
server {
    listen 443 ssl;
    server_name college-qa.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
    }
}
```

## Language/Localization

To support multiple languages, create language files:

`frontend/lang/en.json`:
```json
{
    "home": "Home",
    "questions": "Questions",
    "shop": "Shop",
    "leaderboard": "Leaderboard"
}
```

Then update `frontend/js/app.js` to load appropriate language.

## Mobile App Customization

To create a mobile app version:

1. Use React Native or Flutter
2. Keep the same API endpoints
3. Customize UI for mobile
4. Add offline support
5. Add push notifications

## Admin Panel

The platform includes a full admin panel with these features:

- Dashboard with platform statistics
- User management (view, edit points, delete)
- Question moderation (view, delete)
- Answer moderation (view, delete)
- Shop management (CRUD for items)
- Redemption history tracking

### Accessing the Admin Panel

Navigate to:
```
http://localhost:5000/admin.html
```

Default credentials:
- **Email**: `admin@college.com`
- **Password**: `admin123`

### Customizing Admin Login

Edit `backend/routes/admin.js`:

```javascript
const ADMIN_EMAIL = 'admin@college.com';
const ADMIN_PASSWORD = 'admin123';
// Change to your own credentials
```

### Customizing Admin Stats

Admin dashboard stats are generated in `backend/routes/admin.js` under the `/stats` endpoint. Edit the queries to change what's displayed.

## Performance Optimization

### Database
- Add indexes on frequently queried fields
- Archive old questions periodically
- Cleanup old purchase records

### Frontend
- Minify CSS and JavaScript
- Optimize images
- Enable caching headers
- Use CDN for static files

### Backend
- Add caching layer (Redis)
- Implement rate limiting
- Use clustering for multiple cores
- Optimize database queries

## Backup & Recovery

### Automated Backups

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DB_FILE="backend/college_qa.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cp $DB_FILE $BACKUP_DIR/college_qa_$TIMESTAMP.db
echo "Backup created: college_qa_$TIMESTAMP.db"
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

## Configuration Checklist

Before deployment:

- [ ] Update API_URL in frontend
- [ ] Change default colors if desired
- [ ] Customize shop items
- [ ] Update college name/branding
- [ ] Set strong JWT secret in .env
- [ ] Configure email (optional)
- [ ] Test all features
- [ ] Set up backups
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Test on mobile devices
- [ ] Load test the application

---

For more help, see README.md or contact support.
