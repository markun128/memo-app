const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const vectorSearchService = require('../vectorSearch');
const autoTagger = require('../autoTagger');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ミドルウェア
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'memo-app-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24時間
}));

// データベース接続
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('SQLiteデータベースに接続しました');
    initDatabase();
  }
});

// データベース初期化
function initDatabase() {
  // ユーザーテーブル作成
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `;

  // メモテーブル作成（ユーザーIDを追加）
  const createMemosTableQuery = `
    CREATE TABLE IF NOT EXISTS memos (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'その他',
      tags TEXT DEFAULT '[]',
      isFavorite INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `;

  db.run(createUsersTableQuery, (err) => {
    if (err) {
      console.error('usersテーブル作成エラー:', err.message);
    } else {
      console.log('usersテーブルが作成されました');
    }
  });

  // Todoテーブル作成
  const createTodosTableQuery = `
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      dueDate TEXT,
      category TEXT DEFAULT 'その他',
      tags TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `;

  db.run(createMemosTableQuery, (err) => {
    if (err) {
      console.error('memosテーブル作成エラー:', err.message);
    } else {
      console.log('memosテーブルが作成されました');
    }
  });

  db.run(createTodosTableQuery, (err) => {
    if (err) {
      console.error('todosテーブル作成エラー:', err.message);
    } else {
      console.log('todosテーブルが作成されました');
    }
  });
}

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'アクセストークンが必要です' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '無効なトークンです' });
    }
    req.user = user;
    next();
  });
};

// 認証系APIエンドポイント

// ユーザー登録
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, displayName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'ユーザー名、メール、パスワードは必須です' });
  }

  try {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const query = `
      INSERT INTO users (username, email, password, displayName, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [username, email, hashedPassword, displayName || username, now, now], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に使用されています' });
        }
        console.error('ユーザー登録エラー:', err.message);
        return res.status(500).json({ error: 'ユーザー登録に失敗しました' });
      }

      const userId = this.lastID;
      const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });

      res.status(201).json({
        message: 'ユーザー登録が完了しました',
        token,
        user: { id: userId, username, email, displayName: displayName || username }
      });
    });
  } catch (error) {
    console.error('パスワードハッシュ化エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ログイン
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
  }

  const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
  
  db.get(query, [username, username], async (err, user) => {
    if (err) {
      console.error('ログインエラー:', err.message);
      return res.status(500).json({ error: 'ログインに失敗しました' });
    }

    if (!user) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        message: 'ログインしました',
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          displayName: user.displayName 
        }
      });
    } catch (error) {
      console.error('パスワード検証エラー:', error);
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });
});

// ユーザー情報取得
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const query = 'SELECT id, username, email, displayName FROM users WHERE id = ?';
  
  db.get(query, [req.user.userId], (err, user) => {
    if (err) {
      console.error('ユーザー情報取得エラー:', err.message);
      return res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
    }

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user });
  });
});

// メモ関連APIエンドポイント

// 全メモを取得（ログインユーザーのみ）
app.get('/api/memos', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM memos WHERE userId = ? ORDER BY updatedAt DESC';
  
  db.all(query, [req.user.userId], (err, rows) => {
    if (err) {
      console.error('メモ取得エラー:', err.message);
      res.status(500).json({ error: 'メモの取得に失敗しました' });
      return;
    }
    
    // tagsを配列に変換
    const memos = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      isFavorite: Boolean(row.isFavorite)
    }));
    
    res.json(memos);
  });
});

