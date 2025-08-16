const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Keep this for legacy endpoints
const multer = require('multer');
const fs = require('fs');
const tcb = require('tcb-admin-node'); // Import tcb-admin-node
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing

// Export a function that takes the db instance
module.exports = (db) => {
  const app = express();
  const port = 3002; // Admin server will run on port 3002

  // Initialize CloudBase Admin SDK (if needed for admin operations)
  // Replace 'YOUR_CLOUD_BASE_SECRET_ID', 'YOUR_CLOUD_BASE_SECRET_KEY', 'YOUR_CLOUD_BASE_ENV_ID' with your actual credentials
  tcb.init({
    secretId: 'YOUR_CLOUD_BASE_SECRET_ID',
    secretKey: 'YOUR_CLOUD_BASE_SECRET_KEY',
    env: 'YOUR_CLOUD_BASE_ENV_ID'
  });

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

  // Helper function to log activities
  const logActivity = (type, description) => {
    const sql = `INSERT INTO activities (type, description) VALUES (?, ?)`;
    db.run(sql, [type, description], (err) => {
      if (err) {
        console.error("Error logging activity:", err.message);
      }
    });
  };

  // Helper function to map frontend types to SQLite types
  const mapToSqliteType = (frontendType) => {
    if (!frontendType) return 'TEXT'; // Default to TEXT if type is undefined or null
    switch (frontendType.toLowerCase()) {
      case 'string':
        return 'TEXT';
      case 'number':
        return 'REAL'; // Use REAL for floating point numbers, INTEGER for whole numbers
      case 'boolean':
        return 'INTEGER'; // SQLite stores booleans as 0 or 1
      // Add more mappings as needed
      default:
        return 'TEXT'; // Default to TEXT for unknown types
    }
  };

  // --- Multer Configuration for File Uploads ---
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  const upload = multer({ storage: storage });

  // --- API for Projects ---

  // GET all projects
  app.get('/api/projects', (req, res) => {
    db.all("SELECT * FROM projects", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      // The frontend expects string IDs, so let's convert them
      const projects = rows.map(p => ({...p, id: p.id.toString()}));
      res.json(projects);
    });
  });

  // GET a single project by id
  app.get('/api/projects/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      if (row) {
          // Convert id to string to match frontend expectation
          res.json({...row, id: row.id.toString()});
      } else {
          res.status(404).json({ "message": "Project not found" });
      }
    });
  });

  // PUT (update) an existing project
  app.put('/api/projects/:id', (req, res) => {
      const { name, description, team, progress } = req.body;
      const id = parseInt(req.params.id, 10);
      const sql = `UPDATE projects SET 
                      name = COALESCE(?, name), 
                      description = COALESCE(?, description), 
                      team = COALESCE(?, team), 
                      progress = COALESCE(?, progress)
                   WHERE id = ?`;
      const params = [name, description, team, progress, id];
      db.run(sql, params, function(err) {
          if (err) {
              res.status(500).json({ "error": err.message });
              return;
          }
          if (this.changes === 0) {
              return res.status(404).json({ message: "Project not found" });
          }
          logActivity('项目更新', `更新了项目: "${name || '未知项目'}" (ID: ${id})`);
          res.json({ message: "Project updated successfully", changes: this.changes });
      });
  });

  // DELETE a project
  app.delete('/api/projects/:id', (req, res) => {
      const id = parseInt(req.params.id, 10);
      // First, get the project name for logging
      db.get("SELECT name FROM projects WHERE id = ?", [id], (err, row) => {
          if (err) {
              return res.status(500).json({ "error": err.message });
          }
          if (!row) {
              return res.status(404).json({ message: "Project not found" });
          }
          const projectName = row.name;
          const sql = 'DELETE FROM projects WHERE id = ?';
          db.run(sql, [id], function(err) {
              if (err) {
                  res.status(500).json({ "error": err.message });
                  return;
              }
              if (this.changes > 0) {
                  logActivity('项目删除', `删除了项目: "${projectName}"`);
              }
              res.json({ message: "Project deleted successfully", changes: this.changes });
          });
      });
  });


  // --- API for Tasks ---

  // GET all tasks (can be filtered by projectId)
  app.get('/api/tasks', (req, res) => {
    const { projectId } = req.query;
    let sql = "SELECT * FROM tasks";
    let params = [];
    if (projectId) {
        sql += " WHERE projectId = ?";
        params.push(projectId);
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      // The frontend expects string IDs, so let's convert them
      const tasks = rows.map(t => ({...t, id: t.id.toString()}));
      res.json(tasks);
    });
  });


  // POST a new task
  app.post('/api/tasks', (req, res) => {
    const { title, description, status, assignee, priority, projectId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ message: "Task title and projectId are required." });
    }
    const sql = 'INSERT INTO tasks (title, description, status, assignee, priority, projectId) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [title, description, status || 'todo', assignee, priority || 'medium', projectId];
    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      logActivity('新任务', `创建了新任务: "${title}"`);
      res.status(201).json({
        id: this.lastID.toString(), // Return the new ID as a string
        ...req.body
      });
    });
  });

  // PUT (update) an existing task
  app.put('/api/tasks/:id', (req, res) => {
      const { title, description, status, assignee, priority, projectId } = req.body;
      const id = parseInt(req.params.id, 10);
      const sql = `UPDATE tasks SET 
                      title = COALESCE(?, title), 
                      description = COALESCE(?, description), 
                      status = COALESCE(?, status), 
                      assignee = COALESCE(?, assignee), 
                      priority = COALESCE(?, priority), 
                      projectId = COALESCE(?, projectId) 
                   WHERE id = ?`;
      const params = [title, description, status, assignee, priority, projectId, id];
      db.run(sql, params, function(err) {
          if (err) {
              res.status(500).json({ "error": err.message });
              return;
          }
          if (this.changes === 0) {
              return res.status(404).json({ message: "Task not found" });
          }
          res.json({ message: "Task updated successfully", changes: this.changes });
      });
  });

  // DELETE a task
  app.delete('/api/tasks/:id', (req, res) => {
      const id = parseInt(req.params.id, 10);
      // First, get the task title for logging
      db.get("SELECT title FROM tasks WHERE id = ?", [id], (err, row) => {
          if (err) {
              return res.status(500).json({ "error": err.message });
          }
          if (!row) {
              return res.status(404).json({ message: "Task not found" });
          }
          const taskTitle = row.title;
          const sql = 'DELETE FROM tasks WHERE id = ?';
          db.run(sql, [id], function(err) {
              if (err) {
                  res.status(500).json({ "error": err.message });
                  return;
              }
              if (this.changes > 0) {
                  logActivity('任务删除', `删除了任务: "${taskTitle}"`);
              }
              res.json({ message: "Task deleted successfully", changes: this.changes });
          });
      });
  });


  // --- API for Recipes ---

  // GET all recipes
  app.get('/api/recipes', (req, res) => {
    db.all("SELECT * FROM recipes", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // POST a new recipe
  app.post('/api/recipes', (req, res) => {
    const { name, ingredients, difficulty } = req.body;
    if (!name || !ingredients) {
      return res.status(400).json({ message: "Recipe name and ingredients are required." });
    }
    const sql = 'INSERT INTO recipes (name, ingredients, difficulty) VALUES (?, ?, ?)';
    const params = [name, ingredients, difficulty];
    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    });
  });

  // PUT (update) an existing recipe
  app.put('/api/recipes/:id', (req, res) => {
      const { name, ingredients, difficulty } = req.body;
      const id = parseInt(req.params.id, 10);
      const sql = `UPDATE recipes SET 
                      name = COALESCE(?, name), 
                      ingredients = COALESCE(?, ingredients), 
                      difficulty = COALESCE(?, difficulty)
                   WHERE id = ?`;
      const params = [name, ingredients, difficulty, id];
      db.run(sql, params, function(err) {
          if (err) {
              res.status(500).json({ "error": err.message });
              return;
          }
          if (this.changes === 0) {
              return res.status(404).json({ message: "Recipe not found" });
          }
          res.json({ message: "Recipe updated successfully", changes: this.changes });
      });
  });

  // DELETE a recipe
  app.delete('/api/recipes/:id', (req, res) => {
      const id = parseInt(req.params.id, 10);
      const sql = 'DELETE FROM recipes WHERE id = ?';
      db.run(sql, [id], function(err) {
          if (err) {
              res.status(500).json({ "error": err.message });
              return;
          }
          if (this.changes === 0) {
              return res.status(404).json({ message: "Recipe not found" });
          }
          res.json({ message: "Recipe deleted successfully", changes: this.changes });
      });
  });


  // --- API for Ingredients ---

  // GET all ingredients
  app.get('/api/ingredients', (req, res) => {
    db.all("SELECT * FROM ingredients", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // POST a new ingredient
  app.post('/api/ingredients', (req, res) => {
    const { name, type, rarity } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Ingredient name is required." });
    }
    const sql = 'INSERT INTO ingredients (name, type, rarity) VALUES (?, ?, ?)';
    const params = [name, type, rarity];
    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, ...req.body });
    });
  });

  // PUT (update) an existing ingredient
  app.put('/api/ingredients/:id', (req, res) => {
      const { name, type, rarity } = req.body;
      const id = parseInt(req.params.id, 10);
      const sql = `UPDATE ingredients SET 
                      name = COALESCE(?, name), 
                      type = COALESCE(?, type), 
                      rarity = COALESCE(?, rarity)
                   WHERE id = ?`;
      const params = [name, type, rarity, id];
      db.run(sql, params, function(err) {
          if (err) {
              res.status(500).json({ "error": err.message });
              return;
          }
          if (this.changes === 0) {
              return res.status(404).json({ message: "Ingredient not found" });
          }
          res.json({ message: "Ingredient updated successfully", changes: this.changes });
      });
  });

  // DELETE an ingredient
  app.delete('/api/ingredients/:id', (req, res) => {
      const id = parseInt(req.params.id, 10);
      const sql = 'DELETE FROM ingredients WHERE id = ?';
      db.run(sql, [id], function(err) {
          if (err) {
              res.status(500).json({ "error": err.message });
              return;
          }
          if (this.changes === 0) {
              return res.status(404).json({ message: "Ingredient not found" });
          }
          res.json({ message: "Ingredient deleted successfully", changes: this.changes });
      });
  });


  // --- API for Assets ---

  // POST (upload) a new asset
  app.post('/api/assets/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { name, type, projectId } = req.body; // Get projectId from body
    const { filename, path: filePath, size } = req.file;
    const uploadDate = new Date().toISOString();
    
    const sql = 'INSERT INTO assets (name, path, type, size, uploadDate, projectId) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [name || filename, `/uploads/${filename}`, type || req.file.mimetype, size, uploadDate, projectId];

    db.run(sql, params, function(err) {
      if (err) {
        // If DB insert fails, delete the uploaded file
        fs.unlinkSync(filePath);
        return res.status(500).json({ "error": err.message });
      }
      logActivity('新资产', `上传了新资产: "${name || filename}" (项目ID: ${projectId})`);
      res.status(201).json({
        id: this.lastID,
        name: name || filename,
        path: `/uploads/${filename}`,
        type: type || req.file.mimetype,
        size: size,
        uploadDate: uploadDate,
        projectId: projectId // Include projectId in response
      });
    });
  });

  // GET all assets (can be filtered by projectId)
  app.get('/api/assets', (req, res) => {
    const { projectId } = req.query;
    let sql = "SELECT * FROM assets";
    let params = [];
    if (projectId) {
        sql += " WHERE projectId = ?";
        params.push(projectId);
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // DELETE an asset
  app.delete('/api/assets/:id', (req, res) => {
      const id = parseInt(req.params.id, 10);

      // First, get the file path and name from the database
      db.get("SELECT path, name FROM assets WHERE id = ?", [id], (err, row) => {
          if (err) {
              return res.status(500).json({ "error": err.message });
          }
          if (!row) {
              return res.status(404).json({ message: "Asset not found in database." });
          }

          const assetPath = path.join(__dirname, row.path);
          const assetName = row.name;

          // Second, delete the file from the filesystem
          fs.unlink(assetPath, (fsErr) => {
              if (fsErr) {
                  console.error("Error deleting file:", fsErr);
              }

              // Third, delete the record from the database
              const sql = 'DELETE FROM assets WHERE id = ?';
              db.run(sql, [id], function(dbErr) {
                  if (dbErr) {
                      return res.status(500).json({ "error": dbErr.message });
                  }
                  if (this.changes > 0) {
                      logActivity('资产删除', `删除了资产: "${assetName}"`);
                  }
                  res.json({ message: "Asset deleted successfully", changes: this.changes });
              });
          });
      });
  });


  // --- API for Builds ---

  // GET all builds (can be filtered by projectId)
  app.get('/api/builds', (req, res) => {
    const { projectId } = req.query;
    let sql = "SELECT * FROM builds";
    let params = [];
    if (projectId) {
        sql += " WHERE projectId = ?";
        params.push(projectId);
    }
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // POST a new build record
  app.post('/api/builds', (req, res) => {
    const { projectId, version, platform, status, duration } = req.body;
    if (!projectId || !version || !platform || !status) {
      return res.status(400).json({ message: "Project ID, version, platform, and status are required for a build record." });
    }
    const sql = 'INSERT INTO builds (projectId, version, platform, status, duration) VALUES (?, ?, ?, ?, ?)';
    const params = [projectId, version, platform, status, duration];
    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      logActivity('构建记录', `项目 ${projectId} 完成构建: 版本 ${version}, 平台 ${platform}, 状态 ${status}`);
      res.status(201).json({ id: this.lastID, ...req.body });
    });
  });


  // --- API for Activities ---
  app.get('/api/activities', (req, res) => {
    // Query the last 10 activities, ordered by timestamp descending
    db.all("SELECT * FROM activities ORDER BY timestamp DESC LIMIT 10", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // --- API for User Management (Admin Only) ---
  // POST a new user (admin only)
  app.post('/api/admin/users', async (req, res) => {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = role || 'player'; // Default to 'player' if not specified

      const sql = 'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)';
      db.run(sql, [username, hashedPassword, email, userRole], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: "Username or email already exists." });
          }
          return res.status(500).json({ "error": err.message });
        }
        logActivity('用户管理', `创建了新用户: "${username}" (角色: ${userRole})`);
        res.status(201).json({
          id: this.lastID,
          username,
          email,
          role: userRole,
          message: "User created successfully."
        });
      });
    } catch (error) {
      res.status(500).json({ "error": error.message });
    }
  });

  // PUT (update) a user's password (admin only)
  app.put('/api/admin/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const sql = 'UPDATE users SET password = ? WHERE id = ?';
      db.run(sql, [hashedPassword, id], function(err) {
        if (err) {
          return res.status(500).json({ "error": err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: "User not found." });
        }
        logActivity('用户管理', `更新了用户 (ID: ${id}) 的密码。`);
        res.json({ message: "Password updated successfully." });
      });
    } catch (error) {
      res.status(500).json({ "error": error.message });
    }
  });

  // GET all users (admin only)
  app.get('/api/admin/users', (req, res) => {
    db.all("SELECT id, username, email, role FROM users", [], (err, rows) => {
      if (err) {
        res.status(500).json({ "error": err.message });
        return;
      }
      res.json(rows);
    });
  });

  // PUT (update) a user's details (admin only)
  app.put('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ message: "Username, email, and role are required." });
    }

    const sql = `UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?`;
    db.run(sql, [username, email, role, id], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ message: "Username or email already exists." });
        }
        return res.status(500).json({ "error": err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      logActivity('用户管理', `更新了用户 (ID: ${id}) 的信息。`);
      res.json({ message: "User updated successfully." });
    });
  });

  // DELETE a user (admin only)
  app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ "error": err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      logActivity('用户管理', `删除了用户 (ID: ${id})。`);
      res.json({ message: "User deleted successfully." });
    });
  });

  // API for User Tables Metadata
  // GET all user tables for a specific project
  app.get('/api/user-tables/:projectId', (req, res) => {
    const { projectId } = req.params;
    db.all('SELECT * FROM user_tables_metadata WHERE projectId = ?', [projectId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });

  // POST a new user table metadata and create the actual table
  app.post('/api/user-tables', (req, res) => {
    const { projectId, name, description, schemaJson } = req.body;
    if (!projectId || !name || !schemaJson) {
      return res.status(400).json({ error: 'Project ID, name, and schemaJson are required.' });
    }

    const parsedSchema = JSON.parse(schemaJson);
    if (!Array.isArray(parsedSchema) || parsedSchema.length === 0) {
      return res.status(400).json({ error: 'Schema must be a non-empty array of field objects.' });
    }

    // First, insert metadata
    db.run('INSERT INTO user_tables_metadata (projectId, name, description, schemaJson) VALUES (?, ?, ?, ?)',
      [projectId, name, description, schemaJson],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const metadataId = this.lastID;
        const actualTableName = `user_data_table_${metadataId}`; // Generate unique table name

        // Construct CREATE TABLE SQL with mapped types
        const fieldsSql = parsedSchema.map(field => `"${field.name}" ${mapToSqliteType(field.type)}`).join(', ');
        const createTableSql = `CREATE TABLE IF NOT EXISTS "${actualTableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, ${fieldsSql})`;

        // Create the actual data table
        db.run(createTableSql, [], (createErr) => {
          if (createErr) {
            // If table creation fails, rollback metadata insertion
            db.run('DELETE FROM user_tables_metadata WHERE id = ?', [metadataId], (deleteErr) => {
              if (deleteErr) console.error("Error rolling back metadata:", deleteErr.message);
            });
            return res.status(500).json({ error: `Failed to create actual table: ${createErr.message}` });
          }

          // Update metadata with actualTableName
          db.run('UPDATE user_tables_metadata SET actualTableName = ? WHERE id = ?',
            [actualTableName, metadataId],
            (updateErr) => {
              if (updateErr) {
                console.error("Error updating metadata with actualTableName:", updateErr.message);
                // Consider rolling back table creation here too if critical
              }
              logActivity('数据库管理', `创建了新数据表: "${name}" (项目ID: ${projectId})`);
              res.status(201).json({ id: metadataId, projectId, name, description, schemaJson, actualTableName });
            }
          );
        });
      }
    );
  });

  // PUT (update) an existing user table metadata
  app.put('/api/user-tables/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, schemaJson } = req.body;
    if (!name || !schemaJson) {
      return res.status(400).json({ error: 'Name and schemaJson are required.' });
    }
    db.run('UPDATE user_tables_metadata SET name = ?, description = ?, schemaJson = ? WHERE id = ?',
      [name, description, schemaJson, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'User table metadata not found.' });
          return;
        }
        res.json({ message: 'User table metadata updated successfully.', id, name, description, schemaJson });
      }
    );
  });

  // GET data from a user-defined table
  app.get('/api/user-tables/:tableId/data', (req, res) => {
    const { tableId } = req.params;

    db.get('SELECT actualTableName FROM user_tables_metadata WHERE id = ?', [tableId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row || !row.actualTableName) {
        return res.status(404).json({ error: 'User table not found or actual table name not set.' });
      }

      const actualTableName = row.actualTableName;
      const schema = JSON.parse(row.schemaJson || '[]'); // Get schema for type conversion

      const sql = `SELECT * FROM "${actualTableName}"`; // Use double quotes for table name to handle special characters if any

      db.all(sql, [], (dataErr, rows) => {
        if (dataErr) {
          console.error(`Error fetching data from table "${actualTableName}":`, dataErr.message);
          return res.status(500).json({ error: `Failed to fetch data from table "${actualTableName}": ${dataErr.message}` });
        }

        // Convert data types back to frontend expectations based on schema
        const convertedRows = rows.map(record => {
          const newRecord = { ...record };
          for (const field of schema) {
            if (newRecord.hasOwnProperty(field.name)) {
              if (field.type.toLowerCase() === 'boolean') {
                newRecord[field.name] = Boolean(newRecord[field.name]); // Convert 0/1 to false/true
              } else if (field.type.toLowerCase() === 'number') {
                newRecord[field.name] = Number(newRecord[field.name]); // Ensure it's a number
              }
              // Add other type conversions if necessary (e.g., date strings to Date objects)
            }
          }
          return newRecord;
        });
        res.json(convertedRows);
      });
    });
  });

  // POST data to a user-defined table
  app.post('/api/user-tables/:tableId/data', (req, res) => {
    const { tableId } = req.params;
    const recordData = req.body; // The data to insert

    db.get('SELECT actualTableName, schemaJson FROM user_tables_metadata WHERE id = ?', [tableId], (err, row) => {
      if (err) {
        console.error(`Error fetching metadata for tableId ${tableId}:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row || !row.actualTableName) {
        console.warn(`User table not found or actual table name not set for tableId ${tableId}.`);
        return res.status(404).json({ error: 'User table not found or actual table name not set.' });
      }

      const actualTableName = row.actualTableName;
      const schema = JSON.parse(row.schemaJson || '[]');

      // Validate incoming data against schema and prepare for insertion
      const columns = [];
      const placeholders = [];
      const values = [];

      for (const field of schema) {
        if (recordData.hasOwnProperty(field.name)) {
          columns.push(`"${field.name}"`);
          placeholders.push('?');
          let value = recordData[field.name];

          // Type conversion based on schema for insertion
          if (field.type.toLowerCase() === 'number') {
            value = Number(value);
            if (isNaN(value)) {
              console.warn(`Invalid number value for field "${field.name}":`, recordData[field.name]);
              return res.status(400).json({ error: `Invalid number value for field "${field.name}".` });
            }
          } else if (field.type.toLowerCase() === 'boolean') {
            value = Boolean(value) ? 1 : 0; // Convert to 0 or 1 for SQLite INTEGER
          }
          values.push(value);
        }
      }

      if (columns.length === 0) {
        console.warn('No valid data provided for insertion based on table schema.');
        return res.status(400).json({ error: 'No valid data provided for insertion based on table schema.' });
      }

      const sql = `INSERT INTO "${actualTableName}" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      console.log(`[DB-INSERT] Executing SQL: ${sql}`);
      console.log(`[DB-INSERT] With values: ${JSON.stringify(values)}`);

      db.run(sql, values, function(insertErr) {
        if (insertErr) {
          console.error(`[DB-INSERT-ERROR] Failed to insert data into table "${actualTableName}": ${insertErr.message}`);
          return res.status(500).json({ error: `Failed to insert data into table "${actualTableName}": ${insertErr.message}` });
        }
        console.log(`[DB-INSERT-SUCCESS] Record inserted successfully into "${actualTableName}" with ID: ${this.lastID}`);
        logActivity('数据库管理', `向数据表 "${actualTableName}" 插入了新记录 (ID: ${this.lastID})`);
        res.status(201).json({ message: 'Record inserted successfully.', id: this.lastID, ...recordData });
      });
    });
  });

  // GET data from a user-defined table
  app.get('/api/user-tables/:tableId/data', (req, res) => {
    const { tableId } = req.params;
    db.get('SELECT actualTableName, schemaJson FROM user_tables_metadata WHERE id = ?', [tableId], (err, row) => {
      if (err) {
        console.error(`[DB-GET-METADATA-ERROR] Error fetching metadata for tableId ${tableId}:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row || !row.actualTableName) {
        console.warn(`[DB-GET-METADATA-WARN] User table not found or actual table name not set for tableId ${tableId}.`);
        return res.status(404).json({ error: 'User table not found or actual table name not set.' });
      }

      const actualTableName = row.actualTableName;
      const schema = JSON.parse(row.schemaJson || '[]');

      const sql = `SELECT * FROM "${actualTableName}"`;
      console.log(`[DB-SELECT] Executing SQL: ${sql}`);

      db.all(sql, [], (dataErr, rows) => {
        if (dataErr) {
          console.error(`[DB-SELECT-ERROR] Failed to fetch data from table "${actualTableName}": ${dataErr.message}`);
          return res.status(500).json({ error: `Failed to fetch data from table "${actualTableName}": ${dataErr.message}` });
        }
        console.log(`[DB-SELECT-SUCCESS] Fetched ${rows.length} rows from "${actualTableName}".`);

        // Convert data types back to frontend expectations based on schema
        const convertedRows = rows.map(record => {
          const newRecord = { ...record };
          for (const field of schema) {
            if (newRecord.hasOwnProperty(field.name)) {
              if (field.type.toLowerCase() === 'boolean') {
                newRecord[field.name] = Boolean(newRecord[field.name]); // Convert 0/1 to false/true
              } else if (field.type.toLowerCase() === 'number') {
                newRecord[field.name] = Number(newRecord[field.name]); // Ensure it's a number
              }
              // Add other type conversions if necessary (e.g., date strings to Date objects)
            }
          }
          return newRecord;
        });
        res.json(convertedRows);
      });
    });
  });

  // DELETE a user table metadata and the actual table
  app.delete('/api/user-tables/:id', (req, res) => {
    const { id } = req.params;

    // First, get the actualTableName from metadata
    db.get('SELECT actualTableName, name FROM user_tables_metadata WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'User table metadata not found.' });
      }

      const { actualTableName, name: tableName } = row;

      // Delete the metadata record
      db.run('DELETE FROM user_tables_metadata WHERE id = ?', [id], function (deleteMetadataErr) {
        if (deleteMetadataErr) {
          return res.status(500).json({ error: deleteMetadataErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User table metadata not found.' });
        }

        // If metadata deleted, then drop the actual table
        if (actualTableName) {
          const dropTableSql = `DROP TABLE IF EXISTS "${actualTableName}"`;
          db.run(dropTableSql, [], (dropTableErr) => {
            if (dropTableErr) {
              console.error(`Error dropping actual table ${actualTableName}:`, dropTableErr.message);
              // Continue with response even if table drop fails, as metadata is already gone
            } else {
              logActivity('数据库管理', `删除了数据表: "${tableName}"`);
            }
            res.json({ message: 'User table and metadata deleted successfully.', id });
          });
        } else {
          logActivity('数据库管理', `删除了数据表元数据: "${tableName}" (无实际表关联)`);
          res.json({ message: 'User table metadata deleted successfully (no actual table to drop).', id });
        }
      });
    });
  });

  // --- Legacy Endpoints for DB Management Page ---
  // These are for the separate database management page and can be left as is.
  app.post('/connect-sqlite', (req, res) => {
    const { dbPath } = req.body;
    if (!dbPath) return res.status(400).json({ error: 'Database path is required.' });
    const absoluteDbPath = path.resolve(dbPath);
    const tempDb = new sqlite3.Database(absoluteDbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) return res.status(500).json({ error: `Failed to connect to database: ${err.message}` });
      tempDb.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
        if (err) return res.status(500).json({ error: `Failed to fetch table names: ${err.message}` });
        const tableNames = rows.map(row => row.name);
        res.json({ message: 'Successfully connected to database and fetched table names.', tableNames });
        tempDb.close();
      });
    });
  });

  app.post('/get-table-data', (req, res) => {
    const { dbPath, tableName } = req.body;
    if (!dbPath || !tableName) return res.status(400).json({ error: 'Database path and table name are required.' });
    const absoluteDbPath = path.resolve(dbPath);
    const tempDb = new sqlite3.Database(absoluteDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return res.status(500).json({ error: `Failed to connect to database: ${err.message}` });
      tempDb.all(`SELECT * FROM "${tableName}"`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: `Failed to fetch data from table: ${err.message}` });
        res.json({ data: rows });
        tempDb.close();
      });
    });
  });

  app.listen(port, () => {
    console.log(`Admin server listening at http://localhost:${port}`);
  });
};
