# 🚀 Quick Start Guide

Get the College Q&A Platform running in 5 minutes!

## Prerequisites Check

- ✅ Node.js installed? → `node --version`
- ✅ Web browser installed? → Any modern browser works
- ✅ Working in project folder? → `c:\Users\HP\Desktop\6th sem project`

## Fast Setup (Windows)

### 1. Open Command Prompt (Press Windows + R, type `cmd`)

```cmd
cd C:\Users\HP\Desktop\6th sem project\backend
npm install
npm start
```

Wait for: `Server running on http://localhost:5000`

### 2. Open Another Command Prompt

```cmd
cd C:\Users\HP\Desktop\6th sem project\frontend
python -m http.server 8000
```

### 3. Open Your Browser

Go to: `http://localhost:8000`

## Fast Setup (Mac/Linux)

### 1. Open Terminal

```bash
cd ~/Desktop/"6th sem project"/backend
npm install
npm start
```

### 2. Open Another Terminal

```bash
cd ~/Desktop/"6th sem project"/frontend
python3 -m http.server 8000
```

### 3. Open Browser

Visit: `http://localhost:8000`

## First Time Using?

1. **Sign Up** with your details
2. **Select your semester** (1-8)
3. **Ask a question** about your course
4. **Answer someone else's question**
5. **Get marked as correct** → Earn points!
6. **Redeem points** in the shop

## Key Features

| Feature | How to Use |
|---------|-----------|
| 📚 Ask Questions | Questions → Ask New Question |
| 💡 Answer | Click question → Post Answer |
| ⭐ Earn Points | Get your answer marked correct |
| 🎁 Redeem Rewards | Rewards Shop → Redeem Now |
| 🏆 See Rankings | Leaderboard tab |
| 👤 Your Stats | Click Profile |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| npm not found | Install Node.js from nodejs.org |
| Port already in use | Close other apps or use different port |
| Page looks broken | Press Ctrl+F5 to refresh |
| Can't login | Check email/password match signup |
| No backend connection | Check backend terminal - must say "Server running" |

## Need More Help?

- See `SETUP.md` for detailed setup instructions
- See `README.md` for full documentation
- Check browser console (F12) for error messages

## Common Tasks

### Stop the server
Press `Ctrl+C` in the command prompt

### Reset database
Delete `backend/college_qa.db` and restart server

### Change port
Edit `backend/server.js` line with `const PORT`

### Customize shop items
Edit `backend/server.js` function `insertDefaultShopItems()`

---

**That's it! You're ready to go! 🎓**

Start by signing up and asking your first question.
