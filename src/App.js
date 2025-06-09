import React, { useState, useEffect, useCallback } from 'react';
import apiService from './services/api';
import Login from './components/Login';

const categories = [
  { value: '', label: 'すべてのカテゴリ' },
  { value: '仕事', label: '📋 仕事' },
  { value: 'プライベート', label: '🏠 プライベート' },
  { value: 'アイデア', label: '💡 アイデア' },
  { value: '買い物', label: '🛒 買い物' },
  { value: 'その他', label: '📝 その他' }
];

const sortOptions = [
  { value: 'updated', label: '更新日順' },
  { value: 'created', label: '作成日順' },
  { value: 'alphabetical', label: '文字順' },
  { value: 'favorites', label: 'お気に入り順' }
];

// デジタル時計コンポーネント
const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const dateStr = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="digital-clock">
      {formatTime(time)}
    </div>
  );
};

// メモアイテムコンポーネント
const MemoItem = ({ memo, onUpdate, onDelete, onToggleFavorite, onUpdateCategory }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const handleContentChange = (e) => {
    onUpdate(memo.id, e.target.value);
  };

  const handleCategoryChange = (e) => {
    onUpdateCategory(memo.id, e.target.value);
  };

  const handleTextareaResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  useEffect(() => {
    const textareas = document.querySelectorAll('.memo-content');
    textareas.forEach(textarea => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  });

  return (
    <div className={`memo-item ${memo.isFavorite ? 'favorite' : ''}`}>
      <div className="memo-header">
        <div className="memo-meta">
          <span className="memo-date">{formatDate(memo.updatedAt)}</span>
          <select 
            className="category-select" 
            value={memo.category}
            onChange={handleCategoryChange}
          >
            <option value="仕事">📋 仕事</option>
            <option value="プライベート">🏠 プライベート</option>
            <option value="アイデア">💡 アイデア</option>
            <option value="買い物">🛒 買い物</option>
            <option value="その他">📝 その他</option>
          </select>
        </div>
        <div className="memo-actions">
          <button 
            className={`btn btn-favorite btn-small ${memo.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(memo.id)}
          >
            {memo.isFavorite ? '⭐' : '☆'}
          </button>
          <button 
            className="btn btn-danger btn-small"
            onClick={() => onDelete(memo.id)}
          >
            削除 💔
          </button>
        </div>
      </div>
      {memo.tags.length > 0 && (
        <div className="memo-tags">
          {memo.tags.map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      )}
      <textarea 
        className="memo-content"
        placeholder="メモを書いてね...💭 (#タグ で分類できます)"
        value={memo.content}
        onChange={handleContentChange}
        onInput={handleTextareaResize}
      />
    </div>
  );
};

// メインアプリコンポーネント
const App = () => {
  const [memos, setMemos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentSort, setCurrentSort] = useState('updated');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // 初期化時にユーザー状態を確認
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ユーザーがログインしている場合のみメモを読み込み
  useEffect(() => {
    if (user) {
      loadMemos();
    }
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await apiService.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      console.error('認証確認エラー:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemos = async () => {
    try {
      const memosData = await apiService.getMemos();
      setMemos(memosData);
    } catch (error) {
      console.error('メモの読み込みに失敗しました:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        // 認証エラーの場合、ログアウト処理
        handleLogout();
      }
    }
  };

  const handleLogin = async (username, password, email, displayName) => {
    setAuthLoading(true);
    try {
      let response;
      if (email) {
        // 登録モード
        response = await apiService.register(username, email, password, displayName);
      } else {
        // ログインモード
        response = await apiService.login(username, password);
      }
      
      setUser(response.user);
      setMemos([]); // メモをクリア
    } catch (error) {
      console.error('認証エラー:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setMemos([]);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // メモをサーバーに保存（フォールバック付き）
  const saveMemos = useCallback((memosToSave) => {
    localStorage.setItem('memos', JSON.stringify(memosToSave));
  }, []);

  // ID生成
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // タグ抽出
  const extractTags = (content) => {
    const tagRegex = /#([\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return [...new Set(tags)];
  };

  // 新しいメモを追加
  const addMemo = async () => {
    const newMemo = {
      id: generateId(),
      content: '',
      category: 'その他',
      tags: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await apiService.createMemo(newMemo);
      const updatedMemos = [newMemo, ...memos];
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
      // フォールバック: ローカルのみ更新
      const updatedMemos = [newMemo, ...memos];
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    }
  };

  // メモを更新
  const updateMemo = async (id, content) => {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;

    const updatedMemo = {
      ...memo,
      content,
      tags: extractTags(content),
      updatedAt: new Date().toISOString()
    };

    try {
      await apiService.updateMemo(id, updatedMemo);
      const updatedMemos = memos.map(m => m.id === id ? updatedMemo : m);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    } catch (error) {
      console.error('メモの更新に失敗しました:', error);
      // フォールバック: ローカルのみ更新
      const updatedMemos = memos.map(m => m.id === id ? updatedMemo : m);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    }
  };

  // メモのカテゴリを更新
  const updateMemoCategory = async (id, category) => {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;

    const updatedMemo = {
      ...memo,
      category,
      updatedAt: new Date().toISOString()
    };

    try {
      await apiService.updateMemo(id, updatedMemo);
      const updatedMemos = memos.map(m => m.id === id ? updatedMemo : m);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    } catch (error) {
      console.error('カテゴリの更新に失敗しました:', error);
      const updatedMemos = memos.map(m => m.id === id ? updatedMemo : m);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    }
  };

  // お気に入り切り替え
  const toggleFavorite = async (id) => {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;

    const updatedMemo = {
      ...memo,
      isFavorite: !memo.isFavorite,
      updatedAt: new Date().toISOString()
    };

    try {
      await apiService.updateMemo(id, updatedMemo);
      const updatedMemos = memos.map(m => m.id === id ? updatedMemo : m);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    } catch (error) {
      console.error('お気に入りの更新に失敗しました:', error);
      const updatedMemos = memos.map(m => m.id === id ? updatedMemo : m);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    }
  };

  // メモを削除
  const deleteMemo = async (id) => {
    if (window.confirm('本当に削除しちゃう？😢')) {
      try {
        await apiService.deleteMemo(id);
        const updatedMemos = memos.filter(memo => memo.id !== id);
        setMemos(updatedMemos);
        saveMemos(updatedMemos);
      } catch (error) {
        console.error('メモの削除に失敗しました:', error);
        const updatedMemos = memos.filter(memo => memo.id !== id);
        setMemos(updatedMemos);
        saveMemos(updatedMemos);
      }
    }
  };

  // 全メモを削除
  const clearAllMemos = async () => {
    if (window.confirm('全部消えちゃうけど、本当にいいの？💔')) {
      try {
        await apiService.deleteAllMemos();
        setMemos([]);
        saveMemos([]);
      } catch (error) {
        console.error('全メモの削除に失敗しました:', error);
        setMemos([]);
        saveMemos([]);
      }
    }
  };

  // エクスポート
  const exportMemos = async () => {
    try {
      const exportData = await apiService.exportMemos();
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `メモデータ_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('エクスポートに失敗しました:', error);
      // フォールバック: ローカルデータをエクスポート
      const exportData = {
        memos,
        exportDate: new Date().toISOString(),
        totalCount: memos.length
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `メモデータ_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // 検索をクリア
  const clearSearch = () => {
    setSearchQuery('');
  };

  // お気に入りフィルターを切り替え
  const toggleFavoritesOnly = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  // フィルタリングとソート
  const getFilteredAndSortedMemos = () => {
    let filtered = memos;

    // カテゴリフィルター
    if (currentCategory) {
      filtered = filtered.filter(memo => memo.category === currentCategory);
    }

    // お気に入りフィルター
    if (showFavoritesOnly) {
      filtered = filtered.filter(memo => memo.isFavorite);
    }

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(memo => 
        memo.content.toLowerCase().includes(query) ||
        memo.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // ソート
    filtered.sort((a, b) => {
      switch (currentSort) {
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'alphabetical':
          return a.content.localeCompare(b.content);
        case 'favorites':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default: // 'updated'
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    return filtered;
  };

  const filteredMemos = getFilteredAndSortedMemos();

  const getEmptyMessage = () => {
    if (memos.length === 0) {
      return 'まだメモがないよ〜「新しいメモ」を押してね！';
    } else if (showFavoritesOnly) {
      return 'お気に入りのメモがないよ...⭐をタップしてお気に入り登録してね！';
    } else {
      return '見つからなかったよ...別の言葉で試してみて！';
    }
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  // ログインしていない場合の表示
  if (!user) {
    return <Login onLogin={handleLogin} isLoading={authLoading} />;
  }

  return (
    <div className="container">
      <header>
        <DigitalClock />
        <div className="header-content">
          <h1>スマートメモ帳</h1>
          <div className="user-info">
            <span>こんにちは、{user.displayName}さん！</span>
            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </header>
      
      <div className="smart-controls">
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="メモを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={clearSearch}>
            クリア
          </button>
        </div>
        
        <div className="filter-container">
          <select 
            className="filter-select"
            value={currentCategory}
            onChange={(e) => setCurrentCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <select 
            className="filter-select"
            value={currentSort}
            onChange={(e) => setCurrentSort(e.target.value)}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <button 
            className={`btn btn-filter ${showFavoritesOnly ? 'active' : ''}`}
            onClick={toggleFavoritesOnly}
          >
            ⭐ お気に入りのみ
          </button>
        </div>
      </div>
      
      <div className="memo-controls">
        <button className="btn btn-primary" onClick={addMemo}>
          新しいメモ
        </button>
        <button className="btn btn-info" onClick={exportMemos}>
          📤 エクスポート
        </button>
        <button className="btn btn-danger" onClick={clearAllMemos}>
          全て削除
        </button>
      </div>
      
      <div className="memo-list">
        {filteredMemos.length === 0 ? (
          <div className="empty-state">
            <p>{getEmptyMessage()}</p>
          </div>
        ) : (
          filteredMemos.map(memo => (
            <MemoItem
              key={memo.id}
              memo={memo}
              onUpdate={updateMemo}
              onDelete={deleteMemo}
              onToggleFavorite={toggleFavorite}
              onUpdateCategory={updateMemoCategory}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default App;