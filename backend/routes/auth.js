const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

// Forgot password - generate reset token
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const db = req.app.locals.db;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      // Don't reveal whether the email exists for security
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    db.run(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error generating reset token' });
        }
        // In production, send this via email. For now, return it directly.
        res.json({
          message: 'If that email is registered, a reset link has been sent.',
          // In development, include the token for testing
          ...(process.env.NODE_ENV !== 'production' && { resetToken: token })
        });
      }
    );
  });
});

// Reset password using token
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const db = req.app.locals.db;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  db.get(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
    [token],
    (err, reset) => {
      if (err || !reset) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.user_id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error resetting password' });
        }

        db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id], (err) => {
          res.json({ message: 'Password reset successful. You can now log in.' });
        });
      });
    }
  );
});

// Verify reset token validity
router.get('/verify-reset-token/:token', (req, res) => {
  const { token } = req.params;
  const db = req.app.locals.db;

  db.get(
    'SELECT id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
    [token],
    (err, reset) => {
      if (err || !reset) {
        return res.status(400).json({ valid: false, message: 'Invalid or expired token' });
      }
      res.json({ valid: true });
    }
  );
});

module.exports = router;
