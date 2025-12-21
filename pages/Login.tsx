import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string, role: 'admin' | 'view') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.login(user, pass);
      if (res.status === 'success' && res.user && res.role) {
        onLogin(res.user, res.role);
      } else {
        setError(res.message || '登入失敗');
      }
    } catch (err) {
      setError('網路連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
        <div className="text-center mb-8">
          <i className="fa-solid fa-cloud text-amber-500 text-5xl mb-4"></i>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide">ISO Tank 進出管理</h1>
          <p className="text-slate-400 text-sm mt-1">Logs 動態運算核心 V6.0</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">帳號 (User)</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition bg-white text-black"
              placeholder="請輸入 admin 或 view"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">密碼 (Password)</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition bg-white text-black"
              placeholder="請輸入密碼"
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center font-bold">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg mt-2 flex justify-center items-center"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
            登入系統
          </button>
        </form>
        <div className="mt-4 text-xs text-center text-slate-400">
          測試帳號： <br />
          帳號: <b>view</b> 密碼: <b>1234</b>
        </div>
      </div>
    </div>
  );
};

export default Login;