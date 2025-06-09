class MemoApp {
    constructor() {
        this.memos = JSON.parse(localStorage.getItem('memos') || '[]');
        this.memoList = document.getElementById('memoList');
        this.addMemoBtn = document.getElementById('addMemo');
        this.clearAllBtn = document.getElementById('clearAll');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.sortBy = document.getElementById('sortBy');
        this.favoritesOnlyBtn = document.getElementById('favoritesOnly');
        this.exportBtn = document.getElementById('exportMemos');
        this.digitalClock = document.getElementById('digitalClock');
        this.searchQuery = '';
        this.currentCategory = '';
        this.currentSort = 'updated';
        this.showFavoritesOnly = false;
        
        this.init();
    }
    
    init() {
        this.addMemoBtn.addEventListener('click', () => this.addMemo());
        this.clearAllBtn.addEventListener('click', () => this.clearAllMemos());
        this.searchInput.addEventListener('input', (e) => this.searchMemos(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.categoryFilter.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        this.sortBy.addEventListener('change', (e) => this.setSortOrder(e.target.value));
        this.favoritesOnlyBtn.addEventListener('click', () => this.toggleFavoritesOnly());
        this.exportBtn.addEventListener('click', () => this.exportMemos());
        this.renderMemos();
        this.startClock();
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    addMemo() {
        const memo = {
            id: this.generateId(),
            content: '',
            category: 'その他',
            tags: [],
            isFavorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.memos.unshift(memo);
        this.saveMemos();
        this.renderMemos();
    }
    
    deleteMemo(id) {
        if (confirm('本当に削除しちゃう？😢')) {
            this.memos = this.memos.filter(memo => memo.id !== id);
            this.saveMemos();
            this.renderMemos();
        }
    }
    
    updateMemo(id, content) {
        const memo = this.memos.find(m => m.id === id);
        if (memo) {
            memo.content = content;
            memo.updatedAt = new Date().toISOString();
            this.extractTags(memo);
            this.saveMemos();
        }
    }
    
    updateMemoCategory(id, category) {
        const memo = this.memos.find(m => m.id === id);
        if (memo) {
            memo.category = category;
            memo.updatedAt = new Date().toISOString();
            this.saveMemos();
            this.renderMemos();
        }
    }
    
    toggleFavorite(id) {
        const memo = this.memos.find(m => m.id === id);
        if (memo) {
            memo.isFavorite = !memo.isFavorite;
            memo.updatedAt = new Date().toISOString();
            this.saveMemos();
            this.renderMemos();
        }
    }
    
    extractTags(memo) {
        const tagRegex = /#([\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g;
        const tags = [];
        let match;
        while ((match = tagRegex.exec(memo.content)) !== null) {
            tags.push(match[1]);
        }
        memo.tags = [...new Set(tags)];
    }
    
    clearAllMemos() {
        if (confirm('全部消えちゃうけど、本当にいいの？💔')) {
            this.memos = [];
            this.saveMemos();
            this.renderMemos();
        }
    }
    
    saveMemos() {
        localStorage.setItem('memos', JSON.stringify(this.memos));
    }
    
    searchMemos(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.renderMemos();
    }
    
    clearSearch() {
        this.searchQuery = '';
        this.searchInput.value = '';
        this.renderMemos();
    }
    
    filterByCategory(category) {
        this.currentCategory = category;
        this.renderMemos();
    }
    
    setSortOrder(sortBy) {
        this.currentSort = sortBy;
        this.renderMemos();
    }
    
    toggleFavoritesOnly() {
        this.showFavoritesOnly = !this.showFavoritesOnly;
        this.favoritesOnlyBtn.classList.toggle('active', this.showFavoritesOnly);
        this.renderMemos();
    }
    
    exportMemos() {
        const exportData = {
            memos: this.memos,
            exportDate: new Date().toISOString(),
            totalCount: this.memos.length
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
    
    formatDate(dateString) {
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
    }
    
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const dateStr = now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        });
        
        this.digitalClock.innerHTML = `${dateStr} ${hours}:${minutes}:${seconds}`;
    }
    
    renderMemos() {
        let filteredMemos = this.memos;
        
        // カテゴリフィルター
        if (this.currentCategory) {
            filteredMemos = filteredMemos.filter(memo => memo.category === this.currentCategory);
        }
        
        // お気に入りフィルター
        if (this.showFavoritesOnly) {
            filteredMemos = filteredMemos.filter(memo => memo.isFavorite);
        }
        
        // 検索フィルター
        if (this.searchQuery) {
            filteredMemos = filteredMemos.filter(memo => 
                memo.content.toLowerCase().includes(this.searchQuery) ||
                memo.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))
            );
        }
        
        // ソート
        filteredMemos.sort((a, b) => {
            switch (this.currentSort) {
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
        
        if (filteredMemos.length === 0) {
            let message;
            if (this.memos.length === 0) {
                message = 'まだメモがないよ〜「新しいメモ」を押してね！';
            } else if (this.showFavoritesOnly) {
                message = 'お気に入りのメモがないよ...⭐をタップしてお気に入り登録してね！';
            } else {
                message = '見つからなかったよ...別の言葉で試してみて！';
            }
            this.memoList.innerHTML = `
                <div class="empty-state">
                    <p>${message}</p>
                </div>
            `;
            return;
        }
        
        this.memoList.innerHTML = filteredMemos.map(memo => `
            <div class="memo-item ${memo.isFavorite ? 'favorite' : ''}">
                <div class="memo-header">
                    <div class="memo-meta">
                        <span class="memo-date">${this.formatDate(memo.updatedAt)}</span>
                        <select class="category-select" onchange="app.updateMemoCategory('${memo.id}', this.value)">
                            <option value="仕事" ${memo.category === '仕事' ? 'selected' : ''}>📋 仕事</option>
                            <option value="プライベート" ${memo.category === 'プライベート' ? 'selected' : ''}>🏠 プライベート</option>
                            <option value="アイデア" ${memo.category === 'アイデア' ? 'selected' : ''}>💡 アイデア</option>
                            <option value="買い物" ${memo.category === '買い物' ? 'selected' : ''}>🛍 買い物</option>
                            <option value="その他" ${memo.category === 'その他' ? 'selected' : ''}>📝 その他</option>
                        </select>
                    </div>
                    <div class="memo-actions">
                        <button class="btn btn-favorite btn-small ${memo.isFavorite ? 'active' : ''}" onclick="app.toggleFavorite('${memo.id}')">
                            ${memo.isFavorite ? '⭐' : '☆'}
                        </button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteMemo('${memo.id}')">
                            削除 💔
                        </button>
                    </div>
                </div>
                ${memo.tags.length > 0 ? `<div class="memo-tags">${memo.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : ''}
                <textarea 
                    class="memo-content" 
                    placeholder="メモを書いてね...💭 (#タグ で分類できます)"
                    onblur="app.updateMemo('${memo.id}', this.value)"
                    oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'"
                >${memo.content}</textarea>
            </div>
        `).join('');
        
        this.memoList.querySelectorAll('.memo-content').forEach(textarea => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MemoApp();
});