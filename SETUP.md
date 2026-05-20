# Environment Setup Guide

This guide will help you get the College Q&A Platform running on your system.

## Prerequisites

Before you start, make sure you have:

1. **Node.js and npm**
   - Download from https://nodejs.org/
   - Verify installation: 
     ```bash
     node --version
     npm --version
     ```

2. **A Web Browser** (Chrome, Firefox, Safari, Edge, etc.)

3. **Text Editor or IDE** (VS Code, Sublime Text, etc.)

## Step-by-Step Setup

### Step 1: Navigate to the Project

```bash
cd "c:\Users\HP\Desktop\6th sem project"
```

### Step 2: Set Up the Backend

1. Go to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
   This will install:
   - express (web framework)
   - cors (cross-origin requests)
   - sqlite3 (database)
   - bcryptjs (password hashing)
   - jsonwebtoken (authentication)
   - dotenv (environment variables)

3. Start the server:
   ```bash
   npm start
   ```

   Expected output:
   ```
   Server running on http://localhost:5000
   Connected to SQLite database
   Database tables created successfully
   ```

   **Keep this terminal open while using the application!**

### Step 3: Access the Frontend

1. **Option A - Direct File Access (Simple)**
   - Open `frontend/index.html` in your web browser
   - Double-click the file or drag it to your browser

2. **Option B - Using Python Server (Recommended)**
   - Open another terminal/command prompt
   - Navigate to the project directory:
     ```bash
     cd "c:\Users\HP\Desktop\6th sem project\frontend"
     ```
   - Start a simple server:
     ```bash
     python -m http.server 8000
     ```
   - Open browser and visit: `http://localhost:8000`

3. **Option C - Using Node.js HTTP Server**
   - In the frontend directory:
     ```bash
     npx http-server
     ```
   - Follow the instructions shown in terminal

### Step 4: Create Your First Account

1. Click "Sign Up" button
2. Fill in:
   - Username (e.g., "JohnDoe")
   - Email (e.g., "john@college.edu")
   - Password (secure password)
   - Semester (1-8)
3. Click "Sign Up"
4. You'll be logged in automatically!

### Step 5: Start Using the Platform

- **Ask Questions**: Go to Questions section → "Ask New Question"
- **Answer Questions**: Click on any question → "Post Answer"
- **Earn Points**: Get marked as correct → Earn 50 points
- **Visit Shop**: Redeem points for rewards
- **Check Leaderboard**: See top contributors
- **View Profile**: See your stats

## Configuration

### Backend Configuration

If you want to customize the backend, edit `backend/server.js`:

```javascript
const PORT = process.env.PORT || 5000;  // Change port here
```

### Database

The database is automatically created as `backend/college_qa.db`

**To reset the database:**
```bash
# Delete the file college_qa.db from the backend folder
# The database will be recreated on next server start
```

### Frontend Configuration

In `frontend/js/app.js`, update the API URL if needed:

```javascript
const API_URL = 'http://localhost:5000/api';  // Change if backend is on different port
```

## Troubleshooting

### Issue: "npm: command not found"
**Solution:** Node.js/npm is not installed. Download and install from https://nodejs.org/

### Issue: "Port 5000 already in use"
**Solution:** Either:
- Close the application using port 5000
- Or change the port in `server.js`:
  ```javascript
  const PORT = 5001;  // Use different port
  ```

### Issue: CORS error in browser console
**Solution:** Check that:
- Backend is running on `http://localhost:5000`
- Frontend is accessing from same or CORS-enabled URL
- Verify `API_URL` in `app.js` matches your backend port

### Issue: "Database connection error"
**Solution:** 
- Ensure sqlite3 is installed: `npm install sqlite3`
- Check file permissions on the backend folder
- Try deleting `college_qa.db` and restart server

### Issue: Can't login after creating account
**Solution:**
- Verify your email and password match exactly
- Check browser console for error messages
- Try creating a new account

### Issue: Page looks broken or unformatted
**Solution:**
- Hard refresh browser: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try a different browser

## Running on Different Machines

To run on a different computer in your network:

1. **Find your machine's IP:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   Look for IPv4 Address (usually 192.168.x.x)

2. **Update frontend `app.js`:**
   ```javascript
   const API_URL = 'http://192.168.x.x:5000/api';  // Use your IP
   ```

3. **Update CORS in `server.js` if needed**

4. **Access from other computer:**
   ```
   http://192.168.x.x:8000
   ```

## Production Deployment

For deploying to production:

1. Use environment variables (create `.env` file):
   ```
   PORT=5000
   JWT_SECRET=your-secret-key-here
   NODE_ENV=production
   ```

2. Use a proper database (PostgreSQL recommended)

3. Use a reverse proxy (Nginx)

4. Enable HTTPS/SSL

5. Deploy on hosting platform (Heroku, AWS, DigitalOcean, etc.)

## Additional Help

- Check console errors: Press `F12` in browser and check Console tab
- Check backend logs: Look at terminal where server is running
- Review network requests: Browser DevTools → Network tab
- Check the README.md for more information

---

**If you get stuck, check if:**
- Backend is running (terminal shows "Server running on...")
- Frontend can access backend (check browser console for errors)
- Database exists (check backend folder for `college_qa.db`)
- All dependencies are installed (`npm install` was run)

Happy coding! 🚀
