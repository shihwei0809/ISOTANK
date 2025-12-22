import React, { useMemo, useState } from 'react';
import { Zone, InventoryItem, LogEntry } from '../types';

interface DashboardProps {
  zones: Zone[];
  inventory: InventoryItem[];
  logs: LogEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ zones, inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 計算全場統計
  const stats = useMemo(() => {
    const totalTanks = inventory.length;
    const totalCapacity = 214; // 依照您的截圖範例設定，或是您可以設成 zones.length * 50 之類的
    return { totalTanks, totalCapacity };
  }, [inventory]);

  // 2. 搜尋過濾邏輯
  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    const lowerTerm = searchTerm.toUpperCase(); // 轉大寫比對
    return inventory.filter(i =>
      i.id.includes(lowerTerm) ||
      (i.content && i.content.toUpperCase().includes(lowerTerm))
    );
  }, [inventory, searchTerm]);

  // 3. 處理「移出」點擊 (目前僅做視覺呈現，防止誤觸)
  const handleQuickExit = (tankId: string) => {
    alert(`若要將 ${tankId} 移出，請至「進場/出場作業」頁面執行，以確保紀錄完整。`);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10">

      {/* --- 頂部標題與按鈕 (依照截圖右上角有個深色 + 號) --- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">場站總覽</h2>
        <button className="w-10 h-10 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition shadow-lg flex items-center justify-center">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      {/* --- 統計數據與搜尋區 (三欄式) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 卡片 1: 總容量 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">總容量</p>
          <p className="text-5xl font-black text-slate-800">{stats.totalCapacity}</p>
        </div>

        {/* 卡片 2: 在庫數 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">在庫數</p>
          <p className="text-5xl font-black text-amber-500">{stats.totalTanks}</p>
        </div>

        {/* 卡片 3: 搜尋列 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <i className="fa-solid fa-magnifying-glass text-slate-300 text-xl mr-4"></i>
          <input
            type="text"
            placeholder="搜尋槽號、內容物..."
            className="w-full h-full outline-none text-lg text-slate-600 placeholder-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- 區域看板 (Kanban View) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {zones.map((zone) => {
          // 篩選出該區域內的庫存 (且符合搜尋條件)
          const zoneItems = filteredInventory.filter(i => i.zone === zone.id);
          // 模擬容量 (假設每個區域容量 35，這可以依需求改)
          const zoneCapacity = 35;
          const isFull = zoneItems.length >= zoneCapacity;

          // 計算進度條顏色
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
                    <h3 className="font-bold text-lg text-slate-800">{zone.name}</h3>
                    <i className="fa-solid fa-arrow-up-right-from-square text-slate-300 text-xs cursor-pointer hover:text-blue-500"></i>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
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

              {/* 該區域的槽車列表 (可捲動) */}
              <div className="p-4 overflow-y-auto space-y-3 bg-slate-50/50 flex-1 custom-scrollbar">
                {zoneItems.length > 0 ? (
                  zoneItems.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group">

                      {/* 第一行：車號 與 移出按鈕 */}
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800 text-lg">{item.id}</span>
                        <button
                          onClick={() => handleQuickExit(item.id)}
                          className="text-xs text-red-400 bg-red-50 px-2 py-1 rounded border border-red-100 hover:bg-red-500 hover:text-white transition"
                        >
                          移出
                        </button>
                      </div>

                      {/* 第二行：時間 */}
                      <div className="flex items-center text-xs text-slate-400 mb-2">
                        <i className="fa-regular fa-clock mr-1.5"></i>
                        {item.time?.split('T')[0] || 'Unknown Date'}
                        <span className="ml-1">{item.time?.split('T')[1]?.split('.')[0] || ''}</span>
                      </div>

                      {/* 第三行：內容物 */}
                      <div className="font-bold text-slate-700 text-sm mb-2 truncate">
                        {item.content || '無內容物'}
                      </div>

                      {/* 第四行：重量 */}
                      <div className="flex items-center text-blue-600 font-bold text-sm">
                        <i className="fa-solid fa-weight-hanging mr-2"></i>
                        {item.weight ? item.weight.toLocaleString() : 0} <span className="text-xs ml-1">kg</span>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    <i className="fa-solid fa-box-open text-2xl mb-2 opacity-50"></i>
                    <p>此區域無庫存</p>
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