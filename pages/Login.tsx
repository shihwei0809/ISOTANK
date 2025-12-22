import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string, role: 'admin' | 'view') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // 切換模式：false = 登入, true = 註冊
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // 註冊才需要名字
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // 註冊成功提示
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // 1. 自動去除前後空白 (解決無法登入的常見問題)
    const cleanUser = userId.trim();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    setLoading(true);

    if (isRegisterMode) {
      // --- 執行註冊邏輯 ---
      if (!cleanUser || !cleanPass || !cleanName) {
        setError('請填寫完整資訊 (帳號、密碼、姓名)');
        setLoading(false);
        return;
      }

      const res = await api.register(cleanUser, cleanPass, cleanName);

      if (res.status === 'success') {
        setSuccessMsg(res.message || '註冊成功');
        // 註冊成功後，自動切換回登入模式，並保留帳號密碼方便使用者直接登入
        setTimeout(() => {
          setIsRegisterMode(false);
        }, 1500);
      } else {
        setError(res.message || '註冊失敗');
      }

    } else {
      // --- 執行登入邏輯 ---
      if (!cleanUser || !cleanPass) {
        setError('請輸入帳號與密碼');
        setLoading(false);
        return;
      }

      const res = await api.login(cleanUser, cleanPass);

      if (res.status === 'success' && res.user && res.role) {
        onLogin(res.user, res.role);
      } else {
        setError(res.message || '帳號或密碼錯誤 (請檢查大小寫)');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

        {/* LOGO 與 標題 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">☁️</div>
          <h1 className="text-2xl font-bold text-gray-800">ISO Tank 進出管理</h1>
          <p className="text-gray-500 text-sm mt-1">Logs 動態運算核心 V6.0</p>
        </div>

        {/* 標題顯示：登入 或 註冊 */}
        <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
          {isRegisterMode ? '建立新帳號' : '系統登入'}
        </h2>

        {/* 錯誤與成功訊息 */}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm text-center">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 帳號欄位 */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">帳號 (User ID)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入帳號 (例如: B0790)"
            />
          </div>

          {/* 密碼欄位 */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">密碼 (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入密碼"
            />
          </div>

          {/* 🔴 只有在註冊模式才顯示「姓名」欄位 */}
          {isRegisterMode && (
            <div>
              <label className="block text-gray-700 font-bold mb-1">姓名 (Your Name)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如: 王小明"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white p-3 rounded font-bold transition duration-200 
              ${loading ? 'bg-gray-400 cursor-not-allowed' : (isRegisterMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-black')}`}
          >
            {loading ? '處理中...' : (isRegisterMode ? '立即註冊' : '登入系統')}
          </button>
        </form>

        {/* 切換模式的按鈕 */}
        <div className="mt-6 text-center text-sm">
          {isRegisterMode ? (
            <p className="text-gray-600">
              已經有帳號了？
              <button
                onClick={() => { setIsRegisterMode(false); setError(''); }}
                className="text-blue-600 font-bold ml-1 hover:underline"
              >
                直接登入
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              還沒有帳號？
              <button
                onClick={() => { setIsRegisterMode(true); setError(''); }}
                className="text-blue-600 font-bold ml-1 hover:underline"
              >
                註冊新帳號
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;