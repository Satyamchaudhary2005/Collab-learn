const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', (req, res) => {
  const { username, email, password, semester } = req.body;
  const db = req.app.locals.db;

  if (!username || !email || !password || !semester) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, email, password, semester) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, semester],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'User already exists or invalid data' });
      }
      
      const token = jwt.sign(
        { id: this.lastID, username, email, semester },
        process.env.JWT_SECRET || 'college-qa-secret-key'
      );
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: this.lastID, username, email, semester, points: 0 }
      });
    }
  );
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, semester: user.semester },
      process.env.JWT_SECRET || 'college-qa-secret-key'
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        semester: user.semester,
        points: user.points
      }
    });
  });
});

module.exports = router;
