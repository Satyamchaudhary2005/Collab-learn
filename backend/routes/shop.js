const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get all shop items
router.get('/items', (req, res) => {
  const db = req.app.locals.db;

  db.all('SELECT * FROM shop_items ORDER BY points_required ASC', (err, items) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching items' });
    }
    res.json(items || []);
  });
});

// Redeem item
router.post('/redeem', verifyToken, (req, res) => {
  const { item_id } = req.body;
  const db = req.app.locals.db;

  if (!item_id) {
    return res.status(400).json({ message: 'Item ID required' });
  }

  // Get item
  db.get('SELECT * FROM shop_items WHERE id = ?', [item_id], (err, item) => {
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Get user
    db.get('SELECT * FROM users WHERE id = ?', [req.userId], (err, user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.points < item.points_required) {
        return res.status(400).json({ 
          message: 'Insufficient points',
          pointsNeeded: item.points_required - user.points
        });
      }

      // Create purchase record and deduct points
      db.run(
        'INSERT INTO purchases (user_id, item_id, points_spent) VALUES (?, ?, ?)',
        [req.userId, item_id, item.points_required],
        function (err) {
          if (err) {
            return res.status(500).json({ message: 'Error processing redemption' });
          }

          db.run(
            'UPDATE users SET points = points - ? WHERE id = ?',
            [item.points_required, req.userId],
            (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error updating points' });
              }
              res.json({
                message: `Successfully redeemed ${item.name}!`,
                item: item.name,
                pointsSpent: item.points_required,
                remainingPoints: user.points - item.points_required
              });
            }
          );
        }
      );
    });
  });
});

// Get user's redemption history
router.get('/history', verifyToken, (req, res) => {
  const db = req.app.locals.db;

  db.all(
    'SELECT p.*, s.name, s.category FROM purchases p JOIN shop_items s ON p.item_id = s.id WHERE p.user_id = ? ORDER BY p.redeemed_at DESC',
    [req.userId],
    (err, purchases) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching history' });
      }
      res.json(purchases || []);
    }
  );
});

module.exports = router;
