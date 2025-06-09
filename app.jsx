const { useState, useEffect, useCallback } = React;

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
const MemoApp = () => {
  const [memos, setMemos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentSort, setCurrentSort] = useState('updated');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ローカルストレージからメモを読み込み
  useEffect(() => {
    const savedMemos = localStorage.getItem('memos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
  }, []);

  // メモをローカルストレージに保存
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
  const addMemo = () => {
    const newMemo = {
      id: generateId(),
      content: '',
      category: 'その他',
      tags: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedMemos = [newMemo, ...memos];
    setMemos(updatedMemos);
    saveMemos(updatedMemos);
  };

  // メモを更新
  const updateMemo = (id, content) => {
    const updatedMemos = memos.map(memo => {
      if (memo.id === id) {
        return {
          ...memo,
          content,
          tags: extractTags(content),
          updatedAt: new Date().toISOString()
        };
      }
      return memo;
    });
    setMemos(updatedMemos);
    saveMemos(updatedMemos);
  };

  // メモのカテゴリを更新
  const updateMemoCategory = (id, category) => {
    const updatedMemos = memos.map(memo => {
      if (memo.id === id) {
        return {
          ...memo,
          category,
          updatedAt: new Date().toISOString()
        };
      }
      return memo;
    });
    setMemos(updatedMemos);
    saveMemos(updatedMemos);
  };

  // お気に入り切り替え
  const toggleFavorite = (id) => {
    const updatedMemos = memos.map(memo => {
      if (memo.id === id) {
        return {
          ...memo,
          isFavorite: !memo.isFavorite,
          updatedAt: new Date().toISOString()
        };
      }
      return memo;
    });
    setMemos(updatedMemos);
    saveMemos(updatedMemos);
  };

  // メモを削除
  const deleteMemo = (id) => {
    if (confirm('本当に削除しちゃう？😢')) {
      const updatedMemos = memos.filter(memo => memo.id !== id);
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
    }
  };

  // 全メモを削除
  const clearAllMemos = () => {
    if (confirm('全部消えちゃうけど、本当にいいの？💔')) {
      setMemos([]);
      saveMemos([]);
    }
  };

  // エクスポート
  const exportMemos = () => {
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

  return (
    <div className="container">
      <header>
        <DigitalClock />
        <h1>スマートメモ帳</h1>
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

// アプリをレンダリング
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MemoApp />);