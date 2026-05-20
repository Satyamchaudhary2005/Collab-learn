const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get current user profile
router.get('/profile', verifyToken, (req, res) => {
  const db = req.app.locals.db;

  db.get(
    'SELECT id, username, email, semester, points, created_at FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Get user's questions
router.get('/questions', verifyToken, (req, res) => {
  const db = req.app.locals.db;

  db.all(
    'SELECT * FROM questions WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, questions) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching questions' });
      }
      res.json(questions || []);
    }
  );
});

// Get user's answers
router.get('/answers', verifyToken, (req, res) => {
  const db = req.app.locals.db;

  db.all(
    'SELECT a.*, q.title as question_title FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.user_id = ? ORDER BY a.created_at DESC',
    [req.userId],
    (err, answers) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching answers' });
      }
      res.json(answers || []);
    }
  );
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  const db = req.app.locals.db;
  const { limit } = req.query;
  const limitNum = limit || 20;

  db.all(
    'SELECT id, username, semester, points FROM users ORDER BY points DESC LIMIT ?',
    [limitNum],
    (err, users) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching leaderboard' });
      }
      res.json(users || []);
    }
  );
});

module.exports = router;
