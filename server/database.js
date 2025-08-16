const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'platform.db');
let db;

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
          // Projects Table
          db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            currentVersion TEXT,
            status TEXT,
            lastUpdated TEXT,
            description TEXT,
            team TEXT,
            progress TEXT
          )`);

          // Tasks Table
          db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            assignee TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            projectId INTEGER,
            FOREIGN KEY (projectId) REFERENCES projects (id)
          )`);

          // Recipes Table
          db.run(`CREATE TABLE IF NOT EXISTS recipes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              ingredients TEXT NOT NULL,
              difficulty TEXT
          )`);

          // Ingredients Table
          db.run(`CREATE TABLE IF NOT EXISTS ingredients (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              type TEXT,
              rarity TEXT
          )`);

          // Assets Table
          db.run(`CREATE TABLE IF NOT EXISTS assets (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              path TEXT NOT NULL,
              type TEXT,
              size REAL,
              uploadDate TEXT,
              projectId INTEGER,
              FOREIGN KEY (projectId) REFERENCES projects (id)
          )`);

          // Builds Table
          db.run(`CREATE TABLE IF NOT EXISTS builds (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              projectId INTEGER NOT NULL,
              version TEXT NOT NULL,
              platform TEXT NOT NULL,
              status TEXT NOT NULL,
              timestamp TEXT DEFAULT (datetime('now','localtime')),
              duration TEXT,
              FOREIGN KEY (projectId) REFERENCES projects (id)
          )`);

          // Activities Table
          db.run(`CREATE TABLE IF NOT EXISTS activities (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              description TEXT,
              timestamp TEXT DEFAULT (datetime('now','localtime'))
          )`);

          // User Tables Metadata Table
          db.run(`CREATE TABLE IF NOT EXISTS user_tables_metadata (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              projectId INTEGER NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              schemaJson TEXT NOT NULL, -- JSON string representing the table schema (fields)
              FOREIGN KEY (projectId) REFERENCES projects (id)
          )`);

          // Users Table for authentication
          db.run(`CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL, -- Hashed password
              email TEXT UNIQUE,
              role TEXT NOT NULL DEFAULT 'player', -- New role column
              createdAt TEXT DEFAULT (datetime('now','localtime'))
          )`);
          // Add role column if it doesn't exist (for existing databases)
          db.all("PRAGMA table_info(users)", (err, rows) => { // Changed to db.all and 'rows'
            if (err) {
              console.error("Error checking users table info:", err.message);
              return;
            }
            // Ensure rows is an array before mapping
            const columns = Array.isArray(rows) ? rows.map(col => col.name) : [];
            if (!columns.includes('role')) {
              db.run(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'player'`, (err) => {
                if (err) {
                  console.error("Error adding role column to users table:", err.message);
                } else {
                  console.log("Added 'role' column to 'users' table.");
                }
              });
            }
          });

          // Games Table for player-facing games
          db.run(`CREATE TABLE IF NOT EXISTS games (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              genre TEXT,
              developer TEXT,
              releaseDate TEXT,
              rating REAL,
              description TEXT,
              coverImage TEXT,
              trailerVideo TEXT,
              screenshots TEXT, -- JSON string of screenshot paths
              status TEXT DEFAULT 'available', -- e.g., 'available', 'coming_soon', 'unavailable'
              createdAt TEXT DEFAULT (datetime('now','localtime'))
          )`);

          // Game History Table for player-facing games
          db.run(`CREATE TABLE IF NOT EXISTS game_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              userId INTEGER NOT NULL,
              gameId INTEGER NOT NULL,
              playTime INTEGER, -- in minutes
              lastPlayed TEXT DEFAULT (datetime('now','localtime')),
              FOREIGN KEY (userId) REFERENCES users (id),
              FOREIGN KEY (gameId) REFERENCES games (id)
          )`);

          // Achievements Table for player-facing games
          db.run(`CREATE TABLE IF NOT EXISTS achievements (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              userId INTEGER NOT NULL,
              gameId INTEGER, -- Optional, for game-specific achievements
              name TEXT NOT NULL,
              description TEXT,
              unlockedAt TEXT DEFAULT (datetime('now','localtime')),
              FOREIGN KEY (userId) REFERENCES users (id),
              FOREIGN KEY (gameId) REFERENCES games (id)
          )`);

          console.log('Database tables checked/created.');

          // Insert initial data if tables are empty
          db.get("SELECT COUNT(*) as count FROM projects", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial project data...');
              db.run(`INSERT INTO projects (name, currentVersion, status, lastUpdated, description, team, progress) VALUES
                ('赛博朋克城市', '1.2.0', '开发中', '2024-07-20', '一个充满未来科技感的开放世界游戏，玩家在霓虹闪烁的都市中探索。', 'Alice,Bob,Charlie', '80%'),
                ('奇幻冒险岛', '0.9.5', '测试阶段', '2024-07-18', '在一个神秘的岛屿上进行冒险，收集宝藏，击败怪物。', 'David,Eve', '60%'),
                ('太空殖民地', '2.1.0', '已发布', '2024-07-15', '在遥远的星球上建立和管理自己的太空殖民地。', 'Frank,Grace,Heidi', '100%'),
                ('像素地下城', '1.0.0', '开发中', '2024-07-22', '经典的像素风格地下城探险游戏，随机生成的地图和丰富的敌人。', 'Ivan', '45%'),
                ('远古遗迹探险', '0.1.0', '概念设计', '2024-07-25', '探索古老的遗迹，揭开隐藏的秘密。', 'Judy', '10%')
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM tasks", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial task data...');
              db.run(`INSERT INTO tasks (title, description, status, assignee, priority, projectId) VALUES
                ('实现用户认证模块', '开发用户注册、登录、登出功能。', 'in-progress', '张三', 'high', 1),
                ('设计数据库结构', '定义用户、项目、任务等数据表。', 'todo', '李四', 'high', 1),
                ('编写API文档', '为后端接口编写详细文档。', 'todo', '王五', 'medium', 2),
                ('前端界面优化', '改进项目总览页面的UI/UX。', 'done', '张三', 'low', 1),
                ('开发游戏AI', '实现敌人的行为逻辑和寻路算法。', 'in-progress', '赵六', 'high', 1),
                ('制作游戏音效', '录制并整合游戏内的背景音乐和音效。', 'todo', '钱七', 'medium', 2)
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM recipes", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial recipe data...');
              db.run(`INSERT INTO recipes (name, ingredients, difficulty) VALUES
                ('赛博能量饮', '能量果,合成糖,纯净水', '简单'),
                ('霓虹寿司卷', '发光米,深海鱼片,海苔', '中等'),
                ('机械烤肉串', '合成肉,机械香料,火焰果', '困难')
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM ingredients", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial ingredient data...');
              db.run(`INSERT INTO ingredients (name, type, rarity) VALUES
                ('能量果', '水果', '普通'),
                ('合成糖', '调味品', '普通'),
                ('纯净水', '液体', '普通'),
                ('发光米', '谷物', '稀有'),
                ('深海鱼片', '肉类', '史诗'),
                ('海苔', '蔬菜', '普通'),
                ('合成肉', '肉类', '普通'),
                ('机械香料', '调味品', '稀有'),
                ('火焰果', '水果', '史诗')
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM builds", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial build data...');
              db.run(`INSERT INTO builds (projectId, version, platform, status, timestamp, duration) VALUES
                (1, '1.2.0', 'PC', '成功', '2024-07-22 10:30', '5m 12s'),
                (1, '1.2.0', 'Android', '失败', '2024-07-22 11:00', '3m 45s'),
                (2, '1.1.5', 'PC', '成功', '2024-07-20 14:15', '4m 58s'),
                (1, '1.2.1', 'iOS', '进行中', '2024-07-23 09:00', '-')
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM activities", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial activity data...');
              db.run(`INSERT INTO activities (type, description, timestamp) VALUES
                ('构建完成', '赛博朋克城市 v1.2.0 构建成功。', '2024-07-22 10:30'),
                ('新资产上传', '用户 Admin 上传了 角色模型_机器人A。', '2024-07-21 15:45'),
                ('项目更新', '奇幻冒险岛 项目状态更新为 测试阶段。', '2024-07-18 09:00'),
                ('任务完成', '像素地下城 地牢地图设计 任务完成。', '2024-07-22 14:00'),
                ('评论', '用户 Dev 在 太空殖民地 任务中添加了评论。', '2024-07-16 11:20')
              `);
            }
          });

          // Insert initial game data for player-facing games
          db.get("SELECT COUNT(*) as count FROM games", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial game data...');
              db.run(`INSERT INTO games (title, genre, developer, releaseDate, rating, description, coverImage, trailerVideo, screenshots, status) VALUES
                ('史诗冒险：失落的遗迹', '动作冒险', '幻想工作室', '2024-03-15', 4.8, '踏上一段史诗般的旅程，探索古老的遗迹，解开被遗忘的谜团，与强大的敌人作战。', '/placeholder.svg?height=720&width=1280&text=Game Cover 1', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '["/placeholder.svg?height=400&width=600&text=Screenshot 1-1", "/placeholder.svg?height=400&width=600&text=Screenshot 1-2"]', 'available'),
                ('星际争霸：新纪元', '即时战略', '未来科技', '2023-11-01', 4.5, '指挥你的星际舰队，在浩瀚的宇宙中建立帝国，征服星系。', '/placeholder.svg?height=720&width=1280&text=Game Cover 2', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '["/placeholder.svg?height=400&width=600&text=Screenshot 2-1", "/placeholder.svg?height=400&width=600&text=Screenshot 2-2"]', 'available'),
                ('魔法学院：巫师之路', '角色扮演', '神秘之境', '2024-06-20', 4.9, '进入魔法学院，学习强大的咒语，成为一名伟大的巫师。', '/placeholder.svg?height=720&width=1280&text=Game Cover 3', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '["/placeholder.svg?height=400&width=600&text=Screenshot 3-1", "/placeholder.svg?height=400&width=600&text=Screenshot 3-2"]', 'coming_soon'),
                ('像素地下城', 'Roguelike', '独立游戏', '2023-09-10', 4.2, '经典的像素风格地下城探险游戏，随机生成的地图和丰富的敌人。', '/placeholder.svg?height=720&width=1280&text=Game Cover 4', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '["/placeholder.svg?height=400&width=600&text=Screenshot 4-1", "/placeholder.svg?height=400&width=600&text=Screenshot 4-2"]', 'available')
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM game_history", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial game history data...');
              // Assuming userId 1 exists (e.g., from initial user registration)
              // Assuming gameId 1, 2, 4 exist from initial game data
              db.run(`INSERT INTO game_history (userId, gameId, playTime, lastPlayed) VALUES
                (1, 1, 120, '2024-07-28 10:00'),
                (1, 2, 60, '2024-07-27 15:30'),
                (1, 4, 45, '2024-07-26 20:00')
              `);
            }
          });

          db.get("SELECT COUNT(*) as count FROM achievements", (err, row) => {
            if (row.count === 0) {
              console.log('Inserting initial achievements data...');
              // Assuming userId 1 exists
              // Assuming gameId 1, 2 exist
              db.run(`INSERT INTO achievements (userId, gameId, name, description, unlockedAt) VALUES
                (1, 1, '遗迹探险家', '完成史诗冒险：失落的遗迹的第一个章节。', '2024-07-28 11:30'),
                (1, 2, '星际霸主', '在星际争霸：新纪元中赢得10场对战。', '2024-07-27 16:00'),
                (1, NULL, '新手上路', '首次登录游戏平台并浏览游戏库。', '2024-07-25 09:00')
              `);
            }
          });
          resolve(db); // Resolve the promise with the db instance
        });
      }
    });
  });
};

module.exports = {
  initDatabase
};