// メモを作成
app.post('/api/memos', authenticateToken, (req, res) => {
  const { id, content, category, tags, isFavorite, createdAt, updatedAt } = req.body;
  
  // 自動タグ付けを実行
  const autoTagResult = autoTagger.autoTag(content || '');
  
  // 既存のタグと自動生成されたタグをマージ
  const existingTags = tags || [];
  const allTags = [...new Set([...existingTags, ...autoTagResult.tags])];
  
  // カテゴリが指定されていない場合は自動推定を使用
  const finalCategory = category || autoTagResult.suggestedCategory;
  
  const query = `
    INSERT INTO memos (id, userId, content, category, tags, isFavorite, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    req.user.userId,
    content,
    finalCategory,
    JSON.stringify(allTags),
    isFavorite ? 1 : 0,
    createdAt,
    updatedAt
  ];
  
  db.run(query, params, async function(err) {
    if (err) {
      console.error('メモ作成エラー:', err.message);
      res.status(500).json({ error: 'メモの作成に失敗しました' });
      return;
    }
    
    // ベクトルインデックスに追加
    try {
      if (content && content.trim().length > 0) {
        await vectorSearchService.indexMemo(id, content);
      }
    } catch (indexError) {
      console.error('ベクトルインデックス追加エラー:', indexError);
      // インデックスエラーは致命的ではないのでレスポンスは継続
    }
    
    res.status(201).json({
      id,
      userId: req.user.userId,
      content,
      category: finalCategory,
      tags: allTags,
      isFavorite: Boolean(isFavorite),
      createdAt,
      updatedAt,
      autoGeneratedTags: autoTagResult.tags // 自動生成されたタグを別途返す
    });
  });
});

// メモを更新
app.put('/api/memos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content, category, tags, isFavorite, updatedAt } = req.body;
  
  const query = `
    UPDATE memos 
    SET content = ?, category = ?, tags = ?, isFavorite = ?, updatedAt = ?
    WHERE id = ? AND userId = ?
  `;
  
  const params = [
    content,
    category,
    JSON.stringify(tags),
    isFavorite ? 1 : 0,
    updatedAt,
    id,
    req.user.userId
  ];
  
  db.run(query, params, async function(err) {
    if (err) {
      console.error('メモ更新エラー:', err.message);
      res.status(500).json({ error: 'メモの更新に失敗しました' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'メモが見つかりません' });
      return;
    }
    
    // ベクトルインデックスを更新
    try {
      if (content && content.trim().length > 0) {
        await vectorSearchService.indexMemo(id, content);
      } else {
        vectorSearchService.removeMemo(id);
      }
    } catch (indexError) {
      console.error('ベクトルインデックス更新エラー:', indexError);
    }
    
    res.json({
      id,
      content,
      category,
      tags,
      isFavorite: Boolean(isFavorite),
      updatedAt
    });
  });
});

// メモを削除
app.delete('/api/memos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM memos WHERE id = ? AND userId = ?';
  
  db.run(query, [id, req.user.userId], function(err) {
    if (err) {
      console.error('メモ削除エラー:', err.message);
      res.status(500).json({ error: 'メモの削除に失敗しました' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'メモが見つかりません' });
      return;
    }
    
    // ベクトルインデックスからも削除
    try {
      vectorSearchService.removeMemo(id);
    } catch (indexError) {
      console.error('ベクトルインデックス削除エラー:', indexError);
    }
    
    res.json({ message: 'メモが削除されました', deletedId: id });
  });
});

// 全メモを削除
app.delete('/api/memos', authenticateToken, (req, res) => {
  const query = 'DELETE FROM memos WHERE userId = ?';
  
  db.run(query, [req.user.userId], function(err) {
    if (err) {
      console.error('全メモ削除エラー:', err.message);
      res.status(500).json({ error: '全メモの削除に失敗しました' });
      return;
    }
    
    res.json({ message: '全てのメモが削除されました', deletedCount: this.changes });
  });
});

// エクスポート用エンドポイント
app.get('/api/export', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM memos WHERE userId = ? ORDER BY updatedAt DESC';
  
  db.all(query, [req.user.userId], (err, rows) => {
    if (err) {
      console.error('エクスポートエラー:', err.message);
      res.status(500).json({ error: 'データのエクスポートに失敗しました' });
      return;
    }
    
    const memos = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      isFavorite: Boolean(row.isFavorite)
    }));
    
    const exportData = {
      memos,
      user: req.user.username,
      exportDate: new Date().toISOString(),
      totalCount: memos.length
    };
    
    res.json(exportData);
  });
});

// ベクトル検索エンドポイント
app.post('/api/search/vector', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: '検索クエリが必要です' });
    }

    // ベクトル検索を実行
    const searchResults = await vectorSearchService.searchSimilar(query, limit);
    
    if (searchResults.length === 0) {
      return res.json({ memos: [], message: '類似するメモが見つかりませんでした' });
    }

    // メモIDから実際のメモデータを取得
    const memoIds = searchResults.map(result => result.id);
    const placeholders = memoIds.map(() => '?').join(',');
    
    const sql = `
      SELECT id, content, category, tags, isFavorite, createdAt, updatedAt 
      FROM memos 
      WHERE user_id = ? AND id IN (${placeholders})
    `;
    
    db.all(sql, [req.user.id, ...memoIds], (err, rows) => {
      if (err) {
        console.error('ベクトル検索でのメモ取得エラー:', err);
        return res.status(500).json({ error: 'メモの取得に失敗しました' });
      }

      // 類似度でソートして返す
      const memosWithSimilarity = searchResults.map(searchResult => {
        const memo = rows.find(row => row.id === searchResult.id);
        if (memo) {
          return {
            ...memo,
            tags: JSON.parse(memo.tags || '[]'),
            isFavorite: Boolean(memo.isFavorite),
            similarity: searchResult.similarity
          };
        }
        return null;
      }).filter(Boolean);

      res.json({ 
        memos: memosWithSimilarity,
        query: query,
        totalResults: memosWithSimilarity.length
      });
    });

  } catch (error) {
    console.error('ベクトル検索エラー:', error);
    res.status(500).json({ error: 'ベクトル検索に失敗しました' });
  }
});

// 自動タグ付けプレビューエンドポイント
app.post('/api/auto-tag/preview', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'コンテンツが必要です' });
    }

    const autoTagResult = autoTagger.autoTag(content);
    
    res.json({
      content,
      suggestedTags: autoTagResult.tags,
      suggestedCategory: autoTagResult.suggestedCategory,
      preview: true
    });

  } catch (error) {
    console.error('自動タグ付けプレビューエラー:', error);
    res.status(500).json({ error: '自動タグ付けに失敗しました' });
  }
});

// メモインデックス再構築エンドポイント
app.post('/api/search/reindex', authenticateToken, async (req, res) => {
  try {
    const sql = 'SELECT id, content FROM memos WHERE user_id = ?';
    
    db.all(sql, [req.user.id], async (err, rows) => {
      if (err) {
        console.error('インデックス再構築でのメモ取得エラー:', err);
        return res.status(500).json({ error: 'メモの取得に失敗しました' });
      }

      // 既存のインデックスをクリア
      vectorSearchService.clearIndex();

      // 全メモを再インデックス
      const indexPromises = rows.map(row => 
        vectorSearchService.indexMemo(row.id, row.content)
      );

      await Promise.all(indexPromises);

      res.json({ 
        message: 'インデックスを再構築しました',
        indexedCount: rows.length 
      });
    });

  } catch (error) {
    console.error('インデックス再構築エラー:', error);
    res.status(500).json({ error: 'インデックスの再構築に失敗しました' });
  }
});

// Todo関連APIエンドポイント

// 全Todoを取得（ログインユーザーのみ）
app.get('/api/todos', authenticateToken, (req, res) => {
  const query = 'SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC';
  
  db.all(query, [req.user.userId], (err, rows) => {
    if (err) {
      console.error('Todo取得エラー:', err.message);
      res.status(500).json({ error: 'Todoの取得に失敗しました' });
      return;
    }
    
    const todos = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      completed: Boolean(row.completed)
    }));
    
    res.json(todos);
  });
});

// Todoを作成
app.post('/api/todos', authenticateToken, (req, res) => {
  const { id, title, description, status, priority, dueDate, category, tags, createdAt, updatedAt } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'タイトルは必須です' });
  }
  
  const query = `
    INSERT INTO todos (id, userId, title, description, completed, status, priority, dueDate, category, tags, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    req.user.userId,
    title.trim(),
    description || '',
    0, // 初期状態は未完了
    status || 'todo', // デフォルトは「未着手」
    priority || 'medium',
    dueDate || null,
    category || 'その他',
    JSON.stringify(tags || []),
    createdAt,
    updatedAt
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Todo作成エラー:', err.message);
      res.status(500).json({ error: 'Todoの作成に失敗しました' });
      return;
    }
    
    res.status(201).json({
      id,
      userId: req.user.userId,
      title: title.trim(),
      description: description || '',
      completed: false,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: category || 'その他',
      tags: tags || [],
      createdAt,
      updatedAt
    });
  });
});

