import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: string, role: 'admin' | 'view') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
<<<<<<< HEAD
  // mode: 控制目前是 "登入" 還是 "註冊"
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState(''); // 新增姓名欄位 (註冊用)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
=======
  // 切換模式：false = 登入, true = 註冊
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // 註冊才需要名字
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // 註冊成功提示
  const [loading, setLoading] = useState(false);
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
<<<<<<< HEAD

    // 1. 自動去除前後空白 (解決無法登入的常見問題)
    const cleanUser = user.trim();
    const cleanPass = pass.trim();
    const cleanName = name.trim();

    if (!cleanUser || !cleanPass) {
      setError('請輸入完整帳號與密碼');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        // --- 登入邏輯 ---
        const res = await api.login(cleanUser, cleanPass);
        if (res.status === 'success' && res.user && res.role) {
          onLogin(res.user, res.role);
        } else {
          // 顯示後端回傳的具體錯誤，若無則顯示預設訊息
          setError(res.message || '帳號或密碼錯誤 (請檢查大小寫)');
        }
=======
    setLoading(true);

    if (isRegisterMode) {
      // --- 執行註冊邏輯 ---
      if (!userId || !password || !name) {
        setError('請填寫完整資訊 (帳號、密碼、姓名)');
        setLoading(false);
        return;
      }

      const res = await api.register(userId, password, name);

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
      if (!userId || !password) {
        setError('請輸入帳號與密碼');
        setLoading(false);
        return;
      }

      const res = await api.login(userId, password);

      if (res.status === 'success' && res.user && res.role) {
        onLogin(res.user, res.role);
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
      } else {
        // --- 註冊邏輯 ---
        if (!cleanName) {
          setError('註冊時請輸入姓名');
          setLoading(false);
          return;
        }
        // 假設 api 有一個 register 方法
        const res = await api.register(cleanUser, cleanPass, cleanName);
        if (res.status === 'success') {
          setSuccessMsg('註冊成功！請切換至登入頁面進行登入。');
          // 註冊成功後清空密碼，方便使用者重新登入
          setPass('');
          setMode('login');
        } else {
          setError(res.message || '註冊失敗，帳號可能已存在');
        }
      }
<<<<<<< HEAD
    } catch (err) {
      console.error(err);
      setError('系統錯誤或是網路連線異常');
    } finally {
      setLoading(false);
=======
>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
    }

    setLoading(false);
  };

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 transition-all duration-300">
        <div className="text-center mb-6">
          <i className={`fa-solid ${mode === 'login' ? 'fa-cloud' : 'fa-user-plus'} text-amber-500 text-5xl mb-4 transition-all`}></i>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide">
            {mode === 'login' ? 'ISO Tank 進出管理' : '新增使用者帳號'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Logs 動態運算核心 V6.0</p>
        </div>

=======
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

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 帳號欄位 */}
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-bold text-slate-600 mb-1">帳號 (User ID)</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition bg-white text-black"
              placeholder="請輸入帳號 (如 C0664)"
              required
            />
          </div>

          {/* 姓名欄位 - 只有註冊模式才顯示 */}
          {mode === 'register' && (
            <div className="animate-fade-in-down">
              <label className="block text-sm font-bold text-slate-600 mb-1">姓名 (Name)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-lg outline-none focus:border-amber-500 transition bg-white text-black"
                placeholder="請輸入使用者姓名"
                required
              />
            </div>
          )}

=======
            <label className="block text-gray-700 font-bold mb-1">帳號 (User ID)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入帳號 (例如: B0790)"
            />
          </div>

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
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

<<<<<<< HEAD
          {/* 錯誤與成功訊息 */}
          {error && <div className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded">{error}</div>}
          {successMsg && <div className="text-green-600 text-sm text-center font-bold bg-green-50 p-2 rounded">{successMsg}</div>}

          {/* 送出按鈕 */}
=======
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

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white p-3 rounded font-bold transition duration-200 
              ${loading ? 'bg-gray-400 cursor-not-allowed' : (isRegisterMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-black')}`}
          >
<<<<<<< HEAD
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
            {mode === 'login' ? '登入系統' : '註冊帳號'}
          </button>
        </form>

        {/* 切換模式按鈕 */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setSuccessMsg('');
            }}
            className="text-sm text-slate-500 hover:text-amber-600 font-medium transition"
          >
            {mode === 'login'
              ? '沒有帳號？ 點此註冊新使用者'
              : '已有帳號？ 返回登入'}
          </button>
        </div>

        {/* 測試帳號提示 (僅在登入模式顯示) */}
        {mode === 'login' && (
          <div className="mt-4 text-xs text-center text-slate-400">
            測試帳號：<br />
            帳號: <b>view</b> 密碼: <b>1234</b>
          </div>
        )}
=======
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

>>>>>>> e033f4bd4dad122af691a3b42f2ead2c9392cfba
      </div>
    </div>
  );
};

export default Login;