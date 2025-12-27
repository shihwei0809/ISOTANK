import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Weight from './pages/Weight';
import { api } from './services/api';
import { AllData, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState<AllData>({
    zones: [],
    inventory: [],
    logs: [],
    registry: []
  });
  const [loading, setLoading] = useState(false);

  // 登入處理
  const handleLogin = (userId: string, role: 'admin' | 'view', isSuper?: boolean) => {
    setUser({ id: userId, role, isSuper });
    loadData(); // 登入後立即讀取資料
    resetIdleTimer();
  };

  const handleLogout = () => {
    setUser(null);
    setPage('dashboard');
  };

  // 讀取所有資料
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await api.read();
    setData(res);
    setLoading(false);
  };

  // 定時重整 (每 30 秒靜音更新)
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 閒置登出邏輯 (10分鐘)
  useEffect(() => {
    if (!user) return;

    const EVENTS = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    EVENTS.forEach(event => window.addEventListener(event, handleActivity));
    localStorage.setItem('lastActivity', Date.now().toString());

    const checkIdle = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      if (Date.now() - lastActivity > 600000) { // 10 mins
        handleLogout();
        alert('系統閒置過久，已自動登出');
      }
    }, 10000);

    return () => {
      EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(checkIdle);
    };
  }, [user]);

  const resetIdleTimer = () => localStorage.setItem('lastActivity', Date.now().toString());

  // 如果未登入，顯示登入頁面
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- 側邊欄選單項目 ---
  const menuItems = [
    { id: 'dashboard', label: '場站總覽', icon: 'fa-chart-pie' },
    { id: 'entry', label: '進場作業', icon: 'fa-truck-ramp-box' },
    { id: 'weight', label: '重量維護', icon: 'fa-scale-balanced' }, // 新增的重量維護頁面
    { id: 'logs', label: '進出紀錄', icon: 'fa-list' },
  ];

  // 只有管理員才看得到「區域設定」
  if (user.role === 'admin') {
    menuItems.push({ id: 'settings', label: '區域設定', icon: 'fa-gear' });
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">

      {/* --- 左側側邊欄 (修改處：Logo 與公司名稱) --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 text-center border-b border-slate-800">

          {/* 修改：Logo 區域 */}
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-amber-500/30">
            {/* 這裡使用一個文字圖標代替圖片，如果您有鴻勝的圖片 URL，請用 <img src="..." /> 取代下方的 <i> */}
            <span className="text-amber-600 text-3xl font-black">鴻</span>
          </div>

          {/* 修改：公司名稱 */}
          <h2 className="text-2xl font-bold tracking-wider text-white">鴻勝 <span className="text-amber-500">ISO</span></h2>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Tank Management</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-200 group
                    ${page === item.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 font-bold transform scale-105'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <i className={`fa-solid ${item.icon} w-6 text-center text-lg ${page === item.id ? 'text-white' : 'text-slate-500 group-hover:text-amber-400'}`}></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <i className="fa-solid fa-user text-xs text-slate-300"></i>
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">已登入 :</div>
                <div className="text-sm font-bold text-white capitalize">{user.id}</div>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded border ${user.role === 'admin' ? 'border-amber-500 text-amber-500' : 'border-blue-500 text-blue-500'}`}>
              {user.role === 'admin' ? 'ADMIN' : 'VIEW'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition text-sm flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>登出系統</span>
          </button>
        </div>
      </aside>

      {/* --- 右側主內容區 --- */}
      <main className="flex-1 overflow-y-auto relative">
        {/* 頂部標題列 */}
        <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {menuItems.find(i => i.id === page)?.label}
          </h1>
          <button
            onClick={() => loadData(false)}
            disabled={loading}
            className="text-slate-400 hover:text-amber-600 transition flex items-center space-x-2 text-sm font-medium"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
            <span>{loading ? '更新中...' : '重新整理'}</span>
          </button>
        </header>

        {/* 頁面內容路由 */}
        <div className="p-8">
          {page === 'dashboard' && <Dashboard zones={data.zones} inventory={data.inventory} logs={data.logs} />}
          {page === 'entry' && <Entry zones={data.zones} inventory={data.inventory} onRefresh={() => loadData(false)} user={user.id} />}
          {page === 'weight' && <Weight registry={data.registry} onRefresh={() => loadData(false)} user={user.id} zones={data.zones} isAdmin={user.role === 'admin'} />}
          {page === 'logs' && <Logs logs={data.logs} user={user} />}
          {page === 'settings' && <Settings zones={data.zones} onSave={api.updateSettings} onRefresh={() => loadData(false)} />}
        </div>
      </main>
    </div>
  );
}

export default App;