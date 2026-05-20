const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get all questions or filter by semester
router.get('/', (req, res) => {
  const { semester, subject } = req.query;
  const db = req.app.locals.db;
  let query = 'SELECT q.*, u.username FROM questions q JOIN users u ON q.user_id = u.id WHERE 1=1';
  const params = [];

  if (semester) {
    query += ' AND q.semester = ?';
    params.push(semester);
  }

  if (subject) {
    query += ' AND q.subject = ?';
    params.push(subject);
  }

  query += ' ORDER BY q.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching questions' });
    }
    res.json(rows || []);
  });
});

// Get single question with answers
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
        'SELECT a.*, u.username FROM answers a JOIN users u ON a.user_id = u.id WHERE a.question_id = ? ORDER BY a.is_correct DESC, a.created_at ASC',
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
      res.status(201).json({
        message: 'Question created successfully',
        question: { id: this.lastID, title, description, semester, subject }
      });
    }
  );
});

// Delete question
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.get('SELECT user_id FROM questions WHERE id = ?', [id], (err, question) => {
    if (!question || question.user_id !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    db.run('DELETE FROM questions WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting question' });
      }
      res.json({ message: 'Question deleted successfully' });
    });
  });
});

module.exports = router;
