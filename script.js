class MemoApp {
    constructor() {
        this.memos = JSON.parse(localStorage.getItem('memos') || '[]');
        this.memoList = document.getElementById('memoList');
        this.addMemoBtn = document.getElementById('addMemo');
        this.clearAllBtn = document.getElementById('clearAll');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.searchQuery = '';
        
        this.init();
    }
    
    init() {
        this.addMemoBtn.addEventListener('click', () => this.addMemo());
        this.clearAllBtn.addEventListener('click', () => this.clearAllMemos());
        this.searchInput.addEventListener('input', (e) => this.searchMemos(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.renderMemos();
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    addMemo() {
        const memo = {
            id: this.generateId(),
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.memos.unshift(memo);
        this.saveMemos();
        this.renderMemos();
    }
    
    deleteMemo(id) {
        if (confirm('このメモを削除しますか？')) {
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
            this.saveMemos();
        }
    }
    
    clearAllMemos() {
        if (confirm('全てのメモを削除しますか？この操作は取り消せません。')) {
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
    
    renderMemos() {
        let filteredMemos = this.memos;
        
        if (this.searchQuery) {
            filteredMemos = this.memos.filter(memo => 
                memo.content.toLowerCase().includes(this.searchQuery)
            );
        }
        
        if (filteredMemos.length === 0) {
            let message = this.memos.length === 0 
                ? 'メモがありません。「新しいメモ」ボタンを押して始めましょう。'
                : '検索結果が見つかりませんでした。';
            this.memoList.innerHTML = `
                <div class="empty-state">
                    <p>${message}</p>
                </div>
            `;
            return;
        }
        
        this.memoList.innerHTML = filteredMemos.map(memo => `
            <div class="memo-item">
                <div class="memo-header">
                    <span class="memo-date">${this.formatDate(memo.updatedAt)}</span>
                    <div class="memo-actions">
                        <button class="btn btn-danger btn-small" onclick="app.deleteMemo('${memo.id}')">
                            削除
                        </button>
                    </div>
                </div>
                <textarea 
                    class="memo-content" 
                    placeholder="ここにメモを入力してください..."
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