import React, { useState } from 'react';

const Login = ({ onLogin, isLoading }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLoginMode) {
      if (!formData.username || !formData.password) {
        setError('ユーザー名とパスワードを入力してください');
        return;
      }
      await onLogin(formData.username, formData.password);
    } else {
      if (!formData.username || !formData.email || !formData.password) {
        setError('すべての必須項目を入力してください');
        return;
      }
      await onLogin(formData.username, formData.password, formData.email, formData.displayName);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setFormData({
      username: '',
      email: '',
      password: '',
      displayName: ''
    });
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <header className="login-header">
          <h1>スマートメモ帳</h1>
          <p>{isLoginMode ? 'ログイン' : 'アカウント作成'}</p>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">ユーザー名 *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="ユーザー名を入力"
              disabled={isLoading}
            />
          </div>

          {!isLoginMode && (
            <>
              <div className="form-group">
                <label htmlFor="email">メールアドレス *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="メールアドレスを入力"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="displayName">表示名</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="表示名を入力（省略可）"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">パスワード *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="パスワードを入力"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : (isLoginMode ? 'ログイン' : 'アカウント作成')}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {isLoginMode ? 'アカウントをお持ちでない方は' : '既にアカウントをお持ちの方は'}
            <button 
              type="button" 
              className="toggle-btn"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLoginMode ? 'こちらから登録' : 'こちらからログイン'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;