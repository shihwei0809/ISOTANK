import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogsProps {
  logs: LogEntry[];
  isSuper: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (entry: LogEntry) => void;
}

const Logs: React.FC<LogsProps> = ({ logs, isSuper, onDelete, onEdit }) => {
  const [search, setSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // 1. Filter and Sort
  const filteredLogs = logs.slice().sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).filter(l =>
    search === '' ||
    `${l.time} ${l.tank} ${l.action} ${l.zone} ${l.slot || ''} ${l.content} ${l.user} ${l.remark}`.toUpperCase().includes(search.toUpperCase())
  );

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleDelete = (id: string) => {
    if (window.confirm('警告：確定要刪除這筆紀錄嗎？此動作無法復原。')) {
      if (onDelete) onDelete(id);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document.querySelector('.overflow-x-auto')?.scrollTo(0, 0);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // ★★★ 新增：匯出 CSV 功能 ★★★
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("目前沒有資料可匯出");
      return;
    }

    const confirmExport = window.confirm(`確定匯出目前篩選的 ${filteredLogs.length} 筆資料？`);
    if (!confirmExport) return;

    // 定義 CSV 標題
    const headers = ["時間 (Time)", "槽號 (Tank ID)", "動作 (Action)", "內容物 (Content)", "區域 (Zone)", "儲位 (Slot)", "淨重 (Net)", "總重 (Total)", "車頭 (Head)", "空櫃 (Empty)", "備註 (Remark)", "人員 (User)"];

    // 轉換資料為 CSV 格式 (加上 \uFEFF 以避免 Excel 中文亂碼)
    let csvContent = "\uFEFF" + headers.join(",") + "\n";

    filteredLogs.forEach(row => {
      // 處理欄位中的逗號，避免破壞 CSV 結構
      const cleanContent = (row.content || "").replace(/,/g, " ");
      const cleanRemark = (row.remark || "").replace(/,/g, " ");
      const cleanZone = (row.zone || "").replace(/,/g, " ");

      const rowData = [
        `"${row.time}"`, // 時間加引號避免格式跑掉
        row.tank,
        row.action,
        cleanContent,
        cleanZone,
        row.slot || "",
        row.weight || 0,
        row.total || 0,
        row.head || 0,
        row.empty || 0,
        cleanRemark,
        row.user
      ];
      csvContent += rowData.join(",") + "\n";
    });

    // 建立下載連結
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ISO_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1920px] mx-auto animate-fade-in relative">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50 pb-4 pt-2 -mt-2">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">進出紀錄</h2>
            <p className="text-slate-500 text-sm flex items-center mt-1">
              System Logs & History
              {isSuper && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs ml-2 font-bold border border-red-200">SUPER USER</span>}
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* 搜尋框 */}
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center flex-1 md:w-64 transition focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
              <i className="fa-solid fa-magnifying-glass text-slate-300 mr-3"></i>
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full outline-none bg-transparent text-slate-600 placeholder-slate-300"
                placeholder="搜尋關鍵字..."
              />
            </div>

            {/* ★ 新增：匯出按鈕 */}
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition flex items-center whitespace-nowrap"
            >
              <i className="fa-solid fa-file-csv mr-2"></i> 匯出 CSV
            </button>

            {/* Rows Per Page Selector */}
            <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center">
              <span className="text-xs text-slate-400 font-bold mr-2 whitespace-nowrap">顯示</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="outline-none bg-transparent font-bold text-slate-700 cursor-pointer text-sm"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 bg-slate-50">時間 (Time)</th>
                <th className="p-4 bg-slate-50">槽號 (Tank ID)</th>
                <th className="p-4 bg-slate-50">動作 (Action)</th>
                <th className="p-4 bg-slate-50">內容物 (Content)</th>
                <th className="p-4 bg-slate-50">區域 (Zone)</th>
                <th className="p-4 bg-slate-50">儲位 (Slot)</th>
                <th className="p-4 bg-slate-50 text-right">淨重 (Net)</th>
                <th className="p-4 bg-slate-50">備註 (Remark)</th>
                <th className="p-4 bg-slate-50">人員 (User)</th>
                {isSuper && <th className="p-4 text-center bg-red-50 text-red-500 border-b-red-100">管理</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={isSuper ? 10 : 9} className="p-12 text-center flex flex-col items-center justify-center text-slate-400 h-64">
                    <i className="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
                    <span>查無符合紀錄</span>
                  </td>
                </tr>
              ) : (
                currentLogs.map(l => (
                  <tr key={l.id || Math.random()} className="hover:bg-slate-50/80 transition group">
                    <td className="p-4 text-slate-500 text-xs">
                      <div className="font-bold text-slate-700">{l.time.split(' ')[0]}</div>
                      <div className="scale-90 origin-left opacity-70">{l.time.split(' ')[1]?.substring(0, 5)}</div>
                    </td>
                    <td className="p-4 font-bold font-mono text-slate-700 text-base">{l.tank}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${l.action === '進場' ? 'bg-green-50 text-green-600 border-green-100' :
                          l.action === '出場' ? 'bg-red-50 text-red-600 border-red-100' :
                            l.action === '移區' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{l.content || '-'}</td>
                    <td className="p-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">{l.zone}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {l.slot ? <span className="text-blue-600 font-bold">{l.slot}</span> : '-'}
                    </td>
                    <td className="p-4 font-mono text-right text-slate-700">
                      {Number(l.weight) > 0 ? Number(l.weight).toLocaleString() : '-'}
                    </td>
                    <td className="p-4 text-slate-400 text-xs max-w-[200px] truncate" title={l.remark}>
                      {l.remark || '-'}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                          {(l.user || '?').charAt(0)}
                        </div>
                        {l.user}
                      </div>
                    </td>

                    {/* Admin Actions */}
                    {isSuper && (
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit && onEdit(l)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition"
                            title="編輯紀錄"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            onClick={() => l.id && handleDelete(String(l.id))}
                            className="w-8 h-8 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition"
                            title="刪除紀錄"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 sticky bottom-0 z-10">
            <div className="text-xs text-slate-500 font-bold">
              顯示 {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredLogs.length)} 筆，共 {filteredLogs.length} 筆
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <span className="text-sm font-bold text-slate-700 px-2">
                {currentPage} / {totalPages || 1}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;