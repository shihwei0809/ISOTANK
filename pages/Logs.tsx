import React, { useState } from 'react';
import { LogEntry } from '../types';

interface LogsProps {
  logs: LogEntry[];
  isSuper: boolean; // ★ 新增：超級使用者權限旗標，由父層傳入
  onDelete?: (id: number) => void; // ★ 修正：ID 為 number
  onEdit?: (entry: LogEntry) => void; // ★ 新增：編輯功能的回呼函數
}

const Logs: React.FC<LogsProps> = ({ logs, isSuper, onDelete, onEdit }) => {
  const [search, setSearch] = useState('');

  // Sort by time descending
  const displayLogs = logs.slice().sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).filter(l =>
    search === '' ||
    `${l.time} ${l.tank} ${l.action} ${l.zone} ${l.slot || ''} ${l.content} ${l.user} ${l.remark} `.toUpperCase().includes(search.toUpperCase())
  );

  // 匯出 CSV
  const handleExport = () => {
    const header = ['時間', '槽號', '動作', '內容物', '區域', '儲位', '重量', '備註', '操作人員'];
    const rows = displayLogs.map(l => [
      l.time,
      l.tank,
      l.action,
      l.content,
      l.zone,
      l.slot || '',
      l.weight,
      l.remark || '',
      l.user
    ]);

    const csvContent = [
      '\uFEFF' + header.join(','), // BOM for Excel
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // 處理刪除點擊
  const handleDeleteClick = (id: number) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？此操作無法復原。')) {
      if (onDelete) onDelete(id);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-slate-800 mr-4">進出紀錄</h2>
          {/* 顯示目前權限狀態提示 */}
          {isSuper && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">ADMIN MODE</span>}
        </div>

        <div className="bg-white p-2 px-4 rounded-xl shadow-sm border border-slate-100 flex items-center w-full md:w-auto">
          <i className="fa-solid fa-search text-slate-300 mr-3"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 outline-none bg-transparent"
            placeholder="搜尋關鍵字..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b text-slate-500 font-bold">
              <tr>
                <th className="p-4">時間</th>
                <th className="p-4">槽號</th>
                <th className="p-4">動作</th>
                <th className="p-4">內容物</th>
                <th className="p-4">區域</th>
                <th className="p-4">儲位</th>
                <th className="p-4 text-right">淨重</th>
                <th className="p-4">備註</th>
                <th className="p-4">操作人員</th>
                {/* ★ 只有超級使用者才顯示此標題 */}
                {isSuper && <th className="p-4 text-center bg-red-50 text-red-500">管理</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayLogs.length === 0 ? (
                <tr><td colSpan={isSuper ? 10 : 9} className="p-8 text-center text-slate-400">無紀錄</td></tr>
              ) : (
                displayLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-500">
                      <div>{l.time.split('T')[0]}</div>
                      <div className="text-xs opacity-70">{l.time.split('T')[1]?.substring(0, 5)}</div>
                    </td>
                    <td className="p-4 font-bold font-mono text-slate-700">{l.tank}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${l.action === '進場' ? 'bg-green-100 text-green-700' :
                        l.action === '出場' ? 'bg-red-100 text-red-700' :
                          l.action === '移區' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{l.content}</td>
                    <td className="p-4 text-slate-600">{l.zone}</td>
                    <td className="p-4 text-blue-600 font-bold">{l.slot || '-'}</td>
                    <td className="p-4 font-mono text-right">{Number(l.weight).toLocaleString()}</td>
                    <td className="p-4 text-slate-500 text-xs truncate max-w-[150px]" title={l.remark}>{l.remark || '-'}</td>
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center mr-1 text-slate-500">
                          {l.user.charAt(0).toUpperCase()}
                        </div>
                        {l.user}
                      </div>
                    </td>
                    {/* ★ 只有超級使用者才顯示操作按鈕 */}
                    {isSuper && (
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEdit && onEdit(l)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded transition" title="編輯">
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(l.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition" title="刪除">
                            <i className="fa-solid fa-trash-can"></i>
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