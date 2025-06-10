import React, { useState, useEffect, useCallback } from 'react';
import apiService from './services/api';
import Login from './components/Login';

const categories = [
  { value: '', label: 'すべてのカテゴリ' },
  { value: '仕事', label: '仕事' },
  { value: 'プライベート', label: 'プライベート' },
  { value: 'アイデア', label: 'アイデア' },
  { value: '買い物', label: '買い物' },
  { value: 'その他', label: 'その他' }
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

// カンバンカードコンポーネント
const KanbanCard = ({ todo, onDelete, onDragStart }) => {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  return (
    <div 
      className="kanban-card"
      draggable={true}
      onDragStart={(e) => onDragStart(e, todo)}
    >
      <div className="kanban-card-header">
        <span 
          className="kanban-priority" 
          style={{ backgroundColor: getPriorityColor(todo.priority) }}
        >
          {getPriorityLabel(todo.priority)}
        </span>
        <button 
          className="btn btn-danger btn-tiny"
          onClick={() => onDelete(todo.id)}
        >
          ×
        </button>
      </div>
      <h4 className="kanban-card-title">{todo.title}</h4>
      {todo.description && (
        <p className="kanban-card-description">{todo.description}</p>
      )}
      {todo.dueDate && (
        <div className="kanban-card-due-date">
          📅 {formatDate(todo.dueDate)}
        </div>
      )}
    </div>
  );
};

// カンバンカラムコンポーネント
const KanbanColumn = ({ title, status, todos, onDrop, onDragOver, onDelete, onDragStart }) => {
  return (
    <div 
      className="kanban-column"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="kanban-count">{todos.length}</span>
      </div>
      <div className="kanban-cards">
        {todos.map(todo => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            onDelete={onDelete}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
};

// Todoアイテムコンポーネント
const TodoItem = ({ todo, onDelete, onToggleCompleted }) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-header">
        <div className="todo-meta">
          <span className="todo-date">{formatDate(todo.createdAt)}</span>
          <span 
            className="todo-priority" 
            style={{ backgroundColor: getPriorityColor(todo.priority) }}
          >
            {getPriorityLabel(todo.priority)}
          </span>
          {todo.dueDate && (
            <span className="todo-due-date">
              期限: {new Date(todo.dueDate).toLocaleDateString('ja-JP')}
            </span>
          )}
        </div>
        <div className="todo-actions">
          <button 
            className={`btn btn-todo-toggle btn-small ${todo.completed ? 'completed' : ''}`}
            onClick={() => onToggleCompleted(todo.id)}
          >
            {todo.completed ? '✓' : '○'}
          </button>
          <button 
            className="btn btn-danger btn-small"
            onClick={() => onDelete(todo.id)}
          >
            削除
          </button>
        </div>
      </div>
      <div className="todo-content">
        <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
          {todo.title}
        </h3>
        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
      </div>
    </div>
  );
};

// メモアイテムコンポーネント
const MemoItem = ({ memo, onDelete, onToggleFavorite, onUpdateCategory, showSimilarity = false }) => {
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

  const handleCategoryChange = (e) => {
    onUpdateCategory(memo.id, e.target.value);
  };

  return (
    <div className={`memo-item ${memo.isFavorite ? 'favorite' : ''}`}>
      <div className="memo-header">
        <div className="memo-meta">
          <span className="memo-date">{formatDate(memo.updatedAt)}</span>
          {showSimilarity && memo.similarity && (
            <span className="similarity-score">
              類似度: {(memo.similarity * 100).toFixed(1)}%
            </span>
          )}
          <select 
            className="category-select" 
            value={memo.category}
            onChange={handleCategoryChange}
          >
            <option value="仕事">仕事</option>
            <option value="プライベート">プライベート</option>
            <option value="アイデア">アイデア</option>
            <option value="買い物">買い物</option>
            <option value="その他">その他</option>
          </select>
        </div>
        <div className="memo-actions">
          <button 
            className={`btn btn-favorite btn-small ${memo.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(memo.id)}
          >
            {memo.isFavorite ? '★' : '☆'}
          </button>
          <button 
            className="btn btn-danger btn-small"
            onClick={() => onDelete(memo.id)}
          >
            削除
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
      <div className="memo-content-display">
        {memo.content}
      </div>
    </div>
  );
};

// メインアプリコンポーネント
const App = () => {
  const [memos, setMemos] = useState([]);
  const [todos, setTodos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentSort, setCurrentSort] = useState('created');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isVectorSearch, setIsVectorSearch] = useState(false);
  const [vectorSearchResults, setVectorSearchResults] = useState([]);
  const [isVectorSearching, setIsVectorSearching] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('memos');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [draggedTodo, setDraggedTodo] = useState(null);

  // 初期化時にユーザー状態を確認
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ユーザーがログインしている場合のみメモとTodoを読み込み
  useEffect(() => {
    if (user) {
      loadMemos();
      loadTodos();
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

  const loadTodos = async () => {
    try {
      const todosData = await apiService.getTodos();
      setTodos(todosData);
    } catch (error) {
      console.error('Todoの読み込みに失敗しました:', error);
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
      setTodos([]); // Todoをクリア
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
      setTodos([]);
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

  // 自動タグ付けプレビューを実行
  const previewAutoTags = useCallback(async (content) => {
    if (!content || content.trim().length < 3) {
      setSuggestedTags([]);
      setSuggestedCategory('');
      return;
    }

    try {
      const result = await apiService.previewAutoTags(content);
      setSuggestedTags(result.suggestedTags || []);
      setSuggestedCategory(result.suggestedCategory || '');
    } catch (error) {
      console.error('自動タグプレビューエラー:', error);
      setSuggestedTags([]);
      setSuggestedCategory('');
    }
  }, []);

  // デバウンス付きの自動タグプレビュー
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      previewAutoTags(newMemoContent);
    }, 1000); // 1秒後に実行

    return () => clearTimeout(timeoutId);
  }, [newMemoContent, previewAutoTags]);

  // 一言メモを投稿
  const postQuickMemo = async () => {
    if (!newMemoContent.trim()) return;

    const newMemo = {
      id: generateId(),
      content: newMemoContent.trim(),
      category: suggestedCategory || 'その他', // 推奨カテゴリを使用
      tags: extractTags(newMemoContent), // 手動タグは保持、自動タグはサーバーで追加
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const response = await apiService.createMemo(newMemo);
      
      // サーバーから返された自動生成タグを含むメモデータを使用
      const updatedMemos = [response, ...memos];
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
      setNewMemoContent(''); // 入力欄をクリア
      setSuggestedTags([]); // 提案タグをクリア
      setSuggestedCategory(''); // 提案カテゴリをクリア
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
      // フォールバック: ローカルのみ更新
      const updatedMemos = [newMemo, ...memos];
      setMemos(updatedMemos);
      saveMemos(updatedMemos);
      setNewMemoContent(''); // 入力欄をクリア
      setSuggestedTags([]); // 提案タグをクリア
      setSuggestedCategory(''); // 提案カテゴリをクリア
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
    if (window.confirm('本当に削除しますか？')) {
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
    if (window.confirm('全てのメモを削除しますか？')) {
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
    setIsVectorSearch(false);
    setVectorSearchResults([]);
  };

  // ベクトル検索を実行
  const performVectorSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsVectorSearching(true);
    try {
      const result = await apiService.vectorSearch(searchQuery);
      setVectorSearchResults(result.memos || []);
      setIsVectorSearch(true);
    } catch (error) {
      console.error('ベクトル検索エラー:', error);
      setVectorSearchResults([]);
    } finally {
      setIsVectorSearching(false);
    }
  };

  // インデックス再構築
  const reindexMemos = async () => {
    try {
      setIsLoading(true);
      await apiService.reindexMemos();
      alert('メモのインデックスを再構築しました！');
    } catch (error) {
      console.error('インデックス再構築エラー:', error);
      alert('インデックスの再構築に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // Todo関連の関数

  // ID生成関数を再利用
  const generateTodoId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 新しいTodoを追加
  const addTodo = async () => {
    if (!newTodoTitle.trim()) return;

    const newTodo = {
      id: generateTodoId(),
      title: newTodoTitle.trim(),
      description: newTodoDescription.trim(),
      completed: false,
      status: 'todo', // デフォルトは「未着手」
      priority: newTodoPriority,
      dueDate: newTodoDueDate || null,
      category: 'その他',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const response = await apiService.createTodo(newTodo);
      const updatedTodos = [response, ...todos];
      setTodos(updatedTodos);
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoPriority('medium');
      setNewTodoDueDate('');
    } catch (error) {
      console.error('Todoの作成に失敗しました:', error);
      // フォールバック: ローカルのみ更新
      const updatedTodos = [newTodo, ...todos];
      setTodos(updatedTodos);
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoPriority('medium');
      setNewTodoDueDate('');
    }
  };

  // Todoのステータスを変更
  const updateTodoStatus = async (id, newStatus) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = {
      ...todo,
      status: newStatus,
      completed: newStatus === 'done',
      updatedAt: new Date().toISOString()
    };

    try {
      await apiService.updateTodo(id, updatedTodo);
      const updatedTodos = todos.map(t => t.id === id ? updatedTodo : t);
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Todo状態の更新に失敗しました:', error);
      const updatedTodos = todos.map(t => t.id === id ? updatedTodo : t);
      setTodos(updatedTodos);
    }
  };

  // ドラッグ&ドロップ関数
  const handleDragStart = (e, todo) => {
    setDraggedTodo(todo);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTodo && draggedTodo.status !== newStatus) {
      updateTodoStatus(draggedTodo.id, newStatus);
    }
    setDraggedTodo(null);
  };

  // Todoを削除
  const deleteTodo = async (id) => {
    if (window.confirm('本当に削除しますか？')) {
      try {
        await apiService.deleteTodo(id);
        const updatedTodos = todos.filter(todo => todo.id !== id);
        setTodos(updatedTodos);
      } catch (error) {
        console.error('Todoの削除に失敗しました:', error);
        const updatedTodos = todos.filter(todo => todo.id !== id);
        setTodos(updatedTodos);
      }
    }
  };

  // 全Todoを削除
  const clearAllTodos = async () => {
    if (window.confirm('全てのTodoを削除しますか？')) {
      try {
        await apiService.deleteAllTodos();
        setTodos([]);
      } catch (error) {
        console.error('全Todoの削除に失敗しました:', error);
        setTodos([]);
      }
    }
  };

  // Enterキーで投稿
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'memos') {
        postQuickMemo();
      } else {
        addTodo();
      }
    }
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

  const filteredMemos = isVectorSearch ? vectorSearchResults : getFilteredAndSortedMemos();

  const getEmptyMessage = () => {
    if (memos.length === 0) {
      return 'メモがありません。「新しいメモ」ボタンで作成してください。';
    } else if (showFavoritesOnly) {
      return 'お気に入りのメモがありません。★ボタンでお気に入りに登録してください。';
    } else {
      return '検索結果がありません。別のキーワードで試してください。';
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
        
        {/* タブ切り替え */}
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'memos' ? 'active' : ''}`}
            onClick={() => setActiveTab('memos')}
          >
            📝 メモ
          </button>
          <button 
            className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            ✅ Todo
          </button>
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
          <button 
            className="btn btn-info" 
            onClick={performVectorSearch}
            disabled={!searchQuery.trim() || isVectorSearching}
          >
            {isVectorSearching ? '検索中...' : 'AI検索'}
          </button>
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
            ★ お気に入りのみ
          </button>
        </div>
      </div>

      {/* クイック入力セクション */}
      {activeTab === 'memos' ? (
        <div className="quick-memo-section">
          <div className="quick-memo-container">
            <input 
              type="text" 
              className="quick-memo-input" 
              placeholder="今何してる？一言メモを投稿..."
              value={newMemoContent}
              onChange={(e) => setNewMemoContent(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="btn btn-primary" 
              onClick={postQuickMemo}
              disabled={!newMemoContent.trim()}
            >
              投稿
            </button>
          </div>
          
          {/* 自動タグプレビュー */}
          {(suggestedTags.length > 0 || suggestedCategory) && (
            <div className="auto-tag-preview">
              {suggestedCategory && (
                <div className="suggested-category">
                  <span className="preview-label">推奨カテゴリ:</span>
                  <span className="preview-category">{suggestedCategory}</span>
                </div>
              )}
              {suggestedTags.length > 0 && (
                <div className="suggested-tags">
                  <span className="preview-label">自動タグ:</span>
                  <div className="preview-tags">
                    {suggestedTags.map(tag => (
                      <span key={tag} className="preview-tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="quick-todo-section">
          <div className="quick-todo-container">
            <input 
              type="text" 
              className="quick-todo-input" 
              placeholder="新しいTodoのタイトル..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <select 
              className="priority-select"
              value={newTodoPriority}
              onChange={(e) => setNewTodoPriority(e.target.value)}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
            <button 
              className="btn btn-primary" 
              onClick={addTodo}
              disabled={!newTodoTitle.trim()}
            >
              追加
            </button>
          </div>
          
          {/* Todo詳細入力 */}
          <div className="todo-details">
            <textarea 
              className="todo-description-input"
              placeholder="詳細説明（任意）"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              rows="2"
            />
            <input 
              type="date" 
              className="todo-due-date-input"
              placeholder="期限日"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="memo-controls">
        <button className="btn btn-info" onClick={exportMemos}>
          エクスポート
        </button>
        {activeTab === 'memos' && (
          <button className="btn btn-secondary" onClick={reindexMemos}>
            AI検索を更新
          </button>
        )}
        <button 
          className="btn btn-danger" 
          onClick={activeTab === 'memos' ? clearAllMemos : clearAllTodos}
        >
          全て削除
        </button>
      </div>
      
      <div className="memo-list">
        {activeTab === 'memos' ? (
          filteredMemos.length === 0 ? (
            <div className="empty-state">
              <p>{getEmptyMessage()}</p>
            </div>
          ) : (
            filteredMemos.map(memo => (
              <MemoItem
                key={memo.id}
                memo={memo}
                onDelete={deleteMemo}
                onToggleFavorite={toggleFavorite}
                onUpdateCategory={updateMemoCategory}
                showSimilarity={isVectorSearch}
              />
            ))
          )
        ) : (
          todos.length === 0 ? (
            <div className="empty-state">
              <p>Todoがありません。新しいTodoを追加してください。</p>
            </div>
          ) : (
            <div className="kanban-board">
              <KanbanColumn
                title="📋 未着手"
                status="todo"
                todos={todos.filter(t => t.status === 'todo')}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDelete={deleteTodo}
                onDragStart={handleDragStart}
              />
              <KanbanColumn
                title="🚧 進行中"
                status="inprogress"
                todos={todos.filter(t => t.status === 'inprogress')}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDelete={deleteTodo}
                onDragStart={handleDragStart}
              />
              <KanbanColumn
                title="✅ 完了"
                status="done"
                todos={todos.filter(t => t.status === 'done')}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDelete={deleteTodo}
                onDragStart={handleDragStart}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default App;