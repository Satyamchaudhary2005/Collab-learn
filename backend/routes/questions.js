const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../controllers/badge');

// Get all questions or filter by semester, subject, search with pagination
router.get('/', (req, res) => {
  const { semester, subject, search, page, limit } = req.query;
  const db = req.app.locals.db;
  
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  let query = 'SELECT q.*, u.username FROM questions q JOIN users u ON q.user_id = u.id WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM questions q WHERE 1=1';
  const params = [];
  const countParams = [];

  if (semester) {
    query += ' AND q.semester = ?';
    countQuery += ' AND q.semester = ?';
    params.push(semester);
    countParams.push(semester);
  }

  if (subject) {
    query += ' AND q.subject = ?';
    countQuery += ' AND q.subject = ?';
    params.push(subject);
    countParams.push(subject);
  }

  if (search) {
    query += ' AND (q.title LIKE ? OR q.description LIKE ? OR q.subject LIKE ?)';
    countQuery += ' AND (q.title LIKE ? OR q.description LIKE ? OR q.subject LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Error counting questions' });
    }
    const total = countResult ? countResult.total : 0;

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching questions' });
      }
      res.json({
        questions: rows || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    });
  });
});

// Get single question with answers and vote counts
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.get(
    'SELECT q.*, u.username FROM questions q JOIN users u ON q.user_id = u.id WHERE q.id = ?',
    [id],
    (err, question) => {
      if (err || !question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      db.all(
        `SELECT a.*, u.username,
          (SELECT COUNT(*) FROM answer_votes WHERE answer_id = a.id AND vote_type = 'up') as upvotes,
          (SELECT COUNT(*) FROM answer_votes WHERE answer_id = a.id AND vote_type = 'down') as downvotes
         FROM answers a JOIN users u ON a.user_id = u.id
         WHERE a.question_id = ?
         ORDER BY a.is_correct DESC, a.created_at ASC`,
        [id],
        (err, answers) => {
          res.json({ ...question, answers: answers || [] });
        }
      );
    }
  );
});

// Create new question
router.post('/', verifyToken, (req, res) => {
  const { title, description, semester, subject } = req.body;
  const db = req.app.locals.db;

  if (!title || !description || !semester) {
    return res.status(400).json({ message: 'Title, description, and semester required' });
  }

  db.run(
    'INSERT INTO questions (user_id, title, description, semester, subject) VALUES (?, ?, ?, ?, ?)',
    [req.userId, title, description, semester, subject || 'General'],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating question' });
      }

      const questionId = this.lastID;

      // Check and award badges for the question author
      const userId = req.userId;
      db.get('SELECT points FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
          return res.status(201).json({
            message: 'Question created successfully',
            question: { id: questionId, title, description, semester, subject }
          });
        }

        db.get('SELECT COUNT(*) as total FROM questions WHERE user_id = ?', [userId], (err, qCount) => {
          const totalQuestions = qCount ? qCount.total : 0;
          db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ?', [userId], (err, aCount) => {
            const totalAnswers = aCount ? aCount.total : 0;
            db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ? AND is_correct = 1', [userId], (err, cCount) => {
              const correctAnswers = cCount ? cCount.total : 0;
              db.get('SELECT COUNT(DISTINCT q.subject) as total FROM questions q WHERE q.user_id = ? AND q.subject IS NOT NULL AND q.subject != ""', [userId], (err, subjCount) => {
                const subjectsAnswered = subjCount ? subjCount.total : 0;
                checkAndAwardBadges(userId, db, {
                  totalQuestions,
                  totalAnswers,
                  correctAnswers,
                  points: user.points,
                  subjectsAnswered,
                  leaderboardRank: 999
                }, (err, awarded) => {
                  res.status(201).json({
                    message: 'Question created successfully',
                    question: { id: questionId, title, description, semester, subject },
                    awardedBadges: awarded && awarded.length > 0 ? awarded : []
                  });
                });
              });
            });
          });
        });
      });
    }
  );
});

// Delete question (owner only) — cleans up related data
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.get('SELECT user_id FROM questions WHERE id = ?', [id], (err, question) => {
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.user_id !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized: only the question author can delete this' });
    }

    // Clean up related data in sequence
    db.run('DELETE FROM bookmarks WHERE question_id = ?', [id]);
    db.run('DELETE FROM answer_votes WHERE answer_id IN (SELECT id FROM answers WHERE question_id = ?)', [id]);
    db.run('DELETE FROM answers WHERE question_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting related answers' });
      }

      db.run('DELETE FROM questions WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting question' });
        }
        res.json({ message: 'Question and all related data deleted successfully' });
      });
    });
  });
});

// Bookmark a question
router.post('/:id/bookmark', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.run(
    'INSERT OR IGNORE INTO bookmarks (user_id, question_id) VALUES (?, ?)',
    [req.userId, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error bookmarking question' });
      }
      res.json({ message: 'Question bookmarked', bookmarked: true });
    }
  );
});

// Unbookmark a question
router.delete('/:id/bookmark', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.run(
    'DELETE FROM bookmarks WHERE user_id = ? AND question_id = ?',
    [req.userId, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error removing bookmark' });
      }
      res.json({ message: 'Bookmark removed', bookmarked: false });
    }
  );
});

// Check if question is bookmarked by current user
router.get('/:id/bookmark/check', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.get(
    'SELECT id FROM bookmarks WHERE user_id = ? AND question_id = ?',
    [req.userId, id],
    (err, row) => {
      res.json({ bookmarked: !!row });
    }
  );
});

module.exports = router;
