import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Weight from './pages/Weight';
import Users from './pages/Users';
import { api } from './services/api';
import { AllData, User, LogEntry } from './types';
import { useIdleTimer } from './hooks/useIdleTimer';

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

  // --- 登入/登出處理 ---
  const handleLogin = (userId: string, role: 'admin' | 'view' | 'op', isSuper?: boolean) => {
    setUser({ id: userId, role, isSuper });
    loadData();
  };

  const handleLogout = () => {
    setUser(null);
    setPage('dashboard');
  };

  // --- 閒置登出 ---
  const onIdle = () => {
    if (user) {
      alert('系統偵測到您已閒置 10 分鐘，為確保資訊安全，系統已自動登出。');
      handleLogout();
    }
  };
  useIdleTimer(onIdle);

  // --- 資料讀取 ---
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await api.read();
    setData(res);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // --- Log 管理 ---
  const handleDeleteLog = async (logId: string) => {
    // 實作刪除邏輯
    console.log(`Deleting log ${logId}`);
    alert("功能演示：已發送刪除請求");
    loadData(true);
  };

  const handleEditLog = (entry: LogEntry) => {
    console.log("Edit entry:", entry);
    alert(`功能演示：編輯 ${entry.tank}`);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // ★★★ 修改：定義所有選單項目及其允許的角色 ★★★
  const allMenuItems = [
    {
      id: 'dashboard',
      label: '場站總覽',
      icon: 'fa-chart-pie',
      allowedRoles: ['view', 'op', 'admin']
    },
    {
      id: 'entry',
      label: '進場作業',
      icon: 'fa-truck-ramp-box',
      allowedRoles: ['op', 'admin'] // 只有 OP 和 Admin 可見
    },
    {
      id: 'weight',
      label: '重量維護',
      icon: 'fa-scale-balanced',
      allowedRoles: ['admin'] // 假設只有 Admin 可見 (若 OP 也要請加入 'op')
    },
    {
      id: 'logs',
      label: '進出紀錄',
      icon: 'fa-list',
      allowedRoles: ['view', 'op', 'admin']
    },
    {
      id: 'settings',
      label: '區域設定',
      icon: 'fa-gear',
      allowedRoles: ['admin']
    },
    {
      id: 'users',
      label: '人員管理',
      icon: 'fa-users-gear',
      allowedRoles: ['admin'] // Admin 才能看，內部再檢查 isSuper
    }
  ];

  // 根據目前使用者角色過濾選單
  const visibleMenuItems = allMenuItems.filter(item =>
    item.allowedRoles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">

      {/* --- 左側側邊欄 --- */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300">
        <div className="p-8 text-center border-b border-slate-800">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-amber-500/30">
            <span className="text-amber-600 text-3xl font-black">鴻</span>
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-white">鴻勝 <span className="text-amber-500">ISO</span></h2>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Tank Management</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
          <ul className="space-y-2 px-4">
            {visibleMenuItems.map((item) => (
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.isSuper ? 'bg-red-900 text-red-200' : 'bg-slate-700 text-slate-300'}`}>
                <i className={`fa-solid ${user.isSuper ? 'fa-user-shield' : 'fa-user'} text-xs`}></i>
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">已登入 :</div>
                <div className="text-sm font-bold text-white capitalize">{user.id}</div>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded border font-bold ${user.isSuper ? 'border-red-500 text-red-500' :
              user.role === 'admin' ? 'border-amber-500 text-amber-500' :
                user.role === 'op' ? 'border-blue-500 text-blue-500' :
                  'border-slate-500 text-slate-500'
              }`}>
              {user.isSuper ? 'SUPER' : user.role.toUpperCase()}
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
      <main className="flex-1 overflow-y-auto relative bg-slate-50">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-5 flex justify-between items-center border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              {visibleMenuItems.find(i => i.id === page)?.label}
            </h1>
            {page === 'logs' && user.isSuper && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold border border-red-200">
                <i className="fa-solid fa-shield-halved mr-1"></i> Admin Mode
              </span>
            )}
          </div>
          <button
            onClick={() => loadData(false)}
            disabled={loading}
            className="text-slate-400 hover:text-amber-600 transition flex items-center space-x-2 text-sm font-medium bg-slate-50 px-3 py-2 rounded-lg hover:bg-amber-50"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
            <span>{loading ? '更新中...' : '重新整理'}</span>
          </button>
        </header>

        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          {page === 'dashboard' && <Dashboard zones={data.zones} inventory={data.inventory} logs={data.logs} />}

          {/* 安全性檢查：雖然隱藏了選單，但最好也避免渲染元件 */}
          {page === 'entry' && (user.role === 'admin' || user.role === 'op') && (
            <Entry
              zones={data.zones}
              inventory={data.inventory}
              onRefresh={() => loadData(false)}
              user={user.id}
            />
          )}

          {page === 'weight' && user.role === 'admin' && (
            <Weight
              registry={data.registry}
              onRefresh={() => loadData(false)}
              user={user.id}
              zones={data.zones}
              isAdmin={user.role === 'admin'}
            />
          )}

          {page === 'logs' && (
            <Logs
              logs={data.logs}
              isSuper={!!user.isSuper}
              onDelete={handleDeleteLog}
              onEdit={handleEditLog}
            />
          )}

          {page === 'settings' && user.role === 'admin' && (
            <Settings
              zones={data.zones}
              onSave={api.updateSettings}
              onRefresh={() => loadData(false)}
            />
          )}

          {page === 'users' && user.role === 'admin' && (
            <Users currentUserRole={user.role} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;