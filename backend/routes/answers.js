const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../controllers/badge');

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

      const answerId = this.lastID;

      // Check and award badges for the answer author (before responding)
      const userId = req.userId;
      db.get('SELECT points FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
          return res.status(201).json({
            message: 'Answer posted successfully',
            answer: { id: answerId, question_id, user_id: req.userId, content, is_correct: 0 }
          });
        }

        db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ?', [userId], (err, ansCount) => {
          const totalAnswers = ansCount ? ansCount.total : 0;
          db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ? AND is_correct = 1', [userId], (err, corrCount) => {
            const correctAnswers = corrCount ? corrCount.total : 0;
            // Count subjects answered (including this new answer's question)
            db.get('SELECT COUNT(DISTINCT q.subject) as total FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.user_id = ? AND q.subject IS NOT NULL AND q.subject != ""', [userId], (err, subjCount) => {
              const subjectsAnswered = subjCount ? subjCount.total : 0;
              checkAndAwardBadges(userId, db, {
                totalQuestions: 0,
                totalAnswers,
                correctAnswers,
                points: user.points,
                subjectsAnswered,
                leaderboardRank: 999
              }, (err, awarded) => {
                res.status(201).json({
                  message: 'Answer posted successfully',
                  answer: { id: answerId, question_id, user_id: req.userId, content, is_correct: 0 },
                  awardedBadges: awarded && awarded.length > 0 ? awarded : []
                });
              });
            });
          });
        });
      });
    }
  );
});

// Mark answer as correct and award points
router.put('/:id/mark-correct', verifyToken, (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  const db = req.app.locals.db;
  const pointsToAward = points || 50;

  db.get('SELECT * FROM answers WHERE id = ?', [id], (err, answer) => {
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    db.get('SELECT user_id FROM questions WHERE id = ?', [answer.question_id], (err, question) => {
      if (!question || question.user_id !== req.userId) {
        return res.status(403).json({ message: 'Only question asker can mark answers as correct' });
      }

      db.run(
        'UPDATE answers SET is_correct = 1, points_awarded = ? WHERE id = ?',
        [pointsToAward, id],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating answer' });
          }

          db.run(
            'UPDATE users SET points = points + ? WHERE id = ?',
            [pointsToAward, answer.user_id],
            (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error awarding points' });
              }

              // Check badges for the answer author who earned points (before response)
              const userId = answer.user_id;
              db.get('SELECT points FROM users WHERE id = ?', [userId], (err, user) => {
                if (err || !user) {
                  return res.json({
                    message: `Answer marked correct and ${pointsToAward} points awarded!`,
                    pointsAwarded: pointsToAward,
                    awardedBadges: []
                  });
                }

                db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ?', [userId], (err, ansCount) => {
                  const totalAnswers = ansCount ? ansCount.total : 0;
                  db.get('SELECT COUNT(*) as total FROM answers WHERE user_id = ? AND is_correct = 1', [userId], (err, corrCount) => {
                    const correctAnswers = corrCount ? corrCount.total : 0;
                    db.get('SELECT COUNT(DISTINCT q.subject) as total FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.user_id = ? AND q.subject IS NOT NULL AND q.subject != ""', [userId], (err, subjCount) => {
                      const subjectsAnswered = subjCount ? subjCount.total : 0;
                      db.get('SELECT position FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC) as position FROM users) ranked WHERE id = ?', [userId], (err, rankRow) => {
                        const leaderboardRank = rankRow ? rankRow.position : 999;
                        checkAndAwardBadges(userId, db, {
                          totalQuestions: 0,
                          totalAnswers,
                          correctAnswers,
                          points: user.points || 0 + pointsToAward,
                          subjectsAnswered,
                          leaderboardRank
                        }, (err, awarded) => {
                          res.json({
                            message: `Answer marked correct and ${pointsToAward} points awarded!`,
                            pointsAwarded: pointsToAward,
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
        }
      );
    });
  });
  
  // Check badges for the answer author (moved before response)
  // Actually, this is already checked above - the res.json is called after badge check
});

// Vote on answer
router.post('/:id/vote', verifyToken, (req, res) => {
  const { id } = req.params;
  const { vote_type } = req.body;
  const db = req.app.locals.db;

  if (!vote_type || !['up', 'down'].includes(vote_type)) {
    return res.status(400).json({ message: 'Vote type must be "up" or "down"' });
  }

  // Check if answer exists
  db.get('SELECT id FROM answers WHERE id = ?', [id], (err, answer) => {
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user already voted
    db.get('SELECT id, vote_type FROM answer_votes WHERE user_id = ? AND answer_id = ?', [req.userId, id], (err, existingVote) => {
      if (existingVote) {
        if (existingVote.vote_type === vote_type) {
          // Same vote type - remove the vote (toggle off)
          db.run('DELETE FROM answer_votes WHERE id = ?', [existingVote.id], (err) => {
            if (err) return res.status(500).json({ message: 'Error removing vote' });
            res.json({ message: 'Vote removed', vote_type: null, action: 'removed' });
          });
        } else {
          // Different vote type - update
          db.run('UPDATE answer_votes SET vote_type = ? WHERE id = ?', [vote_type, existingVote.id], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating vote' });
            res.json({ message: `Vote changed to ${vote_type}`, vote_type, action: 'changed' });
          });
        }
      } else {
        // New vote
        db.run(
          'INSERT INTO answer_votes (user_id, answer_id, vote_type) VALUES (?, ?, ?)',
          [req.userId, id, vote_type],
          function (err) {
            if (err) return res.status(500).json({ message: 'Error casting vote' });
            res.json({ message: `Vote cast as ${vote_type}`, vote_type, action: 'cast' });
          }
        );
      }
    });
  });
});

// Get vote counts for an answer
router.get('/:id/votes', (req, res) => {
  const { id } = req.params;
  const db = req.app.locals.db;

  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM answer_votes WHERE answer_id = ? AND vote_type = 'up') as upvotes,
      (SELECT COUNT(*) FROM answer_votes WHERE answer_id = ? AND vote_type = 'down') as downvotes`,
    [id, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error fetching votes' });
      res.json(result || { upvotes: 0, downvotes: 0 });
    }
  );
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
