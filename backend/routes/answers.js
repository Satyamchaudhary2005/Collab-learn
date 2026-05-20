const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Post answer to question
router.post('/', verifyToken, (req, res) => {
  const { question_id, content } = req.body;
  const db = req.app.locals.db;

  if (!question_id || !content) {
    return res.status(400).json({ message: 'Question ID and content required' });
  }

  db.run(
    'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)',
    [question_id, req.userId, content],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error posting answer' });
      }
      res.status(201).json({
        message: 'Answer posted successfully',
        answer: { id: this.lastID, question_id, user_id: req.userId, content, is_correct: 0 }
      });
    }
  );
});

// Mark answer as correct and award points
router.put('/:id/mark-correct', verifyToken, (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  const db = req.app.locals.db;
  const pointsToAward = points || 50; // Default 50 points for correct answer

  db.get('SELECT * FROM answers WHERE id = ?', [id], (err, answer) => {
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Verify that the person marking it correct is the question asker
    db.get('SELECT user_id FROM questions WHERE id = ?', [answer.question_id], (err, question) => {
      if (!question || question.user_id !== req.userId) {
        return res.status(403).json({ message: 'Only question asker can mark answers as correct' });
      }

      // Update answer as correct
      db.run(
        'UPDATE answers SET is_correct = 1, points_awarded = ? WHERE id = ?',
        [pointsToAward, id],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating answer' });
          }

          // Award points to answer author
          db.run(
            'UPDATE users SET points = points + ? WHERE id = ?',
            [pointsToAward, answer.user_id],
            (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error awarding points' });
              }
              res.json({
                message: `Answer marked correct and ${pointsToAward} points awarded!`,
                pointsAwarded: pointsToAward
              });
            }
          );
        }
      );
    });
  });
});

// Delete answer
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.get('SELECT user_id FROM answers WHERE id = ?', [id], (err, answer) => {
    if (!answer || answer.user_id !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    db.run('DELETE FROM answers WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting answer' });
      }
      res.json({ message: 'Answer deleted successfully' });
    });
  });
});

// Get all answers (for statistics)
router.get('/', (req, res) => {
  const db = req.app.locals.db;

  db.all('SELECT * FROM answers', [], (err, answers) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching answers' });
    }
    res.json(answers || []);
  });
});

module.exports = router;
