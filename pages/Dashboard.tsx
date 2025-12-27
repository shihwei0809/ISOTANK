import React, { useMemo, useState } from 'react';
import { Zone, InventoryItem, LogEntry } from '../types';

interface DashboardProps {
  zones: Zone[];
  inventory: InventoryItem[];
  logs: LogEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ zones, inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // --- 輔助函式：計算滯留天數 ---
  const getDaysInStock = (dateString?: string) => {
    if (!dateString) return 0;
    const entryDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - entryDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. 計算全場統計 (動態計算)
  const stats = useMemo(() => {
    const totalTanks = inventory.length;

    // 假設 Zone 裡有 capacity 欄位，若無則預設 35 (模擬 9.1 版邏輯)
    // 您可以在 types.ts 的 Zone 定義中加入 capacity: number
    const totalCapacity = zones.reduce((sum, zone) => sum + (zone.capacity || 35), 0);

    const utilization = totalCapacity > 0 ? ((totalTanks / totalCapacity) * 100).toFixed(1) : '0';

    return { totalTanks, totalCapacity, utilization };
  }, [inventory, zones]);

  // 2. 搜尋過濾邏輯
  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    const lowerTerm = searchTerm.toUpperCase();
    return inventory.filter(i =>
      i.id.includes(lowerTerm) ||
      (i.content && i.content.toUpperCase().includes(lowerTerm)) ||
      (i.zone && i.zone.toUpperCase().includes(lowerTerm)) // 增加搜尋區域
    );
  }, [inventory, searchTerm]);

  // 3. 處理「移出」點擊
  const handleQuickExit = (tankId: string) => {
    // 這裡保留 Alert，實際專案中通常會呼叫 API 或開啟 Modal
    alert(`系統提示：\n若要將 ${tankId} 移出，請至「進場/出場作業」頁面執行，以確保 ISO TRACKER 紀錄完整。`);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10">

      {/* --- 頂部標題與按鈕 --- */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">場站總覽</h2>
          <p className="text-slate-500 text-sm mt-1">ISO TRACKER Dashboard</p>
        </div>
        <button className="w-10 h-10 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition shadow-lg flex items-center justify-center">
          <i className="fa-solid fa-rotate-right"></i> {/* 改為重新整理圖示，較符合 Dashboard 直覺 */}
        </button>
      </div>

      {/* --- 統計數據與搜尋區 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 卡片 1: 總容量 (顯示利用率) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 z-10">總容量 / 利用率</p>
          <div className="flex items-baseline space-x-3 z-10">
            <p className="text-5xl font-black text-slate-800">{stats.totalCapacity}</p>
            <span className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              {stats.utilization}%
            </span>
          </div>
        </div>

        {/* 卡片 2: 在庫數 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 z-10">在庫 ISO TANK 數</p>
          <p className="text-5xl font-black text-amber-500 z-10">{stats.totalTanks}</p>
        </div>

        {/* 卡片 3: 搜尋列 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <i className="fa-solid fa-magnifying-glass text-slate-300 text-xl mr-4"></i>
          <input
            type="text"
            placeholder="搜尋槽號、內容物、區域..."
            className="w-full h-full outline-none text-lg text-slate-600 placeholder-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* --- 區域看板 (Kanban View) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {zones.map((zone) => {
          // 篩選出該區域內的庫存
          const zoneItems = filteredInventory.filter(i => i.zone === zone.id);
          // 依據 9.1 版邏輯，優先顯示滯留較久的車輛 (排序：時間舊 -> 新)
          zoneItems.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

          // 區域容量設定
          const zoneCapacity = zone.capacity || 35;
          const progressPercent = (zoneItems.length / zoneCapacity) * 100;

          let progressColor = 'bg-blue-500';
          if (progressPercent > 80) progressColor = 'bg-amber-500';
          if (progressPercent >= 100) progressColor = 'bg-red-500';

          return (
            <div key={zone.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col max-h-[800px]">

              {/* 區域標題列 */}
              <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-6 rounded-full ${progressPercent >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                    <h3 className="font-bold text-lg text-slate-800">{zone.name}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${zoneItems.length >= zoneCapacity ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {zoneItems.length} / {zoneCapacity}
                  </span>
                </div>
                {/* 進度條 */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500`}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 該區域的槽車列表 */}
              <div className="p-4 overflow-y-auto space-y-3 bg-slate-50/50 flex-1 custom-scrollbar min-h-[200px]">
                {zoneItems.length > 0 ? (
                  zoneItems.map((item) => {
                    const days = getDaysInStock(item.time);
                    // 滯留天數顏色邏輯
                    const daysBadgeColor = days > 30
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : days > 14
                        ? 'bg-amber-100 text-amber-600 border-amber-200'
                        : 'bg-green-50 text-green-600 border-green-200';

                    return (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group relative">

                        {/* 狀態標籤 (右上角) */}
                        <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded border ${daysBadgeColor}`}>
                          {days} 天
                        </div>

                        {/* 第一行：車號 */}
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800 text-lg tracking-tight">{item.id}</span>
                        </div>

                        {/* 第二行：時間與操作 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center text-xs text-slate-400">
                            <i className="fa-regular fa-calendar mr-1.5"></i>
                            {item.time?.split('T')[0]}
                          </div>
                        </div>

                        {/* 分隔線 */}
                        <div className="border-t border-slate-100 my-2"></div>

                        {/* 第三行：內容物與重量 */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">內容物</p>
                            <p className="font-bold text-slate-700 text-sm truncate" title={item.content}>
                              {item.content || 'Empty'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 mb-0.5">重量</p>
                            <p className="font-bold text-blue-600 text-sm">
                              {item.weight ? item.weight.toLocaleString() : 0} <span className="text-xs text-slate-400">kg</span>
                            </p>
                          </div>
                        </div>

                        {/* 移出按鈕 (滑鼠移過去才比較明顯) */}
                        <button
                          onClick={() => handleQuickExit(item.id)}
                          className="w-full mt-3 text-xs text-slate-400 bg-slate-50 py-1.5 rounded hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-transparent transition flex items-center justify-center gap-2"
                        >
                          <i className="fa-solid fa-arrow-right-from-bracket"></i>
                          移出作業
                        </button>

                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm opacity-60">
                    <i className="fa-solid fa-layer-group text-3xl mb-2"></i>
                    <p>區域閒置中</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Dashboard;