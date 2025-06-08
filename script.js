class MemoApp {
    constructor() {
        this.memos = JSON.parse(localStorage.getItem('memos') || '[]');
        this.memoList = document.getElementById('memoList');
        this.addMemoBtn = document.getElementById('addMemo');
        this.clearAllBtn = document.getElementById('clearAll');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.digitalClock = document.getElementById('digitalClock');
        this.searchQuery = '';
        
        this.init();
    }
    
    init() {
        this.addMemoBtn.addEventListener('click', () => this.addMemo());
        this.clearAllBtn.addEventListener('click', () => this.clearAllMemos());
        this.searchInput.addEventListener('input', (e) => this.searchMemos(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
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
            this.saveMemos();
        }
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
        
        if (this.searchQuery) {
            filteredMemos = this.memos.filter(memo => 
                memo.content.toLowerCase().includes(this.searchQuery)
            );
        }
        
        if (filteredMemos.length === 0) {
            let message = this.memos.length === 0 
                ? 'まだメモがないよ〜「新しいメモ」を押してね！'
                : '見つからなかったよ...別の言葉で試してみて！';
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
                            削除 💔
                        </button>
                    </div>
                </div>
                <textarea 
                    class="memo-content" 
                    placeholder="メモを書いてね...💭"
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