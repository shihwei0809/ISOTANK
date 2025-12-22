import React, { useMemo } from 'react';
import { Zone, InventoryItem, LogEntry } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardProps {
  zones: Zone[];
  inventory: InventoryItem[];
  logs: LogEntry[];
}

// 定義圖表顏色 (藍綠色系配合鴻勝風格)
const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ zones, inventory, logs }) => {

  // 1. 計算統計數據
  const stats = useMemo(() => {
    // 今日日期字串 (格式 YYYY/MM/DD)
    const todayStr = new Date().toLocaleDateString();

    const totalTanks = inventory.length;
    // 計算今日進場 (Log 動作是 '進場' 且時間包含今日日期)
    const inToday = logs.filter(l => l.action === '進場' && l.time.includes(todayStr)).length;
    // 計算今日出場
    const outToday = logs.filter(l => l.action === '出場' && l.time.includes(todayStr)).length;

    return { totalTanks, inToday, outToday };
  }, [inventory, logs]);

  // 2. 準備圖表數據 (計算各區域庫存數量)
  const chartData = useMemo(() => {
    // 如果沒有區域資料，回傳空陣列
    if (zones.length === 0) return [];

    const data = zones.map(z => {
      const count = inventory.filter(i => i.zone === z.id).length;
      return { name: z.name, value: count };
    });

    // 過濾掉數量為 0 的區域，避免圖表顯示太多空白
    return data.filter(d => d.value > 0);
  }, [zones, inventory]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* --- 頂部統計卡片 --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 卡片 1:在庫總數 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
            <i className="fa-solid fa-layer-group text-xl"></i>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold">目前在庫總數</p>
            <p className="text-3xl font-black text-slate-800">{stats.totalTanks}</p>
          </div>
        </div>

        {/* 卡片 2:今日進場 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
            <i className="fa-solid fa-arrow-right-to-bracket text-xl"></i>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold">今日進場數</p>
            <p className="text-3xl font-black text-slate-800">{stats.inToday}</p>
          </div>
        </div>

        {/* 卡片 3:今日出場 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-4">
            <i className="fa-solid fa-truck-fast text-xl"></i>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold">今日出場數</p>
            <p className="text-3xl font-black text-slate-800">{stats.outToday}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- 左側：區域分佈圖表 --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <i className="fa-solid fa-chart-pie text-amber-500 mr-2"></i>
            區域庫存分佈
          </h3>

          {/* 修改重點：增加高度至 h-80 (320px)，讓圖表有空間 */}
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    // ★★★ 修改重點：使用百分比，並設小一點 ★★★
                    innerRadius="40%"
                    outerRadius="60%"
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label // 加上標籤顯示數值
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <i className="fa-solid fa-chart-simple text-4xl mb-2"></i>
                <p>目前無庫存資料</p>
              </div>
            )}
          </div>
        </div>

        {/* --- 右側：最新動態 (只顯示最新的 5 筆) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <i className="fa-solid fa-clock-rotate-left text-blue-500 mr-2"></i>
            最新進出紀錄
          </h3>
          <div className="space-y-4">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className={`w-2 h-2 mt-2 rounded-full mr-3 ${log.action === '進場' ? 'bg-green-500' :
                  log.action === '出場' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{log.tank}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${log.action === '進場' ? 'bg-green-100 text-green-700' :
                      log.action === '出場' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{log.time}</p>
                  <div className="text-xs text-slate-400">
                    {log.zone} • {log.user}
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">尚無紀錄</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;