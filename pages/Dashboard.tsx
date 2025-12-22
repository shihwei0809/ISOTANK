import React, { useMemo, useState } from 'react';
import { Zone, InventoryItem, LogEntry } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardProps {
  zones: Zone[];
  inventory: InventoryItem[];
  logs: LogEntry[];
}

// 顏色設定
const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ zones, inventory, logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 計算數據
  const stats = useMemo(() => {
    const totalTanks = inventory.length;
    // 假設總容量 (如果沒有後端數據，這裡先暫時設定為 區域數 * 20 或固定數值，以還原介面為主)
    const totalCapacity = 250;

    return { totalTanks, totalCapacity };
  }, [inventory]);

  // 2. 圖表數據
  const chartData = useMemo(() => {
    if (zones.length === 0) return [];
    const data = zones.map(z => {
      const count = inventory.filter(i => i.zone === z.id).length;
      return { name: z.name, value: count };
    });
    return data.filter(d => d.value > 0);
  }, [zones, inventory]);

  // 3. 過濾搜尋 (如果有輸入車號或內容物)
  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    return inventory.filter(i =>
      i.id.includes(searchTerm.toUpperCase()) ||
      (i.content && i.content.includes(searchTerm))
    );
  }, [inventory, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* 標題區 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">場站總覽</h2>
        <span className="text-xs text-slate-400">
          <i className="fa-solid fa-rotate-right mr-1"></i>
          重新整理
        </span>
      </div>

      {/* --- 核心儀表板區塊 (還原三欄式佈局) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 卡片 1: 總容量 (仿照舊版樣式) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center h-40">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">總容量 (TOTAL CAPACITY)</p>
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-slate-800">{stats.totalCapacity}</span>
            <span className="ml-2 text-sm text-slate-400">slots</span>
          </div>
        </div>

        {/* 卡片 2: 在庫數 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center h-40">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">在庫數 (IN STOCK)</p>
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-amber-500">{stats.totalTanks}</span>
            <span className="ml-2 text-sm text-slate-400">tanks</span>
          </div>
        </div>

        {/* 卡片 3: 區域圓餅圖 (縮小版，放在右側) */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 h-40 flex items-center overflow-hidden">
          <div className="flex-1 h-full relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35} // 調整較小的內徑
                    outerRadius={55} // 調整較小的外徑以放入卡片
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', paddingRight: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs">
                無數據
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- 搜尋列 (仿照舊版) --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
        <i className="fa-solid fa-magnifying-glass text-slate-300 ml-2 mr-4"></i>
        <input
          type="text"
          placeholder="搜尋槽號、內容物..."
          className="flex-1 outline-none text-slate-600 placeholder-slate-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- 下方：搜尋結果或最新紀錄 --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">
            {searchTerm ? '搜尋結果' : '最新進出紀錄'}
          </h3>
          <span className="text-xs text-slate-400">顯示最近 5 筆</span>
        </div>

        <div className="divide-y divide-slate-100">
          {(searchTerm ? filteredInventory.slice(0, 5) : logs.slice(0, 5)).map((item: any, idx) => {
            // 判斷是 InventoryItem 還是 LogItem
            const isLog = 'action' in item;
            const id = isLog ? item.tank : item.id;
            const desc = isLog ? `${item.action} - ${item.zone}` : `${item.zone} - ${item.content || '空桶'}`;
            const time = isLog ? item.time : item.time || '在庫中';

            return (
              <div key={idx} className="p-4 flex items-center hover:bg-slate-50 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 
                  ${isLog
                    ? (item.action === '進場' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')
                    : 'bg-blue-100 text-blue-600'
                  }`}>
                  <i className={`fa-solid ${isLog ? (item.action === '進場' ? 'fa-arrow-right-to-bracket' : 'fa-truck-fast') : 'fa-cube'}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">{id}</span>
                    <span className="text-xs text-slate-400">{time}</span>
                  </div>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
                {/* 如果是在庫搜尋，顯示狀態標籤 */}
                {!isLog && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-bold">
                    IN STOCK
                  </span>
                )}
              </div>
            );
          })}

          {((searchTerm && filteredInventory.length === 0) || (!searchTerm && logs.length === 0)) && (
            <div className="p-8 text-center text-slate-400">
              尚無資料
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;