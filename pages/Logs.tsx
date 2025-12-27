import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogsProps {
  logs: LogEntry[];
  isSuper: boolean; // 接收權限參數
  onDelete?: (id: string) => void;
  onEdit?: (entry: LogEntry) => void;
}

const Logs: React.FC<LogsProps> = ({ logs, isSuper, onDelete, onEdit }) => {
  const [search, setSearch] = useState('');

  // 排序：時間新 -> 舊
  const displayLogs = logs.slice().sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).filter(l =>
    search === '' ||
    `${l.time} ${l.tank} ${l.action} ${l.zone} ${l.slot || ''} ${l.content} ${l.user} ${l.remark}`.toUpperCase().includes(search.toUpperCase())
  );

  // 處理刪除 (帶防呆確認)
  const handleDelete = (id: string) => { // 注意：這裡 id 可能是 number (Supabase) 或 string，請依實際情況調整
    if (confirm('警告：確定要刪除這筆紀錄嗎？此動作無法復原。')) {
      if (onDelete) onDelete(id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1920px] mx-auto animate-fade-in">

      {/* 標題與搜尋 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">歷史紀錄</h2>
          <p className="text-slate-500 text-sm">
            System Logs & History
            {/* 顯示偵錯用標籤，確認 isSuper 狀態 */}
            {isSuper && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs ml-2 font-bold border border-red-200">SUPER USER</span>}
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center w-full md:w-96">
          <i className="fa-solid fa-magnifying-glass text-slate-300 mr-3"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full outline-none bg-transparent text-slate-600 placeholder-slate-300"
            placeholder="搜尋任意關鍵字..."
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">時間 (Time)</th>
                <th className="p-4">槽號 (Tank ID)</th>
                <th className="p-4">動作 (Action)</th>
                <th className="p-4">內容物 (Content)</th>
                <th className="p-4">區域 (Zone)</th>
                <th className="p-4">儲位 (Slot)</th>
                <th className="p-4 text-right">淨重 (Net)</th>
                <th className="p-4">備註 (Remark)</th>
                <th className="p-4">人員 (User)</th>
                {/* ★ 只有 Super User 才會看到管理欄位標題 */}
                {isSuper && <th className="p-4 text-center bg-red-50 text-red-500">管理 (Admin)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={isSuper ? 10 : 9} className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                    <i className="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
                    <span>查無符合紀錄</span>
                  </td>
                </tr>
              ) : (
                displayLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition group">
                    <td className="p-4 text-slate-500 text-xs">
                      <div className="font-bold text-slate-700">{l.time.split('T')[0]}</div>
                      <div className="scale-90 origin-left opacity-70">{l.time.split('T')[1]?.substring(0, 5)}</div>
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

                    {/* ★ 只有 Super User 才會看到按鈕 */}
                    {isSuper && (
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => onEdit && onEdit(l)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition"
                            title="編輯紀錄"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            onClick={() => l.id && handleDelete(String(l.id))} // 轉型確保安全
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
      </div>
    </div>
  );
};

export default Logs;