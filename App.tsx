import React, { useState, useEffect, useCallback } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import Weight from './pages/Weight';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import { api } from './services/api';
import { AllData } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'view' | null>(null);
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState<AllData>({ zones: [], inventory: [], logs: [], registry: [] });
  const [loading, setLoading] = useState(false);

  // Load user from session storage if exists (simple persistence)
  useEffect(() => {
    const savedUser = sessionStorage.getItem('iso_user');
    const savedRole = sessionStorage.getItem('iso_role') as 'admin' | 'view';
    if (savedUser && savedRole) {
      setCurrentUser(savedUser);
      setRole(savedRole);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.read();
      setData(result);
    } catch (error) {
      console.error(error);
      alert("讀取資料失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const handleLogin = (user: string, role: 'admin' | 'view') => {
    setCurrentUser(user);
    setRole(role);
    sessionStorage.setItem('iso_user', user);
    sessionStorage.setItem('iso_role', role);
  };

  const handleLogout = () => {
    if (window.confirm('確定要登出嗎？')) {
      setCurrentUser(null);
      setRole(null);
      sessionStorage.clear();
      setPage('dashboard');
    }
  };

  const handleMoveOut = async (id: string, zoneName: string) => {
    if(!currentUser) return;
    setLoading(true);
    try {
        const res = await api.delete(id, zoneName, currentUser);
        if(res.status === 'success') {
            await fetchData();
        } else {
            alert(res.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleEntry = async (formData: any) => {
     setLoading(true);
     try {
         const res = await api.gateIn({...formData, action: 'add'});
         if(res.status === 'success') {
             alert(res.message);
             await fetchData();
         } else {
             alert(res.message);
         }
     } finally {
         setLoading(false);
     }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
      { id: 'dashboard', icon: 'fa-chart-pie', label: '場站總覽' },
      { id: 'entry', icon: 'fa-truck-ramp-box', label: '進場作業' },
      { id: 'weight', icon: 'fa-weight-hanging', label: '重量維護' },
      { id: 'logs', icon: 'fa-list', label: '進出紀錄' },
      { id: 'settings', icon: 'fa-gear', label: '區域設定' }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 z-20 transition-all">
        <div>
          <div className="p-6 flex items-center gap-3">
            <i className="fa-solid fa-cloud text-amber-500 text-2xl"></i>
            <h1 className="font-bold text-lg tracking-wider leading-tight">ISO TANK<br />進出管理</h1>
          </div>
          <nav className="flex flex-col w-full">
             {navItems.map(item => (
                 <div 
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`px-6 py-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-white/10 ${page === item.id ? 'text-amber-500 bg-white/10' : 'text-slate-400'}`}
                 >
                     <i className={`fa-solid ${item.icon} w-6`}></i>
                     <span>{item.label}</span>
                 </div>
             ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-700 text-center">
          <div className="text-xs text-slate-500 mb-2 flex items-center justify-center">
            已登入：<span className="text-white font-bold ml-1">{currentUser}</span>
            <span className={`ml-2 text-[10px] px-2 rounded ${role === 'admin' ? 'bg-amber-500 text-black' : 'bg-slate-500 text-white'}`}>
                {role === 'admin' ? 'ADMIN' : 'VIEW'}
            </span>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white flex items-center justify-center w-full gap-2 py-2 text-sm border border-slate-700 rounded hover:bg-slate-800 mb-2">
            <i className="fa-solid fa-sign-out"></i> 登出
          </button>
          <button onClick={fetchData} className="text-slate-400 hover:text-white flex items-center justify-center w-full gap-2 py-2 text-sm">
            <i className="fa-solid fa-sync"></i> 重新整理
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {loading && (
            <div className="absolute inset-0 bg-white/80 z-[60] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="mt-2 text-sm font-bold text-slate-600">處理中...</p>
            </div>
        )}

        <header className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm h-16 shrink-0">
          <h2 className="text-xl md:text-2xl font-bold truncate capitalize">{navItems.find(n => n.id === page)?.label}</h2>
          {role === 'admin' && page !== 'entry' && (
              <button 
                onClick={() => setPage('entry')} 
                className="bg-slate-900 text-white px-4 py-2 rounded font-bold shadow hover:bg-slate-700 text-sm md:text-base flex items-center"
              >
                  <i className="fa-solid fa-plus mr-1"></i>
                  <span className="hidden md:inline">快速進場</span>
              </button>
          )}
        </header>

        <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto pb-24 flex-1">
            {page === 'dashboard' && <Dashboard zones={data.zones} inventory={data.inventory} isAdmin={role === 'admin'} onMoveOut={handleMoveOut} />}
            {page === 'entry' && <Entry zones={data.zones} inventory={data.inventory} logs={data.logs} registry={data.registry} isAdmin={role === 'admin'} user={currentUser} onEntry={handleEntry} />}
            {page === 'weight' && <Weight isAdmin={role === 'admin'} user={currentUser} refreshData={fetchData} />}
            {page === 'logs' && <Logs logs={data.logs} />}
            {page === 'settings' && <Settings zones={data.zones} isAdmin={role === 'admin'} refreshData={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;