// Todoを更新
app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, completed, status, priority, dueDate, category, tags, updatedAt } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'タイトルは必須です' });
  }
  
  const query = `
    UPDATE todos 
    SET title = ?, description = ?, completed = ?, status = ?, priority = ?, dueDate = ?, category = ?, tags = ?, updatedAt = ?
    WHERE id = ? AND userId = ?
  `;
  
  const params = [
    title.trim(),
    description || '',
    completed ? 1 : 0,
    status || 'todo',
    priority || 'medium',
    dueDate || null,
    category || 'その他',
    JSON.stringify(tags || []),
    updatedAt,
    id,
    req.user.userId
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Todo更新エラー:', err.message);
      res.status(500).json({ error: 'Todoの更新に失敗しました' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Todoが見つかりません' });
      return;
    }
    
    res.json({
      id,
      title: title.trim(),
      description: description || '',
      completed: Boolean(completed),
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: category || 'その他',
      tags: tags || [],
      updatedAt
    });
  });
});

// Todoを削除
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM todos WHERE id = ? AND userId = ?';
  
  db.run(query, [id, req.user.userId], function(err) {
    if (err) {
      console.error('Todo削除エラー:', err.message);
      res.status(500).json({ error: 'Todoの削除に失敗しました' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Todoが見つかりません' });
      return;
    }
    
    res.json({ message: 'Todoが削除されました', deletedId: id });
  });
});

// 全Todoを削除
app.delete('/api/todos', authenticateToken, (req, res) => {
  const query = 'DELETE FROM todos WHERE userId = ?';
  
  db.run(query, [req.user.userId], function(err) {
    if (err) {
      console.error('全Todo削除エラー:', err.message);
      res.status(500).json({ error: '全Todoの削除に失敗しました' });
      return;
    }
    
    res.json({ message: '全てのTodoが削除されました', deletedCount: this.changes });
  });
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'サーバーは正常に動作しています' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('サーバーを終了しています...');
  db.close((err) => {
    if (err) {
      console.error('データベース切断エラー:', err.message);
    } else {
      console.log('データベース接続を切断しました');
    }
    process.exit(0);
  });
});