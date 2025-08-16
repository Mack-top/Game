const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tcb = require('tcb-admin-node'); // Import tcb-admin-node

// Export a function that takes the db instance
module.exports = (db) => {
  const app = express();
  const port = 3001; // Player server will run on port 3001
  const JWT_SECRET = 'your_jwt_secret_key'; // Define a secret key for JWT

  // Initialize CloudBase Admin SDK
  // Replace 'YOUR_CLOUD_BASE_SECRET_ID', 'YOUR_CLOUD_BASE_SECRET_KEY', 'YOUR_CLOUD_BASE_ENV_ID' with your actual credentials
  tcb.init({
    secretId: 'YOUR_CLOUD_BASE_SECRET_ID',
    secretKey: 'YOUR_CLOUD_BASE_SECRET_KEY',
    env: 'YOUR_CLOUD_BASE_ENV_ID'
  });

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

  // Helper function to log activities (if needed for player actions)
  const logActivity = (type, description) => {
    const sql = `INSERT INTO activities (type, description) VALUES (?, ?)`;
    db.run(sql, [type, description], (err) => {
      if (err) {
        console.error("Error logging activity:", err.message);
      }
    });
  };

  // Middleware to verify JWT
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No token, unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403); // Token invalid or expired, forbidden
      req.user = user; // Attach user payload to request
      next();
    });
  };

  // --- API for User Authentication (Player-facing) ---

  // Register
  app.post('/api/register', (req, res) => {
    const { username, password, email, role } = req.body; // Added role

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists.' });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 10); // 10 is the salt rounds
      const userRole = role || 'player'; // Default role to 'player' if not provided

      db.run('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, email, userRole], // Added userRole
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          const token = jwt.sign({ id: this.lastID, username: username, role: userRole }, JWT_SECRET, { expiresIn: '1h' }); // Added role to token
          logActivity('用户注册', `新用户注册: ${username} (角色: ${userRole})`);
          res.status(201).json({ message: 'User registered successfully.', token: token, user: { id: this.lastID, username, email, role: userRole } }); // Added role to user object
        }
      );
    });
  });

  // Login
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      // Compare password
      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' }); // Added role to token
      logActivity('用户登录', `用户登录成功: ${username} (角色: ${user.role})`);
      res.json({ message: 'Login successful!', token: token, user: { id: user.id, username: user.username, email: user.email, role: user.role } }); // Added role to user object
    });
  });

  // --- API for Player-facing Games ---

  // GET all games
  app.get('/api/player/games', (req, res) => {
    db.all("SELECT * FROM games", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // Get recommended games (simple example: top-rated games)
  app.get('/api/player/games/recommended', (req, res) => {
    db.all("SELECT * FROM games ORDER BY rating DESC LIMIT 5", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // Get recently played games (placeholder, would need a 'played_games' table or similar in a real app)
  app.get('/api/player/games/recent', (req, res) => {
    // For now, just return a few random games as a placeholder
    db.all("SELECT * FROM games ORDER BY RANDOM() LIMIT 3", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // Search games
  app.get('/api/player/games/search', (req, res) => {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required." });
    }
    const searchQuery = `%${query}%`;
    db.all("SELECT * FROM games WHERE title LIKE ? OR description LIKE ? OR genre LIKE ? OR developer LIKE ?",
      [searchQuery, searchQuery, searchQuery, searchQuery],
      (err, rows) => {
        if (err) {
          res.status(500).json({ "error": err.message });
          return;
        }
        res.json(rows);
      }
    );
  });

  // Filter games
  app.get('/api/player/games/filter', (req, res) => {
    const { genre, developer, rating_min } = req.query;
    let sql = "SELECT * FROM games WHERE 1=1";
    const params = [];

    if (genre) {
      sql += " AND genre = ?";
      params.push(genre);
    }
    if (developer) {
      sql += " AND developer = ?";
      params.push(developer);
    }
    if (rating_min) {
      sql += " AND rating >= ?";
      params.push(parseFloat(rating_min));
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // GET a single game by id
  app.get('/api/player/games/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.get("SELECT * FROM games WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      if (row) {
          res.json(row);
      } else {
          res.status(404).json({ "message": "Game not found" });
      }
    });
  });

  // --- API for Player Data Management ---

  // GET player profile (assuming userId is passed, e.g., from a session or token)
  app.get('/api/player/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    db.get("SELECT id, username, email, createdAt FROM users WHERE id = ?", [userId], (err, user) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ "message": "User not found" });
      }
    });
  });

  // PUT (update) player profile
  app.put('/api/player/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { username, email } = req.body; // Allow updating username and email

    if (!username && !email) {
      return res.status(400).json({ message: "No fields to update." });
    }

    let sql = 'UPDATE users SET ';
    const params = [];
    const updates = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(userId);

    db.run(sql, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ "error": err.message });
        return;
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "User not found or no changes made." });
      }
      res.json({ message: "Profile updated successfully", changes: this.changes });
    });
  });

  // GET player game history
  app.get('/api/player/history/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    db.all("SELECT gh.*, g.title as gameTitle, g.coverImage as gameCoverImage FROM game_history gh JOIN games g ON gh.gameId = g.id WHERE gh.userId = ? ORDER BY gh.lastPlayed DESC", [userId], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // GET player achievements
  app.get('/api/player/achievements/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    db.all("SELECT a.*, g.title as gameTitle FROM achievements a LEFT JOIN games g ON a.gameId = g.id WHERE a.userId = ? ORDER BY a.unlockedAt DESC", [userId], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  app.listen(port, () => {
    console.log(`Player server listening at http://localhost:${port}`);
  });
};
