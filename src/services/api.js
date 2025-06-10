const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 認証関連のAPI
  async register(username, email, password, displayName) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setToken(null);
    return { message: 'ログアウトしました' };
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // メモ関連のAPI
  async getMemos() {
    return this.request('/memos');
  }

  async createMemo(memo) {
    return this.request('/memos', {
      method: 'POST',
      body: JSON.stringify(memo),
    });
  }

  async updateMemo(id, memo) {
    return this.request(`/memos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memo),
    });
  }

  async deleteMemo(id) {
    return this.request(`/memos/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllMemos() {
    return this.request('/memos', {
      method: 'DELETE',
    });
  }

  async exportMemos() {
    return this.request('/export');
  }

  async vectorSearch(query, limit = 10) {
    return this.request('/search/vector', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  async reindexMemos() {
    return this.request('/search/reindex', {
      method: 'POST',
    });
  }

  async previewAutoTags(content) {
    return this.request('/auto-tag/preview', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Todo関連のAPI
  async getTodos() {
    return this.request('/todos');
  }

  async createTodo(todo) {
    return this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(todo),
    });
  }

  async updateTodo(id, todo) {
    return this.request(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todo),
    });
  }

  async deleteTodo(id) {
    return this.request(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllTodos() {
    return this.request('/todos', {
      method: 'DELETE',
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();