import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
  // ★ 修改：增加 isSuper 參數定義
  onLogin: (userId: string, role: 'admin' | 'view' | 'op', isSuper?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await api.login(userId, password);

    if (res.status === 'success' && res.user && res.role) {
      // ★ 關鍵修正：這裡必須將 res.isSuper 傳遞給 App.tsx
      onLogin(res.user, res.role as 'admin' | 'view' | 'op', res.isSuper);
    } else {
      setError(res.message || '登入失敗');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg">
            鴻
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ISO Tank 管理系統</h1>
          <p className="text-slate-400 text-sm mt-2">V9.5 System Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">帳號 (User ID)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="請輸入帳號"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">密碼 (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500 transition"
              placeholder="請輸入密碼"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center font-bold border border-red-100">
              <i className="fa-solid fa-circle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-lg transition
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl'}`}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : '登入系統'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;