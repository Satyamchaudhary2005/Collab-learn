const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../controllers/badge');

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

// Get leaderboard with pagination
router.get('/leaderboard', (req, res) => {
  const db = req.app.locals.db;
  const { limit, page } = req.query;
  const limitNum = parseInt(limit) || 20;
  const pageNum = parseInt(page) || 1;
  const offset = (pageNum - 1) * limitNum;

  db.get('SELECT COUNT(*) as total FROM users', (err, countResult) => {
    const total = countResult ? countResult.total : 0;

    db.all(
      'SELECT id, username, semester, points FROM users ORDER BY points DESC LIMIT ? OFFSET ?',
      [limitNum, offset],
      (err, users) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching leaderboard' });
        }
        res.json({
          users: users || [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: total,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      }
    );
  });
});

// Get user's badges
router.get('/badges', verifyToken, (req, res) => {
  const db = req.app.locals.db;

  db.all(
    'SELECT * FROM badges WHERE user_id = ? ORDER BY awarded_at DESC',
    [req.userId],
    (err, badges) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching badges' });
      }
      res.json(badges || []);
    }
  );
});

// Get user's bookmarked questions
router.get('/bookmarks', verifyToken, (req, res) => {
  const db = req.app.locals.db;

  db.all(
    `SELECT q.*, u.username, b.created_at as bookmarked_at
     FROM bookmarks b
     JOIN questions q ON b.question_id = q.id
     JOIN users u ON q.user_id = u.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [req.userId],
    (err, questions) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching bookmarks' });
      }
      res.json(questions || []);
    }
  );
});

// Check and award badges (can be called after any action)
router.post('/check-badges', verifyToken, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;

  // Gather stats for badge checking
  db.get('SELECT points FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return res.status(404).json({ message: 'User not found' });

    db.get('SELECT COUNT(*) as total FROM questions WHERE user_id = ?', [userId], (err, qCount) => {
      const totalQuestions = qCount ? qCount.total : 0;

      db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ?', [userId], (err, aCount) => {
        const totalAnswers = aCount ? aCount.total : 0;

        db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ? AND is_correct = 1', [userId], (err, cCount) => {
          const correctAnswers = cCount ? cCount.total : 0;

          db.get('SELECT COUNT(DISTINCT subject) as total FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.user_id = ?', [userId], (err, sCount) => {
            const subjectsAnswered = sCount ? sCount.total : 0;

            db.get('SELECT position FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC) as position FROM users) ranked WHERE id = ?', [userId], (err, rankRow) => {
              const leaderboardRank = rankRow ? rankRow.position : 999;

              checkAndAwardBadges(userId, db, {
                totalQuestions,
                totalAnswers,
                correctAnswers,
                points: user.points,
                subjectsAnswered,
                leaderboardRank
              }, (err, awarded) => {
                if (err) return res.status(500).json({ message: 'Error checking badges' });
                res.json({
                  message: awarded.length > 0 ? `New badges awarded: ${awarded.join(', ')}` : 'No new badges',
                  awarded
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
