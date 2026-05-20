const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Hardcoded admin credentials (update with environment variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@college.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ 
      message: 'Admin login successful',
      token,
      isAdmin: true 
    });
  } else {
    res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const stats = {};
  
  db.get('SELECT COUNT(*) as count FROM users', (err, users) => {
    stats.totalUsers = users?.count || 0;
    
    db.get('SELECT COUNT(*) as count FROM questions', (err, questions) => {
      stats.totalQuestions = questions?.count || 0;
      
      db.get('SELECT COUNT(*) as count FROM answers', (err, answers) => {
        stats.totalAnswers = answers?.count || 0;
        
        db.get('SELECT COUNT(*) as count FROM purchases', (err, purchases) => {
          stats.totalRedemptions = purchases?.count || 0;
          res.json(stats);
        });
      });
    });
  });
});

// Get all users
router.get('/users', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  db.all('SELECT id, username, email, semester, points, created_at FROM users ORDER BY id DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
    res.json(users || []);
  });
});

// Get user details
router.get('/users/:id', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  
  db.get('SELECT id, username, email, semester, points, created_at FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
    res.json(user);
  });
});

// Update user points
router.put('/users/:id/points', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { points } = req.body;
  
  db.run('UPDATE users SET points = ? WHERE id = ?', [points, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error updating points', error: err.message });
    }
    res.json({ message: 'Points updated successfully' });
  });
});

// Delete user
router.delete('/users/:id', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Get all questions
router.get('/questions', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  db.all(`SELECT q.id, q.title, q.description, q.semester, q.subject, q.created_at, 
                  u.username, (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
           FROM questions q
           JOIN users u ON q.user_id = u.id
           ORDER BY q.id DESC`, (err, questions) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching questions', error: err.message });
    }
    res.json(questions || []);
  });
});

// Delete question
router.delete('/questions/:id', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  
  db.serialize(() => {
    db.run('DELETE FROM answers WHERE question_id = ?', [id]);
    db.run('DELETE FROM questions WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error deleting question', error: err.message });
      }
      res.json({ message: 'Question and related answers deleted successfully' });
    });
  });
});

// Get all answers
router.get('/answers', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  db.all(`SELECT a.id, a.content, a.is_correct, a.points_awarded, a.created_at,
                  u.username as answerer, q.title as question_title
           FROM answers a
           JOIN users u ON a.user_id = u.id
           JOIN questions q ON a.question_id = q.id
           ORDER BY a.id DESC`, (err, answers) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching answers', error: err.message });
    }
    res.json(answers || []);
  });
});

// Delete answer
router.delete('/answers/:id', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  
  db.run('DELETE FROM answers WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting answer', error: err.message });
    }
    res.json({ message: 'Answer deleted successfully' });
  });
});

// Get all shop items
router.get('/shop', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  db.all('SELECT * FROM shop_items ORDER BY id DESC', (err, items) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching shop items', error: err.message });
    }
    res.json(items || []);
  });
});

// Create shop item
router.post('/shop', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { name, description, points_required, category } = req.body;
  
  db.run(
    'INSERT INTO shop_items (name, description, points_required, category) VALUES (?, ?, ?, ?)',
    [name, description, points_required, category],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating shop item', error: err.message });
      }
      res.json({ message: 'Shop item created successfully', id: this.lastID });
    }
  );
});

// Update shop item
router.put('/shop/:id', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { name, description, points_required, category } = req.body;
  
  db.run(
    'UPDATE shop_items SET name = ?, description = ?, points_required = ?, category = ? WHERE id = ?',
    [name, description, points_required, category, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating shop item', error: err.message });
      }
      res.json({ message: 'Shop item updated successfully' });
    }
  );
});

// Delete shop item
router.delete('/shop/:id', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  
  db.run('DELETE FROM shop_items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting shop item', error: err.message });
    }
    res.json({ message: 'Shop item deleted successfully' });
  });
});

// Get all purchases/redemptions
router.get('/purchases', adminAuth, (req, res) => {
  const db = req.app.locals.db;
  db.all(`SELECT p.id, p.points_spent, p.redeemed_at, u.username, s.name as item_name
           FROM purchases p
           JOIN users u ON p.user_id = u.id
           JOIN shop_items s ON p.item_id = s.id
           ORDER BY p.id DESC`, (err, purchases) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching purchases', error: err.message });
    }
    res.json(purchases || []);
  });
});

module.exports = router;
